import { QuestionsDB, ConcursoQuestion } from './database';
import { initializeQuestionBank } from './questionSeeder';
import { QuestionExplanation } from '../types';
import { FALLBACK_QUESTIONS } from './fallbackQuestions';

/**
 * Serviço de Questões Reais
 *
 * Integra com fontes públicas de questões de concursos e vestibulares.
 * - ENEM: API pública enem.dev
 * - CONCURSOS: IndexedDB via Dexie (dados do indexador Python)
 *
 * Feito com amor para o concurseiro que quer praticar com questões de verdade.
 */

// Promise-based mutex para evitar inicializações concorrentes
let dbInitPromise: Promise<{ wasSeeded: boolean; questionCount: number }> | null = null;

export interface RealQuestion {
  id: string;
  year: number;
  source: 'ENEM' | 'CONCURSO' | 'VESTIBULAR';
  discipline: string;
  topic?: string;
  // Estrutura CEBRASPE para textos de apoio
  contextId?: string;    // Código do texto (ex: "CB1A1")
  contextText?: string;  // Conteúdo do texto de apoio
  command?: string;      // Frase introdutória (ex: "Julgue os itens a seguir...")
  statement: string;
  options: string[];
  correctAnswer: number;
  imageUrl?: string;
  explanation?: string;
  difficulty?: 'Fácil' | 'Médio' | 'Difícil';
  bank?: string;
  role?: string;
  // AI-generated structured explanation
  aiExplanation?: QuestionExplanation;
}

export interface QuestionFilter {
  discipline?: string;
  year?: number;
  bank?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}

// Interface for ENEM API response
interface ENEMApiQuestion {
  context?: string;
  question: string;
  alternatives?: Array<{ text?: string } | string>;
  correct_alternative?: string;
  image_url?: string;
  explanation?: string;
}

// Mapeamento de disciplinas do ENEM para nomes amigáveis
const ENEM_DISCIPLINES: Record<string, string> = {
  'linguagens': 'Linguagens e Códigos',
  'humanas': 'Ciências Humanas',
  'natureza': 'Ciências da Natureza',
  'matematica': 'Matemática'
};

// Anos disponíveis do ENEM
const ENEM_YEARS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009];

/**
 * Serviço de Questões Reais
 */
export const QuestionsService = {
  /**
   * Buscar questões do ENEM via API pública
   * Referência: https://enem.dev/
   */
  async fetchENEMQuestions(filter: QuestionFilter = {}): Promise<RealQuestion[]> {
    try {
      const year = filter.year || ENEM_YEARS[0]; // Ano mais recente por padrão
      const discipline = filter.discipline?.toLowerCase() || 'linguagens';

      // A API enem.dev retorna questões por ano e área
      // Formato: https://enem.dev/api/v1/exams/{year}/{discipline}
      const apiUrl = `https://api.enem.dev/v1/exams/${year}/${discipline}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`ENEM API returned ${response.status}`);
        return this.getFallbackQuestions(filter);
      }

      const data = await response.json();

      // Mapear para nosso formato
      const questions: RealQuestion[] = data.questions?.map((q: ENEMApiQuestion, index: number) => ({
        id: `enem_${year}_${discipline}_${index}`,
        year,
        source: 'ENEM' as const,
        discipline: ENEM_DISCIPLINES[discipline] || discipline,
        statement: q.context ? `${q.context}\n\n${q.question}` : q.question,
        options: q.alternatives?.map((alt) =>
          typeof alt === 'string' ? alt : (alt.text || '')
        ) || [],
        correctAnswer: q.correct_alternative ?
          ['A', 'B', 'C', 'D', 'E'].indexOf(q.correct_alternative.toUpperCase()) : 0,
        imageUrl: q.image_url,
        explanation: q.explanation,
        difficulty: this.inferDifficulty(q)
      })) || [];

      // Aplicar limite
      const limit = filter.limit || 10;
      return questions.slice(0, limit);

    } catch (error) {
      console.error('Erro ao buscar questões do ENEM:', error);
      return this.getFallbackQuestions(filter);
    }
  },

  /**
   * Questoes de fallback quando a API nao esta disponivel
   */
  getFallbackQuestions(filter: QuestionFilter = {}): RealQuestion[] {
    let filtered = [...FALLBACK_QUESTIONS];

    if (filter.discipline) {
      const searchTerm = filter.discipline.toLowerCase();
      filtered = filtered.filter(q => {
        const disciplineLower = q.discipline.toLowerCase();
        const firstWord = disciplineLower.split(' ')[0] ?? '';
        return disciplineLower.includes(searchTerm) || searchTerm.includes(firstWord);
      });
    }

    if (filter.year) {
      filtered = filtered.filter(q => q.year === filter.year);
    }

    if (filter.difficulty) {
      filtered = filtered.filter(q => q.difficulty === filter.difficulty);
    }

    // Aplicar limite
    const limit = filter.limit || 10;
    return filtered.slice(0, limit);
  },

  /**
   * Inferir dificuldade baseado em características da questão
   */
  inferDifficulty(question: ENEMApiQuestion): 'Fácil' | 'Médio' | 'Difícil' {
    const textLength = (question.context?.length || 0) + (question.question?.length || 0);
    if (textLength > 500) return 'Difícil';
    if (textLength > 250) return 'Médio';
    return 'Fácil';
  },

  /**
   * Obter anos disponíveis
   */
  getAvailableYears(): number[] {
    return ENEM_YEARS;
  },

  /**
   * Obter disciplinas disponíveis
   */
  getAvailableDisciplines(): { value: string; label: string }[] {
    return Object.entries(ENEM_DISCIPLINES).map(([value, label]) => ({
      value,
      label
    }));
  },

  /**
   * Buscar questões de concursos públicos
   *
   * Usa IndexedDB (Dexie) com questões reais extraídas de PDFs.
   * Fallback para IA se o banco estiver vazio.
   */
  async fetchConcursoQuestions(filter: QuestionFilter = {}): Promise<RealQuestion[]> {
    // Promise-based mutex: evita race conditions em inicializações concorrentes
    if (!dbInitPromise) {
      console.log("🗃️ Inicializando banco de questões...");
      dbInitPromise = initializeQuestionBank();
    }

    const { questionCount } = await dbInitPromise;
    console.log(`✅ Banco pronto com ${questionCount} questões`);

    console.log("🔍 Buscando no Banco de Questões (Dexie)...", filter);

    // Buscar no IndexedDB
    const dbResults = await QuestionsDB.query({
      discipline: filter.discipline,
      bank: filter.bank,
      year: filter.year,
      tipo: filter.difficulty, // certo_errado, multipla_escolha, ou Qualquer
      limit: filter.limit || 10
    });

    // Converter para formato RealQuestion
    if (dbResults.length > 0) {
      console.log(`✅ Encontradas ${dbResults.length} questões no banco.`);
      return dbResults.map(this.convertToRealQuestion);
    }

    // Fallback para IA se banco vazio
    console.log("⚠️ Banco vazio para estes filtros. Acionando Gerador IA...");

    try {
      const { GeminiService } = await import('./geminiService');
      const discipline = filter.discipline || 'Direito Constitucional';
      const bank = filter.bank && filter.bank !== 'Todas' ? filter.bank : 'Banca Genérica';

      const q = await GeminiService.generateQuestion(
        discipline,
        filter.topic || 'Tópico Geral',
        bank,
        (filter.difficulty as string) || 'Médio'
      );

      return [{
        id: `ai_gen_${Date.now()}`,
        year: filter.year || 2024,
        source: 'CONCURSO' as const,
        discipline: q.discipline || discipline,
        topic: q.topic,
        statement: q.statement,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.comment,
        difficulty: q.difficulty as 'Fácil' | 'Médio' | 'Difícil',
        bank: bank
      }];

    } catch (e) {
      console.warn("Falha na geração AI de questões", e);
      return [];
    }
  },

  /**
   * Converte ConcursoQuestion (Dexie) para RealQuestion (UI)
   */
  convertToRealQuestion(q: ConcursoQuestion): RealQuestion {
    return {
      id: q.id,
      year: q.ano,
      source: 'CONCURSO' as const,
      discipline: q.disciplina,
      // Estrutura CEBRASPE
      contextId: q.texto_id,      // Código do texto (ex: "CB1A1")
      contextText: q.texto_base,  // Conteúdo do texto de apoio
      command: q.comando,         // Frase introdutória
      statement: q.enunciado,
      options: q.alternativas,
      correctAnswer: q.gabarito ?? 0, // Fallback para 0 se gabarito não disponível
      bank: q.banca,
      role: q.cargo,
      // Inferir dificuldade pelo tamanho do enunciado + texto base
      difficulty: (q.enunciado.length + (q.texto_base?.length || 0)) > 600 ? 'Difícil' :
                  (q.enunciado.length + (q.texto_base?.length || 0)) > 300 ? 'Médio' : 'Fácil',
      // AI-generated explanation (if available)
      aiExplanation: q.explicacao
    };
  },

  /**
   * Buscar questões erradas (Caderno de Erros)
   */
  async fetchErroredQuestions(limit = 20): Promise<RealQuestion[]> {
    const questions = await QuestionsDB.getErroredQuestions(limit);
    return questions.map(this.convertToRealQuestion);
  },

  /**
   * Obter estatísticas do banco
   */
  async getDatabaseStats(): Promise<{
    totalQuestions: number;
    bancas: string[];
    anos: number[];
    disciplinas: string[];
  }> {
    const [total, bancas, anos, disciplinas] = await Promise.all([
      QuestionsDB.count(),
      QuestionsDB.getBancas(),
      QuestionsDB.getAnos(),
      QuestionsDB.getDisciplinas()
    ]);

    return { totalQuestions: total, bancas, anos, disciplinas };
  },

  /**
   * Buscar todas as questões disponíveis (ENEM + Concursos AI)
   */
  async fetchAllQuestions(filter: QuestionFilter = {}): Promise<RealQuestion[]> {
    const [enemQuestions, concursoQuestions] = await Promise.all([
      this.fetchENEMQuestions(filter),
      this.fetchConcursoQuestions(filter)
    ]);

    return [...enemQuestions, ...concursoQuestions];
  }
};

// Cache local de questões para performance
const CACHE_KEY = 'mentori_questions_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export const QuestionsCache = {
  get(): RealQuestion[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { questions, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return questions;
    } catch {
      return null;
    }
  },

  set(questions: RealQuestion[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        questions,
        timestamp: Date.now()
      }));
    } catch {
      // Ignore storage errors
    }
  },

  clear(): void {
    localStorage.removeItem(CACHE_KEY);
  }
};
