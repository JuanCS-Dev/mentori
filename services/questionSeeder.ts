/**
 * Question Seeder - Importa JSONs para IndexedDB
 *
 * Os JSONs são gerados pelo indexador Python (indexer/parser.py)
 * e ficam em public/data/*.json
 *
 * Features:
 * - Validação de schema antes de importar
 * - Deduplicação por hash (evita questões duplicadas)
 * - Estatísticas de importação
 */

import { QuestionsDB, ConcursoQuestion } from './database';

/**
 * Gera hash único para uma questão (para deduplicação)
 * Baseado em: enunciado + alternativas (ignora metadata)
 */
function generateQuestionHash(q: ConcursoQuestion): string {
  const content = `${q.enunciado}|${q.alternativas.join('|')}`;
  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) + content.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Set para rastrear hashes já importados (evita duplicatas)
const importedHashes = new Set<string>();

/**
 * Valida se uma questão tem os campos obrigatórios
 * Retorna a questão validada ou null se inválida
 */
function validateQuestion(q: unknown, index: number): ConcursoQuestion | null {
  // Type guard básico
  if (!q || typeof q !== 'object') {
    console.warn(`[Seeder] Questão ${index}: não é um objeto válido`);
    return null;
  }

  const question = q as Record<string, unknown>;

  // Campos obrigatórios
  const requiredFields = ['id', 'banca', 'ano', 'disciplina', 'enunciado', 'alternativas', 'gabarito'];

  for (const field of requiredFields) {
    if (!(field in question) || question[field] === undefined || question[field] === null) {
      console.warn(`[Seeder] Questão ${index}: campo obrigatório ausente: ${field}`);
      return null;
    }
  }

  // Validações de tipo
  if (typeof question.id !== 'string' || question.id.length === 0) {
    console.warn(`[Seeder] Questão ${index}: id inválido`);
    return null;
  }

  if (typeof question.ano !== 'number' || question.ano < 2000 || question.ano > 2030) {
    console.warn(`[Seeder] Questão ${index}: ano inválido: ${question.ano}`);
    return null;
  }

  if (!Array.isArray(question.alternativas) || question.alternativas.length < 2) {
    console.warn(`[Seeder] Questão ${index}: alternativas inválidas`);
    return null;
  }

  if (typeof question.gabarito !== 'number' || question.gabarito < 0) {
    console.warn(`[Seeder] Questão ${index}: gabarito inválido`);
    return null;
  }

  // Questão válida - fazer cast seguro
  return {
    id: question.id as string,
    banca: question.banca as string,
    concurso: (question.concurso as string) || '',
    ano: question.ano as number,
    cargo: (question.cargo as string) || '',
    numero: (question.numero as number) || index,
    disciplina: question.disciplina as string,
    texto_id: question.texto_id as string | undefined,
    texto_base: question.texto_base as string | undefined,
    comando: question.comando as string | undefined,
    enunciado: question.enunciado as string,
    alternativas: question.alternativas as string[],
    gabarito: question.gabarito as number,
    tipo: (question.tipo as 'certo_errado' | 'multipla_escolha') || 'multipla_escolha',
    anulada: (question.anulada as boolean) || false,
  };
}

/**
 * Valida um array de questões e retorna apenas as válidas
 * Também realiza deduplicação por hash
 */
function validateQuestions(data: unknown): { questions: ConcursoQuestion[]; stats: ImportStats } {
  const stats: ImportStats = {
    total: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0
  };

  if (!Array.isArray(data)) {
    console.warn('[Seeder] Dados não são um array');
    return { questions: [], stats };
  }

  stats.total = data.length;
  const validated: ConcursoQuestion[] = [];

  for (let i = 0; i < data.length; i++) {
    const valid = validateQuestion(data[i], i);
    if (!valid) {
      stats.invalid++;
      continue;
    }

    // Verificar duplicata por hash
    const hash = generateQuestionHash(valid);
    if (importedHashes.has(hash)) {
      stats.duplicates++;
      continue;
    }

    importedHashes.add(hash);
    validated.push(valid);
    stats.valid++;
  }

  if (stats.invalid > 0) {
    console.warn(`[Seeder] ${stats.invalid} questões inválidas ignoradas`);
  }
  if (stats.duplicates > 0) {
    console.warn(`[Seeder] ${stats.duplicates} questões duplicadas ignoradas`);
  }

  return { questions: validated, stats };
}

interface ImportStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
}

// Lista de arquivos JSON disponíveis
// Gerados pelo indexador Python (indexer/parser.py)
const DATA_FILES = [
  // === CEBRASPE ===
  '/data/pf_21_agente.json',      // PF 2021 - 120 questões
  '/data/prf_21_prova.json',      // PRF 2021 - 65 questões
  '/data/prf_18.json',            // PRF 2018 - 120 questões
  '/data/pcdf_24_cb2.json',       // PC-DF 2024 - 110 questões
  '/data/pcdf_20_agente.json',    // PC-DF 2020 - 50 questões
  '/data/depen_15.json',          // DEPEN 2015 - 120 questões
  '/data/petrobras_23_nm.json',   // Petrobras 2023 - 40 questões

  // === FGV ===
  '/data/pmsp_24_soldado.json',   // PM-SP 2024 - 60 questões

  // Total: 685 questões reais (CEBRASPE + FGV)
];

/**
 * Verifica se o banco precisa ser populado
 */
export async function needsSeeding(): Promise<boolean> {
  const count = await QuestionsDB.count();
  return count === 0;
}

/**
 * Importa todos os JSONs de questões para o IndexedDB
 */
export async function seedDatabase(onProgress?: (loaded: number, total: number) => void): Promise<number> {
  let totalImported = 0;
  let totalStats: ImportStats = { total: 0, valid: 0, invalid: 0, duplicates: 0 };

  // Limpar cache de hashes para nova importação
  importedHashes.clear();

  for (let i = 0; i < DATA_FILES.length; i++) {
    const file = DATA_FILES[i];
    if (!file) continue;

    try {
      console.log(`[Seeder] Carregando ${file}...`);

      const response = await fetch(file);
      if (!response.ok) {
        console.warn(`[Seeder] Arquivo não encontrado: ${file}`);
        continue;
      }

      const rawData: unknown = await response.json();

      // Validar e deduplicar questões antes de importar
      const { questions, stats } = validateQuestions(rawData);

      // Acumular estatísticas
      totalStats.total += stats.total;
      totalStats.valid += stats.valid;
      totalStats.invalid += stats.invalid;
      totalStats.duplicates += stats.duplicates;

      if (questions.length === 0) {
        console.warn(`[Seeder] Nenhuma questão válida em ${file}`);
        continue;
      }

      // Importar em batch (apenas questões validadas e únicas)
      const imported = await QuestionsDB.bulkImport(questions);
      totalImported += imported;

      console.log(`[Seeder] Importadas ${imported} questões de ${file}`);

      if (onProgress) {
        onProgress(i + 1, DATA_FILES.length);
      }
    } catch (error) {
      console.error(`[Seeder] Erro ao carregar ${file}:`, error);
    }
  }

  console.log(`[Seeder] === RESUMO ===`);
  console.log(`[Seeder] Total processado: ${totalStats.total}`);
  console.log(`[Seeder] Válidas: ${totalStats.valid}`);
  console.log(`[Seeder] Inválidas: ${totalStats.invalid}`);
  console.log(`[Seeder] Duplicadas: ${totalStats.duplicates}`);
  console.log(`[Seeder] Importadas: ${totalImported}`);

  return totalImported;
}

/**
 * Força reimportação do banco
 */
export async function reseedDatabase(): Promise<number> {
  console.log('[Seeder] Limpando banco existente...');
  await QuestionsDB.clear();
  return seedDatabase();
}

/**
 * Hook para inicialização automática
 * Chame isso no App.tsx ou em um useEffect
 */
export async function initializeQuestionBank(): Promise<{
  wasSeeded: boolean;
  questionCount: number;
}> {
  const needs = await needsSeeding();

  if (needs) {
    console.log('[Seeder] Banco vazio, iniciando seed...');
    const count = await seedDatabase();
    return { wasSeeded: true, questionCount: count };
  }

  const count = await QuestionsDB.count();
  console.log(`[Seeder] Banco já populado com ${count} questões`);
  return { wasSeeded: false, questionCount: count };
}
