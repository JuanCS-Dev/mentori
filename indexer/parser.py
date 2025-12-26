"""
Parser de Provas - Extrai questões de PDFs usando Vertex AI (Gemini)

Usa ADC (Application Default Credentials) - mesmo padrão do Genesis.

Uso:
    python parser.py <caminho_do_pdf> [--gabarito <caminho_gabarito>]
"""

import json
import sys
import re
from pathlib import Path

import vertexai
from vertexai.generative_models import GenerativeModel, Part

# Configuração Vertex AI
PROJECT_ID = "clinica-genesis-os-e689e"
LOCATION = "us-central1"
MODEL = "gemini-2.0-flash-001"

# Inicializar Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Chunk size para evitar truncamento (menor = menos risco de truncar)
QUESTIONS_PER_CHUNK = 10

METADATA_PROMPT = """
Analise este PDF de prova de concurso público.

Extraia APENAS os metadados e a quantidade de questões:

{
  "concurso": "nome completo do concurso",
  "banca": "CEBRASPE",
  "ano": 2021,
  "cargo": "nome do cargo",
  "total_questoes": 120
}

REGRAS:
- Retorne APENAS o JSON válido
- Conte quantas questões existem no total
"""

def get_chunk_prompt(start: int, end: int) -> str:
    """Gera prompt para extrair um chunk específico de questões."""
    return f"""
Analise este PDF de prova de concurso público CEBRASPE.

Extraia APENAS as questões de número {start} até {end} no formato JSON:

{{
  "questoes": [
    {{
      "numero": {start},
      "disciplina": "Português",
      "texto_id": "CB1A1",
      "texto_base": "texto de apoio COMPLETO",
      "comando": "Julgue os itens que se seguem, a partir das ideias veiculadas no texto CB1A1.",
      "enunciado": "afirmativa a ser julgada",
      "alternativas": ["Certo", "Errado"],
      "tipo": "certo_errado",
      "gabarito": 0
    }}
  ]
}}

=== ESTRUTURA CEBRASPE (CRÍTICO!) ===

As provas CEBRASPE seguem este padrão:

1. TEXTO DE APOIO (quando existe):
   - Identificado por código como "Texto CB1A1", "Texto CB2A1", etc.
   - Contém o conteúdo de referência (artigo, trecho literário, lei, etc.)
   - Campo "texto_id": código do texto (ex: "CB1A1")
   - Campo "texto_base": conteúdo COMPLETO do texto

2. COMANDO (frase introdutória):
   - Liga o texto às questões
   - Exemplos:
     * "Julgue os itens que se seguem, a partir das ideias veiculadas no texto CB1A1."
     * "Julgue os itens a seguir, relativos a aspectos linguísticos do texto CB1A1."
     * "No que diz respeito à fiscalização de peso e dimensões, julgue os itens a seguir."
   - Campo "comando": frase EXATA do PDF

3. ENUNCIADO (afirmativa):
   - A afirmativa numerada que o candidato deve julgar
   - Campo "enunciado": texto EXATO da afirmativa

=== REGRAS DE EXTRAÇÃO ===

1. Extraia APENAS questões de {start} a {end}
2. Preserve textos EXATAMENTE como estão no PDF
3. OTIMIZAÇÃO: Se várias questões compartilham o MESMO texto:
   - Inclua texto_base COMPLETO apenas na PRIMEIRA questão do grupo
   - Nas questões seguintes do mesmo grupo, use texto_base = "[VER TEXTO ACIMA]"
   - Sempre mantenha texto_id e comando em todas as questões
4. Se NÃO houver texto de apoio, deixe texto_id, texto_base e comando como strings vazias ""
5. Infira disciplina pelo contexto (Português, Direito Constitucional, Informática, etc.)

=== FORMATO DE ALTERNATIVAS ===

- CEBRASPE certo/errado: alternativas = ["Certo", "Errado"], tipo = "certo_errado"
- Múltipla escolha: alternativas = ["A) texto...", "B) texto...", ...], tipo = "multipla_escolha"
- Se houver imagem essencial: [IMAGEM: descrição breve] no campo apropriado

=== GABARITO (IMPORTANTE!) ===

- Campo "gabarito": índice da alternativa correta (0 = primeira, 1 = segunda, etc.)
- Para certo/errado: 0 = Certo, 1 = Errado
- Se o PDF tiver justificativa/gabarito, use-o
- Se NÃO tiver gabarito no PDF, INFIRA a resposta correta baseado no seu conhecimento
- Seja preciso - o gabarito é essencial para o funcionamento do app

Retorne APENAS o JSON válido, sem texto adicional.
"""

GABARITO_PROMPT = """
Analise este PDF de gabarito e extraia as respostas no formato JSON:

{
  "respostas": {
    "1": "C",
    "2": "E",
    "3": "A"
  }
}

REGRAS:
- Chave = número da questão (string)
- Valor = resposta correta ("C", "E", "A", "B", "C", "D", "E", ou "ANULADA")
- Retorne APENAS o JSON válido
"""


def load_pdf_as_part(pdf_path: str) -> Part:
    """Carrega PDF como Part para o Vertex AI."""
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    return Part.from_data(
        data=pdf_bytes,
        mime_type="application/pdf"
    )


def clean_json_response(text: str) -> str:
    """Limpa a resposta JSON do LLM."""
    text = text.strip()

    # Remover markdown code blocks se houver
    if text.startswith("```"):
        text = re.sub(r'^```json?\n?', '', text)
        text = re.sub(r'\n?```$', '', text)

    # Limpar problemas comuns do LLM
    # 1. Trailing commas antes de ] ou }
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    # 2. Remover caracteres de controle inválidos (mas manter newlines estruturais)
    text = re.sub(r'[\x00-\x09\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)

    # 3. Escapar newlines dentro de strings JSON
    # Abordagem: processar linha a linha, detectando contexto de string
    lines = text.split('\n')
    result = []
    in_string = False
    current_line = ""

    for line in lines:
        for char in line:
            if char == '"' and (not current_line or current_line[-1] != '\\'):
                in_string = not in_string
            current_line += char

        if in_string:
            # Ainda dentro de uma string, adicionar \n escapado
            current_line += "\\n"
        else:
            # Fora de string, manter newline estrutural
            result.append(current_line)
            current_line = ""

    if current_line:
        result.append(current_line)

    return '\n'.join(result)


def call_gemini(model: GenerativeModel, prompt: str, pdf_part: Part) -> dict:
    """Faz uma chamada ao Gemini e parseia o JSON."""
    response = model.generate_content(
        [prompt, pdf_part],
        generation_config={
            "temperature": 0.1,
            "max_output_tokens": 8192,  # Limite máximo do modelo
        }
    )

    text = clean_json_response(response.text)

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"⚠️  Erro ao parsear JSON: {e}")
        print(f"Resposta bruta (primeiros 1000 chars):\n{text[:1000]}...")
        # Salvar para debug
        debug_path = Path(__file__).parent / "output" / "debug_response.txt"
        debug_path.parent.mkdir(parents=True, exist_ok=True)
        with open(debug_path, "w", encoding="utf-8") as f:
            f.write(text)
        raise


def parse_pdf(pdf_path: str, is_gabarito: bool = False) -> dict:
    """Parseia um PDF usando Vertex AI Gemini."""

    model = GenerativeModel(MODEL)

    # Carregar PDF
    print(f"📤 Carregando {pdf_path}...")
    pdf_part = load_pdf_as_part(pdf_path)

    if is_gabarito:
        print(f"🤖 Extraindo gabarito...")
        return call_gemini(model, GABARITO_PROMPT, pdf_part)

    # Passo 1: Extrair metadados e total de questões
    print(f"🤖 Extraindo metadados...")
    metadata = call_gemini(model, METADATA_PROMPT, pdf_part)
    total = metadata.get("total_questoes", 120)
    print(f"📊 Prova: {metadata.get('concurso')} - {total} questões")

    # Passo 2: Extrair questões em chunks
    all_questions = []
    start = 1

    while start <= total:
        end = min(start + QUESTIONS_PER_CHUNK - 1, total)
        print(f"🤖 Extraindo questões {start}-{end}...")

        chunk_prompt = get_chunk_prompt(start, end)
        chunk_data = call_gemini(model, chunk_prompt, pdf_part)

        questions = chunk_data.get("questoes", [])
        all_questions.extend(questions)
        print(f"   ✅ {len(questions)} questões extraídas")

        start = end + 1

    # Montar resultado final
    result = {
        "concurso": metadata.get("concurso"),
        "banca": metadata.get("banca"),
        "ano": metadata.get("ano"),
        "cargo": metadata.get("cargo"),
        "questoes": all_questions
    }

    return result


def merge_with_gabarito(prova: dict, gabarito: dict) -> dict:
    """Junta as questões com o gabarito oficial."""

    respostas = gabarito.get("respostas", {})

    for q in prova.get("questoes", []):
        numero = str(q["numero"])
        resposta = respostas.get(numero, "")

        if resposta == "ANULADA":
            q["anulada"] = True
            q["gabarito"] = -1
        elif q["tipo"] == "certo_errado":
            q["gabarito"] = 0 if resposta == "C" else 1
        else:
            # Múltipla escolha: A=0, B=1, C=2, D=3, E=4
            mapping = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}
            q["gabarito"] = mapping.get(resposta, -1)

    return prova


def expand_text_references(prova: dict) -> dict:
    """Expande referências '[VER TEXTO ACIMA]' com o texto real."""

    # Cache de textos por texto_id
    textos_cache: dict = {}

    for q in prova.get("questoes", []):
        texto_id = q.get("texto_id", "")
        texto_base = q.get("texto_base", "")

        if texto_base and texto_base != "[VER TEXTO ACIMA]":
            # Armazenar no cache
            if texto_id:
                textos_cache[texto_id] = texto_base
        elif texto_base == "[VER TEXTO ACIMA]" and texto_id:
            # Expandir do cache
            q["texto_base"] = textos_cache.get(texto_id, "")

    return prova


def generate_ids(prova: dict) -> dict:
    """Gera IDs únicos para cada questão."""

    banca = prova.get("banca", "unknown").lower().replace(" ", "_")
    ano = prova.get("ano", 2024)
    cargo = prova.get("cargo", "cargo").lower().replace(" ", "_")[:20]

    for q in prova.get("questoes", []):
        numero = q["numero"]
        q["id"] = f"{banca}_{cargo}_{ano}_{numero:03d}"

    return prova


def flatten_questions(prova: dict) -> list:
    """Converte para lista flat de questões (formato final para o app)."""

    base = {
        "banca": prova.get("banca"),
        "concurso": prova.get("concurso"),
        "ano": prova.get("ano"),
        "cargo": prova.get("cargo")
    }

    questions = []
    for q in prova.get("questoes", []):
        question = {**base, **q}

        # Garantir que campos opcionais existam (mesmo que vazios)
        question.setdefault("texto_id", "")
        question.setdefault("texto_base", "")
        question.setdefault("comando", "")

        questions.append(question)

    return questions


def main():
    if len(sys.argv) < 2:
        print("Uso: python parser.py <prova.pdf> [--gabarito <gabarito.pdf>]")
        sys.exit(1)

    prova_path = sys.argv[1]
    gabarito_path = None

    # Parse argumentos
    if "--gabarito" in sys.argv:
        idx = sys.argv.index("--gabarito")
        if idx + 1 < len(sys.argv):
            gabarito_path = sys.argv[idx + 1]

    # Parsear prova
    print(f"\n📄 Parsing prova: {prova_path}")
    prova = parse_pdf(prova_path)
    print(f"✅ Extraídas {len(prova.get('questoes', []))} questões")

    # Parsear gabarito se fornecido
    if gabarito_path:
        print(f"\n📋 Parsing gabarito: {gabarito_path}")
        gabarito = parse_pdf(gabarito_path, is_gabarito=True)
        prova = merge_with_gabarito(prova, gabarito)
        print(f"✅ Gabarito aplicado")

    # Expandir referências de texto "[VER TEXTO ACIMA]"
    prova = expand_text_references(prova)

    # Gerar IDs
    prova = generate_ids(prova)

    # Flatten para formato final
    questions = flatten_questions(prova)

    # Salvar JSON
    output_name = Path(prova_path).stem + ".json"
    output_path = Path(__file__).parent / "output" / output_name
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Salvo em: {output_path}")
    print(f"📊 Total: {len(questions)} questões")

    # Preview
    if questions:
        print("\n📝 Preview da primeira questão:")
        preview = json.dumps(questions[0], ensure_ascii=False, indent=2)
        if len(preview) > 800:
            preview = preview[:800] + "..."
        print(preview)


if __name__ == "__main__":
    main()
