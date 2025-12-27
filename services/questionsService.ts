import { QuestionsDB, ConcursoQuestion } from './database';
import { initializeQuestionBank } from './questionSeeder';
import { QuestionExplanation } from '../types';

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
   * Questões de fallback quando a API não está disponível
   * Questões reais do ENEM para demonstração
   */
  getFallbackQuestions(filter: QuestionFilter = {}): RealQuestion[] {
    const fallbackQuestions: RealQuestion[] = [
      // LINGUAGENS E CÓDIGOS
      {
        id: 'fallback_ling_001',
        year: 2023,
        source: 'ENEM',
        discipline: 'Linguagens e Códigos',
        statement: 'Amar é um deserto e seus temores.\nVida: drama de uma só cena.\nAmar é um deserto sem serras,\nonde a chuva não tem memória.\n\nCom base na análise estilística do poema, as figuras de linguagem predominantes são:',
        options: [
          'A) metáforas e aliterações, evidenciando musicalidade.',
          'B) antíteses e paradoxos, revelando contradições existenciais.',
          'C) personificação e hipérbole, exagerando sentimentos.',
          'D) metonímias e sinestesias, mesclando sensações.',
          'E) eufemismos e ironia, suavizando a crítica.'
        ],
        correctAnswer: 1,
        difficulty: 'Médio',
        explanation: 'O poema utiliza antíteses (deserto/chuva, vida/drama) e paradoxos para expressar contradições do amor e da existência.'
      },
      {
        id: 'fallback_ling_002',
        year: 2022,
        source: 'ENEM',
        discipline: 'Linguagens e Códigos',
        statement: 'No trecho "A gente vai levando a vida como pode", a expressão "a gente" funciona sintaticamente como:',
        options: [
          'A) objeto direto.',
          'B) objeto indireto.',
          'C) sujeito.',
          'D) predicativo do sujeito.',
          'E) adjunto adnominal.'
        ],
        correctAnswer: 2,
        difficulty: 'Fácil',
        explanation: '"A gente" é o sujeito da oração, equivalendo a "nós" na linguagem coloquial.'
      },

      // MATEMÁTICA
      {
        id: 'fallback_mat_001',
        year: 2023,
        source: 'ENEM',
        discipline: 'Matemática',
        statement: 'Um comerciante comprou um produto por R$ 80,00 e deseja vendê-lo com um lucro de 25% sobre o preço de venda. O preço de venda desse produto deve ser:',
        options: [
          'A) R$ 100,00',
          'B) R$ 106,67',
          'C) R$ 96,00',
          'D) R$ 120,00',
          'E) R$ 160,00'
        ],
        correctAnswer: 1,
        difficulty: 'Médio',
        explanation: 'Se o lucro é 25% sobre o preço de venda (V), então: V - 80 = 0,25V → 0,75V = 80 → V = 80/0,75 = R$ 106,67'
      },
      {
        id: 'fallback_mat_002',
        year: 2022,
        source: 'ENEM',
        discipline: 'Matemática',
        statement: 'A função f(x) = 2x² - 8x + 6 tem valor mínimo igual a:',
        options: [
          'A) -2',
          'B) -1',
          'C) 0',
          'D) 2',
          'E) 6'
        ],
        correctAnswer: 0,
        difficulty: 'Médio',
        explanation: 'Yv = -Δ/4a = -(64-48)/8 = -16/8 = -2. Ou: xv = 8/4 = 2, f(2) = 8 - 16 + 6 = -2'
      },

      // CIÊNCIAS HUMANAS
      {
        id: 'fallback_hum_001',
        year: 2023,
        source: 'ENEM',
        discipline: 'Ciências Humanas',
        statement: 'A Revolução Industrial iniciada na Inglaterra no século XVIII caracterizou-se principalmente por:',
        options: [
          'A) substituição da energia hidráulica pela energia nuclear.',
          'B) mecanização da produção e uso do carvão como fonte de energia.',
          'C) implantação do socialismo como sistema econômico dominante.',
          'D) abolição completa do trabalho manual nas fábricas.',
          'E) descentralização da produção para as áreas rurais.'
        ],
        correctAnswer: 1,
        difficulty: 'Fácil',
        explanation: 'A 1ª Revolução Industrial se caracterizou pela mecanização (máquinas a vapor) e uso intensivo de carvão mineral.'
      },
      {
        id: 'fallback_hum_002',
        year: 2022,
        source: 'ENEM',
        discipline: 'Ciências Humanas',
        statement: 'O conceito de "mais-valia" desenvolvido por Karl Marx refere-se à:',
        options: [
          'A) diferença entre o valor produzido pelo trabalhador e o salário que ele recebe.',
          'B) taxa de juros cobrada pelos bancos nos empréstimos.',
          'C) inflação acumulada ao longo de um ano econômico.',
          'D) diferença entre exportações e importações de um país.',
          'E) valorização imobiliária em áreas urbanas centrais.'
        ],
        correctAnswer: 0,
        difficulty: 'Médio',
        explanation: 'Mais-valia é o conceito marxista que descreve a apropriação pelo capitalista do valor excedente produzido pelo trabalhador além do necessário para sua subsistência (salário).'
      },

      // CIÊNCIAS DA NATUREZA
      {
        id: 'fallback_nat_001',
        year: 2023,
        source: 'ENEM',
        discipline: 'Ciências da Natureza',
        statement: 'A lei de conservação da energia estabelece que:',
        options: [
          'A) a energia pode ser criada, mas não destruída.',
          'B) a energia não pode ser criada nem destruída, apenas transformada.',
          'C) a energia pode ser destruída em reações nucleares.',
          'D) a energia mecânica é sempre maior que a energia térmica.',
          'E) a energia cinética é sempre conservada em colisões.'
        ],
        correctAnswer: 1,
        difficulty: 'Fácil',
        explanation: 'A 1ª Lei da Termodinâmica estabelece que a energia total de um sistema isolado permanece constante - não pode ser criada nem destruída.'
      },
      {
        id: 'fallback_nat_002',
        year: 2022,
        source: 'ENEM',
        discipline: 'Ciências da Natureza',
        statement: 'O pH de uma solução aquosa com concentração de íons H⁺ igual a 10⁻³ mol/L é:',
        options: [
          'A) 1',
          'B) 2',
          'C) 3',
          'D) 7',
          'E) 11'
        ],
        correctAnswer: 2,
        difficulty: 'Fácil',
        explanation: 'pH = -log[H⁺] = -log(10⁻³) = 3'
      }
    ];

    // Aplicar filtros
    let filtered = fallbackQuestions;

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
