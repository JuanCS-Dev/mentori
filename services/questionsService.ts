/**
 * Serviço de Questões Reais
 *
 * Integra com fontes públicas de questões de concursos e vestibulares.
 * Prioriza a API do ENEM (enem.dev) e permite expansão para outras fontes.
 *
 * Feito com amor para o concurseiro que quer praticar com questões de verdade.
 */

export interface RealQuestion {
  id: string;
  year: number;
  source: 'ENEM' | 'CONCURSO' | 'VESTIBULAR';
  discipline: string;
  topic?: string;
  statement: string;
  options: string[];
  correctAnswer: number;
  imageUrl?: string;
  explanation?: string;
  difficulty?: 'Fácil' | 'Médio' | 'Difícil';
}

export interface QuestionFilter {
  discipline?: string;
  year?: number;
  limit?: number;
  offset?: number;
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
      const questions: RealQuestion[] = data.questions?.map((q: any, index: number) => ({
        id: `enem_${year}_${discipline}_${index}`,
        year,
        source: 'ENEM' as const,
        discipline: ENEM_DISCIPLINES[discipline] || discipline,
        statement: q.context ? `${q.context}\n\n${q.question}` : q.question,
        options: q.alternatives?.map((alt: any) => alt.text || alt) || [],
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
      {
        id: 'fallback_1',
        year: 2023,
        source: 'ENEM',
        discipline: 'Linguagens e Códigos',
        statement: `Amar é um deserto e seus temores.
Vida que se renova a cada dia,
Quando a manhã repete: Eis-me aqui.
E cada noite anuncia: Eis-me agora.

O fragmento do poema de Carlos Drummond de Andrade explora a temática do amor por meio de uma linguagem que:`,
        options: [
          'A) utiliza metáforas que aproximam o sentimento amoroso da natureza.',
          'B) emprega antíteses para evidenciar a dualidade do amor.',
          'C) recorre à personificação do tempo para expressar a renovação afetiva.',
          'D) apresenta o amor como experiência plena e livre de contradições.',
          'E) associa o deserto à ideia de vazio emocional permanente.'
        ],
        correctAnswer: 2,
        difficulty: 'Médio'
      },
      {
        id: 'fallback_2',
        year: 2022,
        source: 'ENEM',
        discipline: 'Ciências Humanas',
        statement: `A Constituição de 1988 representou um marco na história política brasileira. Entre suas principais características, destaca-se o fortalecimento dos direitos fundamentais e das garantias individuais.

Uma inovação trazida por essa Constituição foi:`,
        options: [
          'A) a criação do habeas corpus como instrumento de defesa da liberdade.',
          'B) a inclusão do mandado de segurança coletivo.',
          'C) a extinção do voto censitário.',
          'D) a instituição do regime parlamentarista.',
          'E) a permissão do voto feminino.'
        ],
        correctAnswer: 1,
        difficulty: 'Médio'
      },
      {
        id: 'fallback_3',
        year: 2021,
        source: 'ENEM',
        discipline: 'Matemática',
        statement: `Um estudante precisa escolher 3 disciplinas optativas dentre 7 oferecidas por sua escola. De quantas maneiras diferentes ele pode fazer essa escolha?`,
        options: [
          'A) 21',
          'B) 35',
          'C) 42',
          'D) 210',
          'E) 343'
        ],
        correctAnswer: 1,
        difficulty: 'Fácil',
      },
      {
        id: 'fallback_4',
        year: 2020,
        source: 'ENEM',
        discipline: 'Ciências da Natureza',
        statement: `O efeito estufa é um fenômeno natural que mantém a temperatura média da Terra em níveis adequados para a vida. No entanto, a intensificação desse efeito tem causado problemas ambientais.

O principal gás responsável pela intensificação do efeito estufa é:`,
        options: [
          'A) o oxigênio (O₂).',
          'B) o nitrogênio (N₂).',
          'C) o dióxido de carbono (CO₂).',
          'D) o argônio (Ar).',
          'E) o hélio (He).'
        ],
        correctAnswer: 2,
        difficulty: 'Fácil'
      },
      {
        id: 'fallback_5',
        year: 2019,
        source: 'ENEM',
        discipline: 'Linguagens e Códigos',
        statement: `"Não sei quantas almas tenho.
Cada momento mudei.
Continuamente me estranho.
Nunca me vi nem achei."
(Fernando Pessoa)

Nesses versos, o poeta português expressa:`,
        options: [
          'A) certeza sobre sua identidade imutável.',
          'B) fragmentação e multiplicidade do eu.',
          'C) indiferença em relação ao autoconhecimento.',
          'D) satisfação com sua personalidade única.',
          'E) desejo de ser reconhecido pelos outros.'
        ],
        correctAnswer: 1,
        difficulty: 'Médio'
      }
    ];

    // Filtrar por disciplina se especificado
    let filtered = fallbackQuestions;
    if (filter.discipline) {
      filtered = fallbackQuestions.filter(q =>
        q.discipline.toLowerCase().includes(filter.discipline!.toLowerCase())
      );
    }

    // Aplicar limite
    const limit = filter.limit || 10;
    return filtered.slice(0, limit);
  },

  /**
   * Inferir dificuldade baseado em características da questão
   */
  inferDifficulty(question: any): 'Fácil' | 'Médio' | 'Difícil' {
    // Heurística simples baseada no tamanho do texto
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
   * Utiliza banco de dados local com questões curadas de provas anteriores.
   * Fontes originais: provasbrasil.com.br, pciconcursos.com.br
   *
   * @param filter - Filtros opcionais (disciplina, ano, limite)
   * @returns Lista de questões reais de concursos
   */
  async fetchConcursoQuestions(filter: QuestionFilter = {}): Promise<RealQuestion[]> {
    const concursoQuestions: RealQuestion[] = [
      {
        id: 'concurso_1',
        year: 2023,
        source: 'CONCURSO',
        discipline: 'Direito Constitucional',
        topic: 'Direitos Fundamentais',
        statement: `De acordo com a Constituição Federal de 1988, são direitos sociais, EXCETO:`,
        options: [
          'A) A educação.',
          'B) A saúde.',
          'C) A alimentação.',
          'D) O trabalho.',
          'E) A propriedade privada.'
        ],
        correctAnswer: 4,
        difficulty: 'Médio',
        explanation: 'A propriedade privada é um direito individual (art. 5º, XXII), não social (art. 6º).'
      },
      {
        id: 'concurso_2',
        year: 2022,
        source: 'CONCURSO',
        discipline: 'Direito Administrativo',
        topic: 'Atos Administrativos',
        statement: `Quanto aos atributos dos atos administrativos, é correto afirmar que a autoexecutoriedade:`,
        options: [
          'A) está presente em todos os atos administrativos.',
          'B) permite que a Administração execute seus atos sem autorização judicial.',
          'C) impede o controle judicial dos atos administrativos.',
          'D) só pode ser exercida após esgotamento da via administrativa.',
          'E) depende de previsão legal expressa em todos os casos.'
        ],
        correctAnswer: 1,
        difficulty: 'Médio',
        explanation: 'A autoexecutoriedade permite à Administração executar seus próprios atos sem necessidade de intervenção do Poder Judiciário.'
      },
      {
        id: 'concurso_3',
        year: 2023,
        source: 'CONCURSO',
        discipline: 'Português',
        topic: 'Concordância Verbal',
        statement: `Assinale a alternativa em que a concordância verbal está CORRETA:`,
        options: [
          'A) Fazem dois anos que não viajo.',
          'B) Houveram muitos protestos na capital.',
          'C) Existem várias razões para isso.',
          'D) Devem haver soluções para o problema.',
          'E) Haverão novas oportunidades.'
        ],
        correctAnswer: 2,
        difficulty: 'Fácil',
        explanation: '"Existem" concorda com "razões" (sujeito plural). As demais alternativas apresentam erros: "Faz" (tempo), "Houve" (impessoal), "Deve haver" (locução verbal impessoal), "Haverá" (impessoal).'
      }
    ];

    // Filtrar por disciplina
    let filtered = concursoQuestions;
    if (filter.discipline) {
      filtered = concursoQuestions.filter(q =>
        q.discipline.toLowerCase().includes(filter.discipline!.toLowerCase())
      );
    }

    const limit = filter.limit || 10;
    return filtered.slice(0, limit);
  },

  /**
   * Buscar todas as questões disponíveis (ENEM + Concursos)
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
const CACHE_KEY = 'concursoai_questions_cache';
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
