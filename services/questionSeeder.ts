/**
 * Question Seeder - Importa JSONs para IndexedDB
 *
 * Os JSONs são gerados pelo indexador Python (indexer/parser.py)
 * e ficam em public/data/*.json
 */

import { QuestionsDB, ConcursoQuestion } from './database';

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

      const questions: ConcursoQuestion[] = await response.json();

      // Importar em batch
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

  console.log(`[Seeder] Total importado: ${totalImported} questões`);
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
