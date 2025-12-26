#!/usr/bin/env python3
"""
CLI Principal do Indexador de Provas Mentori

Uso:
    python run.py parse <prova.pdf> [--gabarito <gabarito.pdf>]
    python run.py batch <pasta_com_pdfs>
    python run.py test

Exemplos:
    python run.py parse ~/Downloads/pf_agente_2024.pdf --gabarito ~/Downloads/pf_gabarito_2024.pdf
    python run.py test
"""

import sys
import os
from pathlib import Path

# Adicionar diretório ao path
sys.path.insert(0, str(Path(__file__).parent))

from parser import parse_pdf, merge_with_gabarito, generate_ids, flatten_questions
import json


def cmd_parse(args):
    """Parseia um PDF de prova."""
    if len(args) < 1:
        print("Uso: python run.py parse <prova.pdf> [--gabarito <gabarito.pdf>]")
        return

    prova_path = args[0]
    gabarito_path = None

    if "--gabarito" in args:
        idx = args.index("--gabarito")
        if idx + 1 < len(args):
            gabarito_path = args[idx + 1]

    # Importar e rodar parser
    from parser import main as parser_main
    sys.argv = ["parser.py", prova_path]
    if gabarito_path:
        sys.argv.extend(["--gabarito", gabarito_path])

    parser_main()


def cmd_test():
    """Testa o parser com um PDF de exemplo."""
    print("🧪 Modo de Teste")
    print("=" * 50)

    # Verificar se há PDFs de teste
    test_dir = Path(__file__).parent / "test_pdfs"
    if not test_dir.exists():
        print(f"\n⚠️  Pasta de teste não encontrada: {test_dir}")
        print("\nPara testar, crie a pasta e adicione PDFs:")
        print(f"  mkdir -p {test_dir}")
        print(f"  # Baixe uma prova do CEBRASPE e coloque lá")
        print("\nOu use diretamente:")
        print("  python run.py parse <caminho_do_pdf>")
        return

    pdfs = list(test_dir.glob("*.pdf"))
    if not pdfs:
        print(f"\n⚠️  Nenhum PDF encontrado em {test_dir}")
        return

    print(f"\n📁 PDFs encontrados: {len(pdfs)}")
    for pdf in pdfs:
        print(f"  - {pdf.name}")

    # Parsear o primeiro
    first_pdf = pdfs[0]
    print(f"\n🔄 Parsing: {first_pdf.name}")

    from parser import main as parser_main
    sys.argv = ["parser.py", str(first_pdf)]
    parser_main()


def cmd_batch(args):
    """Processa todos os PDFs de uma pasta."""
    if len(args) < 1:
        print("Uso: python run.py batch <pasta_com_pdfs>")
        return

    pasta = Path(args[0])
    if not pasta.exists():
        print(f"❌ Pasta não encontrada: {pasta}")
        return

    pdfs = list(pasta.glob("*.pdf"))
    print(f"\n📁 Encontrados {len(pdfs)} PDFs em {pasta}")

    for i, pdf in enumerate(pdfs, 1):
        print(f"\n[{i}/{len(pdfs)}] Processing: {pdf.name}")
        try:
            from parser import main as parser_main
            sys.argv = ["parser.py", str(pdf)]
            parser_main()
        except Exception as e:
            print(f"❌ Erro: {e}")


def cmd_help():
    """Mostra ajuda."""
    print(__doc__)


def main():
    if len(sys.argv) < 2:
        cmd_help()
        return

    command = sys.argv[1]
    args = sys.argv[2:]

    commands = {
        "parse": cmd_parse,
        "test": lambda _: cmd_test(),
        "batch": cmd_batch,
        "help": lambda _: cmd_help(),
    }

    if command in commands:
        commands[command](args)
    else:
        print(f"❌ Comando desconhecido: {command}")
        cmd_help()


if __name__ == "__main__":
    main()
