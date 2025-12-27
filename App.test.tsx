import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock scrollIntoView (não existe em jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  version: '3.0.0',
  getDocument: vi.fn()
}));

// Mock database (IndexedDB não existe em jsdom)
vi.mock('./services/database', () => ({
  QuestionsDB: {
    query: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    getBancas: vi.fn().mockResolvedValue([]),
    getAnos: vi.fn().mockResolvedValue([]),
    getDisciplinas: vi.fn().mockResolvedValue([]),
    getErroredQuestions: vi.fn().mockResolvedValue([]),
    bulkImport: vi.fn().mockResolvedValue(0),
    clear: vi.fn(),
  },
  AttemptsDB: {
    record: vi.fn(),
    getStats: vi.fn().mockResolvedValue({ total: 0, correct: 0, accuracy: 0 }),
    clear: vi.fn(),
  },
  db: {
    questions: { count: vi.fn(), toArray: vi.fn(), bulkPut: vi.fn() },
    attempts: { add: vi.fn(), toArray: vi.fn() },
  },
}));

// Mock questionSeeder
vi.mock('./services/questionSeeder', () => ({
  initializeQuestionBank: vi.fn().mockResolvedValue({ questionCount: 0, seeded: false }),
}));

// Mock GeminiService
const mockAnalyzeEdital = vi.fn();
vi.mock('./services/geminiService', () => ({
  GeminiService: {
    analyzeEdital: (text: string) => mockAnalyzeEdital(text),
    analyzeBankProfile: vi.fn(),
    generateNeuroStudyPlan: vi.fn(),
    generateQuestion: vi.fn(),
    generateSurgicalMaterial: vi.fn(),
    generateDiscursiveTheme: vi.fn(),
    evaluateDiscursive: vi.fn(),
    getProviderInfo: vi.fn().mockReturnValue({ provider: 'google-ai-studio' })
  }
}));

import App from './App';

describe('ConcursoAI App Integration', () => {

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockAnalyzeEdital.mockResolvedValue({
        metadata: { banca: 'FGV', orgao: 'TCU', cargos: ['Auditor'], nivel_escolaridade: 'Superior', remuneracao: '22k' },
        cronograma: [], fases: [], verticalizado: [], alertas: []
    });
  });

  // Helper para entrar no app (sair da LandingPage)
  const enterApp = async () => {
    const enterButtons = screen.getAllByText(/Iniciar/i);
    fireEvent.click(enterButtons[0]);
    await waitFor(() => {
      expect(screen.getByText(/Centro de Comando/i)).toBeInTheDocument();
    });
  };

  it('deve renderizar LandingPage e entrar no Dashboard', async () => {
    render(<App />);

    // LandingPage renderiza primeiro
    expect(screen.getByText(/Espaço Mentori AI/i)).toBeInTheDocument();

    // Entrar no app
    await enterApp();

    // Dashboard visível
    expect(screen.getByText(/Centro de Comando/i)).toBeInTheDocument();
  });

  it('deve navegar para Bank_Profiler via módulos cognitivos', async () => {
    render(<App />);
    await enterApp();

    // Clicar no módulo Bank_Profiler
    const profilerModule = screen.getByText(/Bank_Profiler/i);
    fireEvent.click(profilerModule.closest('div[class*="cursor-pointer"]')!);

    await waitFor(() => {
        expect(screen.getByText(/Decodificador de Banca/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deve mostrar aviso de edital pendente na Discursive_Mentor', async () => {
    render(<App />);
    await enterApp();

    // Clicar no módulo Discursive_Mentor
    const discursiveModule = screen.getByText(/Discursive_Mentor/i);
    fireEvent.click(discursiveModule.closest('div[class*="cursor-pointer"]')!);

    await waitFor(() => {
        expect(screen.getByText(/Acesso Negado/i)).toBeInTheDocument();
    });

    // Clicar para ir ao analisador
    fireEvent.click(screen.getByText(/Executar Analisador/i));

    await waitFor(() => {
        expect(screen.getByText(/Importação de Edital/i)).toBeInTheDocument();
    });
  });

  it('deve navegar para Ciclo de Estudos via botão Iniciar Modo Foco', async () => {
    render(<App />);
    await enterApp();

    // Usar o botão "Iniciar Modo Foco" que está no dashboard
    const focoButton = screen.getByText(/Iniciar Modo Foco/i);
    fireEvent.click(focoButton);

    // Esperar o lazy load do componente StudyCycle
    await waitFor(() => {
      expect(screen.getByText(/Método.*Alexandre.*Meirelles/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('deve navegar para Edital_Analyzer e voltar', async () => {
    render(<App />);
    await enterApp();

    // Clicar no módulo Edital_Analyzer
    const editalModule = screen.getByText(/Edital_Analyzer/i);
    fireEvent.click(editalModule.closest('div[class*="cursor-pointer"]')!);

    // Esperar carregar
    await waitFor(() => screen.getByText(/Importação de Edital/i));

    expect(screen.getByText(/Importação de Edital/i)).toBeInTheDocument();
  });
});