export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PROGRESS = 'PROGRESS',
  EDITAL = 'EDITAL',
  PROFILE = 'PROFILE',
  PLAN = 'PLAN',
  QUESTIONS = 'QUESTIONS',
  MATERIAL = 'MATERIAL',
  DISCURSIVE = 'DISCURSIVE',
  STUDY_CYCLE = 'STUDY_CYCLE',
  LANDING = 'LANDING'
}

// --- EDITAL ---
export interface EditalJSON {
  metadata: {
    banca: string;
    orgao: string;
    cargos: string[];
    nivel_escolaridade: string;
    remuneracao: string;
  };
  cronograma: { evento: string; data: string; critical: boolean }[];
  fases: { nome: string; carater: string; detalhes: string }[];
  verticalizado: { disciplina: string; peso: string; questoes: string; topicos: string[] }[];
  alertas: string[];
}

// --- BANK PROFILE ---
export interface BankProfileJSON {
  perfil: {
    nome: string;
    estilo: string;
    dificuldade: string;
    descricao_estilo: string;
  };
  dna_pegadinhas: { tipo: string; exemplo: string; frequencia: string }[];
  mapa_calor: { materia: string; foco: string; frequencia: string }[];
  jurisprudencia_preferida: string[];
  vereditto_estrategico: string;
}

// --- STUDY PLAN (NEURO) ---
export interface NeuroStudyPlanJSON {
  diagnostico: {
    perfil_cognitivo: string;
    estrategia_adotada: string;
  };
  rotina_matinal: string[];
  blocos_estudo: {
    horario: string;
    atividade: string;
    metodo: string;
    energia_exigida: 'Alta' | 'Média' | 'Baixa';
    motivo: string;
  }[];
  rotina_noturna: string[];
  dopamina_triggers: string[];
}

// --- QUESTIONS ---
export interface Question {
  discipline: string;
  topic: string;
  difficulty: string;
  statement: string;
  options: string[];
  correctAnswer: number;
  comment: string;
  trap: string;
  bank?: string;
  eloRating?: number;
}

export interface QuestionAutopsy {
  diagnostico_erro: string;
  explicacao_tecnica: string;
  vacina_mental: string;
  gravidade: string;
}

/**
 * Explicação AI-generated para uma questão
 * Gerada pelo GeminiService.generateExplanation()
 */
export interface QuestionExplanation {
  /** Explicação completa da resposta correta */
  explicacao_correta: string;
  /** Por que cada alternativa incorreta está errada */
  alternativas_erradas: {
    indice: number;
    texto: string;
    motivo: string;
  }[];
  /** Fundamentação legal/jurídica (artigos, súmulas, jurisprudência) */
  fundamentacao: string;
  /** Dica memorável para não esquecer (mnemônico) */
  dica_memoravel: string;
  /** Temas relacionados para aprofundamento */
  temas_relacionados: string[];
  /** Nível de dificuldade percebido */
  nivel_dificuldade: 'facil' | 'medio' | 'dificil' | 'expert';
}

// --- MATERIAL ---
export interface MaterialJSON {
  titulo: string;
  estimativa_leitura: string;
  raio_x: string;
  modulos: { titulo: string; conteudo: string; tipo: string }[];
  flashcards: { front: string; back: string }[];
}

// --- DISCURSIVE ---
export interface DiscursiveTheme {
  titulo: string;
  enunciado: string;
  quesitos: string[];
  instrucoes: string;
}

export interface DiscursiveEvaluation {
  pontuacao: {
    total: number;
    conteudo: number;
    estrutura: number;
    gramatica: number;
  };
  parecer_pedagogico: string;
  erros_identificados: {
    trecho: string;
    correcao: string;
    motivo: string;
  }[];
  espelho_ideal: string;
}

// --- PARAMS ---
export interface StudyPlanParams {
  cronotipo: string;
  foco_maximo: number;
  nivel_estresse: string;
  horas_diarias: number;
  editalSummary: string;
  bankProfile: string;
}

// --- MENTOR CHAT ---
export interface MentorMessage {
  role: 'user' | 'mentor';
  content: string;
  timestamp: number;
}

export interface ChatContext {
  currentView: string;
  editalLoaded?: string;
  sessionActive?: boolean;
}
