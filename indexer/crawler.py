#!/usr/bin/env python3
"""
Crawler de Provas CEBRASPE

Baixa automaticamente provas e gabaritos do CDN do CEBRASPE.

Uso:
    python crawler.py list              # Lista concursos conhecidos
    python crawler.py download pf_21    # Baixa provas do PF 2021
    python crawler.py download --all    # Baixa todos os concursos
    python crawler.py scan pf_25        # Escaneia arquivos de um concurso
"""

import re
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# Configuração
DOWNLOAD_DIR = Path(__file__).parent / "downloads"
OUTPUT_DIR = Path(__file__).parent / "output"
CDN_BASE = "https://cdn.cebraspe.org.br/concursos"

# Catálogo de concursos POLICIAIS (foco principal)
# Formato: código usado no CDN, nome amigável, ano
CONCURSOS = {
    # ===== POLÍCIA FEDERAL =====
    "pf_21": {"nome": "Polícia Federal", "ano": 2021, "cargos": ["agente", "delegado", "escrivao", "papiloscopista"]},
    "pf_18": {"nome": "Polícia Federal", "ano": 2018, "cargos": ["agente", "delegado", "escrivao"]},
    "pf_14": {"nome": "Polícia Federal", "ano": 2014, "cargos": ["agente", "delegado"]},
    "pf_12": {"nome": "Polícia Federal", "ano": 2012, "cargos": ["agente", "delegado"]},
    # ===== POLÍCIA RODOVIÁRIA FEDERAL =====
    "prf_21": {"nome": "PRF", "ano": 2021, "cargos": ["policial"]},
    "prf_18": {"nome": "PRF", "ano": 2018, "cargos": ["policial"]},
    "prf_13": {"nome": "PRF", "ano": 2013, "cargos": ["policial"]},
    # ===== DEPEN (Penitenciária Federal) =====
    "depen_21": {"nome": "DEPEN", "ano": 2021, "cargos": ["agente", "especialista"]},
    "depen_20": {"nome": "DEPEN", "ano": 2020, "cargos": ["agente"]},
    "depen_15": {"nome": "DEPEN", "ano": 2015, "cargos": ["agente"]},
    # ===== POLÍCIA CIVIL DF =====
    "pc_df_24_adm": {"nome": "PCDF", "ano": 2024, "cargos": ["agente", "escrivao"]},
    "pcdf_21": {"nome": "PCDF", "ano": 2021, "cargos": ["agente", "escrivao", "delegado"]},
    "pcdf_20": {"nome": "PCDF", "ano": 2020, "cargos": ["agente", "escrivao"]},
    # ===== POLÍCIA CIVIL ESTADOS =====
    "pc_pe_23": {"nome": "PCPE", "ano": 2023, "cargos": ["agente", "escrivao", "delegado"]},
    "pc_pa_21": {"nome": "PCPA", "ano": 2021, "cargos": ["investigador", "escrivao"]},
    "pc_rj_21": {"nome": "PCRJ", "ano": 2021, "cargos": ["investigador", "inspetor"]},
    "pc_ce_21": {"nome": "PCCE", "ano": 2021, "cargos": ["inspetor", "escrivao"]},
    "pc_al_21": {"nome": "PCAL", "ano": 2021, "cargos": ["agente", "escrivao"]},
    "pc_se_21": {"nome": "PCSE", "ano": 2021, "cargos": ["agente", "delegado"]},
    "pc_ba_21": {"nome": "PCBA", "ano": 2021, "cargos": ["investigador", "escrivao"]},
    # ===== POLÍCIA MILITAR =====
    "pm_df_18": {"nome": "PMDF", "ano": 2018, "cargos": ["soldado", "oficial"]},
    "cbm_df_16": {"nome": "Bombeiros DF", "ano": 2016, "cargos": ["soldado", "oficial"]},
    # ===== POLÍCIA PENAL =====
    "pp_mg_21": {"nome": "PP-MG", "ano": 2021, "cargos": ["agente"]},
    "pp_ce_21": {"nome": "PP-CE", "ano": 2021, "cargos": ["policial_penal"]},
    # ===== ABIN =====
    "abin_18": {"nome": "ABIN", "ano": 2018, "cargos": ["oficial", "agente"]},
}

# Padrões de arquivos de prova no CDN
PROVA_PATTERNS = [
    r".*_CB\d?_?\d*\.PDF$",  # Caderno de prova (ex: 021_PCDF_CB2_01.PDF)
    r".*CARGO.*\.PDF$",  # Por cargo (ex: CARGO_2_AGENTE.PDF)
    r".*PROVA.*\.PDF$",  # Prova explícita
    r".*CADERNO.*\.PDF$",  # Caderno
    r"\d{3}_[A-Z]+_\d+\.PDF$",  # Padrão numérico
]

GABARITO_PATTERNS = [
    r".*GAB.*\.PDF$",  # Gabarito
    r".*GABARITO.*\.PDF$",  # Gabarito explícito
]


def scan_concurso(codigo: str) -> dict:
    """
    Escaneia os arquivos disponíveis para um concurso no CDN.
    Retorna dict com provas e gabaritos encontrados.
    """
    url = f"{CDN_BASE}/{codigo}/arquivos/"

    print(f"🔍 Escaneando {url}...")

    try:
        # Tentar listar diretório (alguns servidores permitem)
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            print(f"❌ Não foi possível acessar {url}")
            return {"provas": [], "gabaritos": [], "outros": []}

        # Parse HTML para encontrar links
        soup = BeautifulSoup(response.text, "html.parser")
        links = soup.find_all("a", href=True)

        arquivos: dict[str, list[dict[str, str]]] = {"provas": [], "gabaritos": [], "outros": []}

        for link in links:
            href = link["href"]
            if not href.endswith(".PDF") and not href.endswith(".pdf"):
                continue

            filename = href.split("/")[-1].upper()
            full_url = f"{CDN_BASE}/{codigo}/arquivos/{filename}"

            # Classificar arquivo
            is_prova = any(re.match(p, filename) for p in PROVA_PATTERNS)
            is_gabarito = any(re.match(p, filename) for p in GABARITO_PATTERNS)

            if is_gabarito:
                arquivos["gabaritos"].append({"nome": filename, "url": full_url})
            elif is_prova:
                arquivos["provas"].append({"nome": filename, "url": full_url})
            else:
                arquivos["outros"].append({"nome": filename, "url": full_url})

        print(f"✅ Encontrados: {len(arquivos['provas'])} provas, {len(arquivos['gabaritos'])} gabaritos")
        return arquivos

    except Exception as e:
        print(f"❌ Erro ao escanear: {e}")
        return {"provas": [], "gabaritos": [], "outros": []}


def try_known_urls(codigo: str) -> dict:
    """
    Tenta URLs conhecidas baseadas em padrões comuns do CEBRASPE.
    """
    # info = CONCURSOS.get(codigo, {}) # Unused

    # Padrões comuns de URL
    patterns = [
        # Padrão com número sequencial
        f"{CDN_BASE}/{codigo}/arquivos/{{num:03d}}_{codigo.upper()}_CB1_01.PDF",
        f"{CDN_BASE}/{codigo}/arquivos/{{num:03d}}_{codigo.upper()}_001_01.PDF",
        # Padrão por cargo
        f"{CDN_BASE}/{codigo}/arquivos/CARGO_{{cargo}}.PDF",
        # Padrão de gabarito
        f"{CDN_BASE}/{codigo}/arquivos/GAB_DEFINITIVO_{{num:03d}}_{codigo.upper()}_001_01.PDF",
    ]

    arquivos: dict[str, list[dict[str, str]]] = {"provas": [], "gabaritos": [], "outros": []}

    # Testar URLs com números sequenciais
    print(f"🔎 Testando URLs conhecidas para {codigo}...")

    for num in range(1, 20):  # Testa números de 001 a 019
        for pattern in patterns[:2]:  # Só padrões de prova
            url = pattern.format(num=num)
            try:
                resp = requests.head(url, timeout=5)
                if resp.status_code == 200:
                    filename = url.split("/")[-1]
                    arquivos["provas"].append({"nome": filename, "url": url})
                    print(f"  ✅ {filename}")
            except requests.RequestException:
                pass

    # Testar gabaritos
    for num in range(500, 900, 50):  # Gabaritos costumam ter números altos
        url = f"{CDN_BASE}/{codigo}/arquivos/GAB_DEFINITIVO_{num}_{codigo.upper()}_001_01.PDF"
        try:
            resp = requests.head(url, timeout=5)
            if resp.status_code == 200:
                filename = url.split("/")[-1]
                arquivos["gabaritos"].append({"nome": filename, "url": url})
                print(f"  ✅ {filename} (gabarito)")
        except requests.RequestException:
            pass

    return arquivos


def download_file(url: str, dest: Path) -> bool:
    """Baixa um arquivo."""
    try:
        response = requests.get(url, timeout=60, stream=True)
        if response.status_code == 200:
            with open(dest, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"❌ Erro ao baixar {url}: {e}")
    return False


def download_concurso(codigo: str, max_files: int = 10) -> list:
    """
    Baixa provas e gabaritos de um concurso.
    Retorna lista de arquivos baixados.
    """
    info = CONCURSOS.get(codigo, {"nome": codigo, "ano": 2024})

    print(f"\n{'='*60}")
    print(f"📥 Baixando: {info['nome']} ({info.get('ano', 'N/A')})")
    print(f"{'='*60}")

    # Criar diretório
    concurso_dir = DOWNLOAD_DIR / codigo
    concurso_dir.mkdir(parents=True, exist_ok=True)

    # Escanear arquivos disponíveis
    arquivos = scan_concurso(codigo)

    # Se não encontrou nada, tentar URLs conhecidas
    if not arquivos["provas"] and not arquivos["gabaritos"]:
        print("⚠️  Listagem não disponível, tentando URLs conhecidas...")
        arquivos = try_known_urls(codigo)

    if not arquivos["provas"]:
        print("❌ Nenhuma prova encontrada")
        return []

    # Baixar arquivos
    downloaded = []

    # Provas (limitar quantidade)
    provas_to_download = arquivos["provas"][:max_files]
    print(f"\n📄 Baixando {len(provas_to_download)} provas...")

    for item in provas_to_download:
        dest = concurso_dir / item["nome"].lower()
        if dest.exists():
            print(f"  ⏭️  {item['nome']} (já existe)")
            downloaded.append(str(dest))
            continue

        print(f"  ⬇️  {item['nome']}...", end=" ", flush=True)
        if download_file(item["url"], dest):
            print("✅")
            downloaded.append(str(dest))
        else:
            print("❌")

    # Gabaritos (pegar todos)
    if arquivos["gabaritos"]:
        print(f"\n📋 Baixando {len(arquivos['gabaritos'])} gabaritos...")
        for item in arquivos["gabaritos"]:
            dest = concurso_dir / item["nome"].lower()
            if dest.exists():
                print(f"  ⏭️  {item['nome']} (já existe)")
                continue

            print(f"  ⬇️  {item['nome']}...", end=" ", flush=True)
            if download_file(item["url"], dest):
                print("✅")
            else:
                print("❌")

    print(f"\n✅ {len(downloaded)} arquivos baixados em {concurso_dir}")
    return downloaded


def list_concursos():
    """Lista concursos disponíveis no catálogo."""
    print("\n📚 Concursos disponíveis no catálogo:")
    print("=" * 60)

    for codigo, info in sorted(CONCURSOS.items(), key=lambda x: -x[1].get("ano", 0)):
        print(f"  {codigo:<20} {info['nome']:<30} {info.get('ano', 'N/A')}")

    print("\n💡 Uso:")
    print("  python crawler.py download pf_21      # Baixar PF 2021")
    print("  python crawler.py download --all      # Baixar todos")
    print("  python crawler.py scan prf_21         # Ver arquivos disponíveis")


def download_all(max_per_concurso: int = 5):
    """Baixa provas de todos os concursos."""
    print("\n🚀 Iniciando download de todos os concursos...")

    total_downloaded = []

    for codigo in CONCURSOS.keys():
        try:
            files = download_concurso(codigo, max_files=max_per_concurso)
            total_downloaded.extend(files)
        except Exception as e:
            print(f"❌ Erro em {codigo}: {e}")

    print(f"\n{'='*60}")
    print(f"✅ TOTAL: {len(total_downloaded)} arquivos baixados")
    print(f"{'='*60}")

    return total_downloaded


def main():
    if len(sys.argv) < 2:
        list_concursos()
        return

    command = sys.argv[1].lower()

    if command == "list":
        list_concursos()

    elif command == "scan":
        if len(sys.argv) < 3:
            print("❌ Uso: python crawler.py scan <codigo_concurso>")
            return
        codigo = sys.argv[2].lower()
        arquivos = scan_concurso(codigo)

        print("\n📄 Provas encontradas:")
        for item in arquivos["provas"]:
            print(f"  - {item['nome']}")

        print("\n📋 Gabaritos encontrados:")
        for item in arquivos["gabaritos"]:
            print(f"  - {item['nome']}")

        print("\n📁 Outros arquivos:")
        for item in arquivos["outros"][:10]:
            print(f"  - {item['nome']}")

    elif command == "download":
        if len(sys.argv) < 3:
            print("❌ Uso: python crawler.py download <codigo_concurso>")
            print("       python crawler.py download --all")
            return

        target = sys.argv[2].lower()

        if target == "--all":
            download_all()
        else:
            if target not in CONCURSOS:
                print(f"⚠️  Concurso '{target}' não está no catálogo, mas tentando mesmo assim...")
            download_concurso(target)

    else:
        print(f"❌ Comando desconhecido: {command}")
        list_concursos()


if __name__ == "__main__":
    main()
