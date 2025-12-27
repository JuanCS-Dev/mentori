import {
  Question,
  EditalJSON,
  BankProfileJSON,
  NeuroStudyPlanJSON,
  QuestionAutopsy,
  QuestionExplanation,
  MaterialJSON,
  DiscursiveTheme,
  DiscursiveEvaluation,
  StudyPlanParams,
  ChatContext
} from "../types";
import {
  getAIClient,
  getAIProviderInfo,
  withRetry,
  cleanAndParseJSON,
  MENTORI_SYSTEM_INSTRUCTION,
  MODEL_FLASH,
  MODEL_PRO,
  AIProvider
} from "./geminiConfig";

export type { AIProvider };

// =============================================================================
// GEMINI SERVICE
// =============================================================================

export const GeminiService = {
  getProviderInfo: getAIProviderInfo,

  async analyzeEdital(editalText: string): Promise<EditalJSON> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        Sua missao tatica agora e: DESTRINCHAR este edital.
        Transforme o texto cru em uma estrutura de dados JSON "Verticalizada" e "Sem Gordura".

        **ENTRADA ALVO:**
        ${editalText.substring(0, 30000)}

        **FORMATO DE SAIDA EXIGIDO (JSON UNICO):**
        {
          "metadata": {
            "banca": "string",
            "orgao": "string",
            "cargos": ["string"],
            "nivel_escolaridade": "string",
            "remuneracao": "string"
          },
          "cronograma": [ { "evento": "string", "data": "string", "critical": boolean } ],
          "fases": [ { "nome": "string", "carater": "string", "detalhes": "string" } ],
          "verticalizado": [ { "disciplina": "string", "peso": "string", "questoes": "string", "topicos": ["string"] } ],
          "alertas": ["string"]
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<EditalJSON>(response.text);
    }, 'analyzeEdital');
  },

  async analyzeBankProfile(textOrFiles: string): Promise<BankProfileJSON> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        Atue como o Maior Especialista em Inteligencia Competitiva de Concursos.
        Gere um "Dossie DNA" da banca, revelando seus segredos mais obscuros.

        **ALVO DE ANALISE:**
        ${textOrFiles}

        **FORMATO DE SAIDA (JSON):**
        {
          "perfil": { "nome": "string", "estilo": "string", "dificuldade": "string", "descricao_estilo": "string" },
          "dna_pegadinhas": [ { "tipo": "string", "exemplo": "string", "frequencia": "string" } ],
          "mapa_calor": [ { "materia": "string", "foco": "string", "frequencia": "string" } ],
          "jurisprudencia_preferida": ["string"],
          "vereditto_estrategico": "string"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<BankProfileJSON>(response.text);
    }, 'analyzeBankProfile');
  },

  async generateNeuroStudyPlan(params: StudyPlanParams): Promise<NeuroStudyPlanJSON> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        Voce esta vestindo seu chapeu de Neurocientista Cognitivo e Estrategista Militar.
        Crie um plano de guerra (estudos) Bio-Adaptativo para este soldado.

        DADOS DE INTELIGENCIA: ${JSON.stringify(params)}

        **FORMATO DE SAIDA (JSON):**
        {
          "diagnostico": { "perfil_cognitivo": "string", "estrategia_adotada": "string" },
          "rotina_matinal": ["string"],
          "blocos_estudo": [ { "horario": "string", "atividade": "string", "metodo": "string", "energia_exigida": "Alta|Media|Baixa", "motivo": "string" } ],
          "rotina_noturna": ["string"],
          "dopamina_triggers": ["string"]
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<NeuroStudyPlanJSON>(response.text);
    }, 'generateNeuroStudyPlan');
  },

  async generateQuestion(discipline: string, topic: string, bank: string, difficulty: string): Promise<Question> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        Gere uma Questao de Concurso INEDITA, nivel DE ELITE.
        Nao crie questoes obvias. Eu quero profundidade. Eu quero que o aluno precise PENSAR como um jurista.

        **PARAMETROS DA MISSAO:**
        - Disciplina: ${discipline}
        - Topico: ${topic}
        - Estilo da Banca: ${bank} (Mimetize o estilo de redacao desta banca perfeitamente)
        - Nivel de Dificuldade: ${difficulty} (Se for Dificil, quero jurisprudencia ou doutrina minoritaria)

        **REQUISITOS:**
        1. Enunciado robusto, contextualizado (nada de perguntas diretas e bobas). Crie um "Case" ou citando lei seca de forma inteligente.
        2. Alternativas plausiveis. A resposta errada deve ser sedutora (o "distrator").
        3. O comentario deve ser uma MINI-AULA. Explique o PORQUE, cite o artigo de lei, a sumula ou o autor.
        4. Identifique uma "trap" (pegadinha) possivel nesse tema.

        **FORMATO DE SAIDA (JSON):**
        {
          "discipline": "${discipline}", "topic": "${topic}", "difficulty": "${difficulty}",
          "statement": "Enunciado completo...",
          "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D", "Alternativa E"],
          "correctAnswer": 0-4,
          "comment": "Explicacao de Mestre: Aprofundada, tecnica e didatica.",
          "trap": "Atencao Guerreiro: Onde a banca tenta te derrubar neste ponto."
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<Question>(response.text);
    }, 'generateQuestion');
  },

  async generateSurgicalMaterial(topic: string, bankProfile: string): Promise<MaterialJSON> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        Gere um MATERIAL CIRURGICO (Pareto 80/20) sobre: "${topic}".
        Contexto Banca: ${bankProfile}

        **FORMATO DE SAIDA (JSON):**
        {
          "titulo": "string", "estimativa_leitura": "string", "raio_x": "string",
          "modulos": [ { "titulo": "string", "conteudo": "string", "tipo": "Teoria|Jurisprudencia" } ],
          "flashcards": [ { "front": "string", "back": "string" } ]
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<MaterialJSON>(response.text);
    }, 'generateSurgicalMaterial');
  },

  async analyzeQuestionError(statement: string, wrongAnswer: string, correctAnswer: string): Promise<QuestionAutopsy> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        O aluno errou. Isso e inaceitavel, mas pedagogico.
        Realize uma AUTOPSIA FORENSE deste erro. Nao tenha pena, tenha precisao.

        **DADOS DO CADAVER (ERRO):**
        - Questao: ${statement}
        - O que ele marcou (Errado): ${wrongAnswer}
        - O que era (Correto): ${correctAnswer}

        **SUA ANALISE:**
        1. **Diagnostico:** Por que ele errou? Falta de atencao? Desconhecimento de Lei? Caiu na pegadinha? Confundiu conceitos? Seja especifico.
        2. **Vacina Mental:** Que frase, mnemonico ou conceito ele nunca mais deve esquecer para nao errar isso de novo?
        3. **Explicacao Tecnica:** De a aula. Cite a fonte. Mostre a superioridade do conhecimento correto.

        **FORMATO DE SAIDA (JSON):**
        {
          "diagnostico_erro": "Diagnostico preciso e direto.",
          "explicacao_tecnica": "Aula magistral corrigindo o conceito.",
          "vacina_mental": "Frase de impacto para memorizacao definitiva.",
          "gravidade": "Alta|Media|Baixa"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<QuestionAutopsy>(response.text);
    }, 'analyzeQuestionError');
  },

  async generateExplanation(
    enunciado: string,
    alternativas: string[],
    gabarito: number,
    disciplina: string,
    banca?: string
  ): Promise<QuestionExplanation> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        Voce e o maior especialista em explicar questoes de concursos.
        Sua missao e gerar uma EXPLICACAO MAGISTRAL para esta questao.

        **QUESTAO:**
        - Banca: ${banca || 'Desconhecida'}
        - Disciplina: ${disciplina}
        - Enunciado: ${enunciado}
        - Alternativas:
          ${alternativas.map((alt, i) => `${String.fromCharCode(65 + i)}) ${alt}`).join('\n          ')}
        - Gabarito: ${String.fromCharCode(65 + gabarito)} (${alternativas[gabarito]})

        **INSTRUCOES:**
        1. Explique POR QUE a alternativa correta esta certa (fundamentacao juridica/tecnica)
        2. Explique POR QUE cada alternativa errada esta incorreta
        3. Cite a fundamentacao legal (artigos de lei, sumulas, jurisprudencia STF/STJ)
        4. Crie uma DICA MEMORAVEL (mnemonico, frase de impacto) para fixacao
        5. Liste temas relacionados para aprofundamento

        **FORMATO DE SAIDA (JSON):**
        {
          "explicacao_correta": "Explicacao completa e didatica da resposta correta...",
          "alternativas_erradas": [
            { "indice": 0, "texto": "Texto da alternativa A", "motivo": "Por que esta errada" },
            ...
          ],
          "fundamentacao": "Art. X da Lei Y, Sumula Z do STF...",
          "dica_memoravel": "Frase de impacto para nunca mais esquecer",
          "temas_relacionados": ["Tema 1", "Tema 2"],
          "nivel_dificuldade": "facil|medio|dificil|expert"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<QuestionExplanation>(response.text);
    }, 'generateExplanation');
  },

  async generateExplanationsBatch(
    questions: Array<{
      id: string;
      enunciado: string;
      alternativas: string[];
      gabarito: number;
      disciplina: string;
      banca?: string;
    }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, QuestionExplanation>> {
    const results = new Map<string, QuestionExplanation>();
    const total = questions.length;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q) continue;

      try {
        const explanation = await this.generateExplanation(
          q.enunciado,
          q.alternativas,
          q.gabarito,
          q.disciplina,
          q.banca
        );
        results.set(q.id, explanation);

        if (onProgress) {
          onProgress(i + 1, total);
        }
      } catch (error) {
        console.error(`[GeminiService] Erro ao gerar explicacao para ${q.id}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  },

  async generateDiscursiveTheme(cargo: string, banca: string, editalContext: string): Promise<DiscursiveTheme> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        Gere um TEMA DE PROVA DISCURSIVA para ${cargo} (${banca}).
        Contexto: ${editalContext}

        **FORMATO DE SAIDA (JSON):**
        { "titulo": "string", "enunciado": "string", "quesitos": ["string"], "instrucoes": "string" }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<DiscursiveTheme>(response.text);
    }, 'generateDiscursiveTheme');
  },

  async evaluateDiscursive(theme: DiscursiveTheme, studentText: string, banca: string): Promise<DiscursiveEvaluation> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        Avalie a redacao do aluno (Banca ${banca}).
        Tema: ${JSON.stringify(theme)} | Texto Aluno: ${studentText}

        **FORMATO DE SAIDA (JSON):**
        {
          "pontuacao": { "total": number, "conteudo": number, "estrutura": number, "gramatica": number },
          "parecer_pedagogico": "string",
          "erros_identificados": [ { "trecho": "string", "correcao": "string", "motivo": "string" } ],
          "espelho_ideal": "string"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<DiscursiveEvaluation>(response.text);
    }, 'evaluateDiscursive');
  },

  async roastEdital(editalSummary: string): Promise<{ roast: string, shareableQuote: string }> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        Voce e um comediante de stand-up acido e especialista em concursos.
        Faca um "ROAST" (fritada) brutal e honesta sobre este edital.

        CONTEXTO:
        ${editalSummary}

        OBJETIVO:
        Humilhar a dificuldade da prova, a baixa remuneracao (se for o caso), ou a insanidade das materias.
        O tom deve ser: Sarcastico, Desesperador, mas Engracado.

        **FORMATO DE SAIDA (JSON):**
        {
          "roast": "Texto de 3 paragrafos destruindo o edital.",
          "shareableQuote": "Uma frase curta e impactante para postar no Twitter/Instagram."
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<{ roast: string, shareableQuote: string }>(response.text);
    }, 'roastEdital');
  },

  async *mentorChat(
    userMessage: string,
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
    context?: ChatContext,
    useProModel: boolean = false
  ): AsyncGenerator<string> {
    const FUNCTION_URL = import.meta.env.VITE_MENTOR_CHAT_URL ||
      'http://127.0.0.1:5001/clinica-genesis-os-e689e/us-central1/mentorChat';

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        history,
        context,
        useProModel,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              yield parsed.text;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
};
