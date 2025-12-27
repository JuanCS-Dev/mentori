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

  // Helper para entrar no app (sair da SalesLanding)
  const enterApp = async () => {
    // SalesLanding has multiple CTA buttons, use the header one
    await waitFor(() => {
      expect(screen.getByText(/Estude/i)).toBeInTheDocument();
    });
    const enterButtons = screen.getAllByText(/Comecar/i);
    fireEvent.click(enterButtons[0]);
    await waitFor(() => {
      // DashboardHub has WelcomeCard with "Bem-vindo ao Mentori"
      expect(screen.getByText(/Bem-vindo ao Mentori/i)).toBeInTheDocument();
    });
  };

  it('deve renderizar SalesLanding e entrar no Dashboard', async () => {
    render(<App />);

    // SalesLanding renderiza primeiro
    await waitFor(() => {
      expect(screen.getByText(/Estude/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/3x Mais Rapido/i)).toBeInTheDocument();

    // Entrar no app
    await enterApp();

    // Dashboard visível - DashboardHub has WelcomeCard
    expect(screen.getByText(/Bem-vindo ao Mentori/i)).toBeInTheDocument();
  });

  it('deve navegar para Ciclo de Estudos via QuickActions', async () => {
    render(<App />);
    await enterApp();

    // Usar o botão "Continuar Estudando" no QuickActions do DashboardHub
    const continueButton = screen.getByText(/Continuar Estudando/i);
    fireEvent.click(continueButton);

    // Esperar o lazy load do componente StudyCycle
    await waitFor(() => {
      expect(screen.getByText(/Método.*Alexandre.*Meirelles/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('deve mostrar DashboardHub com componentes principais', async () => {
    render(<App />);
    await enterApp();

    // Verificar que DashboardHub tem os componentes principais
    expect(screen.getByText(/Bem-vindo ao Mentori/i)).toBeInTheDocument();
    expect(screen.getByText(/Estatisticas Rapidas/i)).toBeInTheDocument();
    expect(screen.getByText(/Plano de Hoje/i)).toBeInTheDocument();
    expect(screen.getByText(/Acoes Rapidas/i)).toBeInTheDocument();
    // "Mentor IA" appears multiple times, use getAllByText
    expect(screen.getAllByText(/Mentor IA/i).length).toBeGreaterThan(0);
  });

  it('deve ter botoes de acao no QuickActions', async () => {
    render(<App />);
    await enterApp();

    // Verificar que QuickActions tem os botoes principais
    expect(screen.getByText(/Continuar Estudando/i)).toBeInTheDocument();
    expect(screen.getByText(/Revisar Erros/i)).toBeInTheDocument();
    expect(screen.getByText(/Simular Prova/i)).toBeInTheDocument();
    expect(screen.getByText(/Falar com Mentor/i)).toBeInTheDocument();
  });
});