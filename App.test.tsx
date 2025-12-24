import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  version: '3.0.0',
  getDocument: vi.fn()
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

  it('deve renderizar dashboard e trocar humor', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Focado/i));
    expect(screen.getByText(/Sua mente está afiada/i)).toBeInTheDocument();
  });

  it('deve navegar para Perfil da Banca via Dashboard (Lazy Load)', async () => {
    render(<App />);
    const cardTitle = screen.getAllByRole('heading', { level: 3 }).find(el => el.textContent === 'Inteligência da Banca');
    const card = cardTitle?.closest('div.glass-card');
    
    if (card) fireEvent.click(card);
    
    await waitFor(() => {
        expect(screen.getByText(/Decodificador de Banca/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deve mostrar aviso de edital pendente na Batalha Discursiva', async () => {
    render(<App />);
    const cardTitle = screen.getAllByRole('heading', { level: 3 }).find(el => el.textContent === 'Batalha Discursiva');
    const card = cardTitle?.closest('div.glass-card');
    
    if (card) fireEvent.click(card);
    
    await waitFor(() => {
        expect(screen.getByText(/Acesso Restrito/i)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText(/Ir para Análise de Edital/i));
    
    await waitFor(() => {
        expect(screen.getByText(/Importação de Edital/i)).toBeInTheDocument();
    });
  });

  it('deve navegar via Sidebar para outros módulos (Lazy Load)', async () => {
    render(<App />);
    const sidebar = screen.getByRole('complementary');
    
    fireEvent.click(within(sidebar).getByText('Ciclo de Estudos'));
    await waitFor(() => {
        expect(screen.getByText(/Metodo Alexandre Meirelles/i)).toBeInTheDocument();
    });
    
    fireEvent.click(within(sidebar).getByText('Meu Progresso'));
    await waitFor(() => {
        expect(screen.getByText(/Sua jornada começa agora/i)).toBeInTheDocument();
    });
  });

  it('deve realizar análise de edital e liberar discursiva', async () => {
    render(<App />);
    
    // 1. Ir para Edital
    const cardTitle = screen.getAllByRole('heading', { level: 3 }).find(el => el.textContent === 'Edital');
    const card = cardTitle?.closest('div.glass-card');
    if (card) fireEvent.click(card);
    
    // 2. Esperar carregar e analisar
    await waitFor(() => screen.getByPlaceholderText(/Cole o texto/i));
    fireEvent.change(screen.getByPlaceholderText(/Cole o texto/i), { target: { value: 'fake' } });
    fireEvent.click(screen.getByText(/Análise Estruturada/i));
    
    // 3. Esperar resultado da análise
    await waitFor(() => expect(screen.getByText('TCU')).toBeInTheDocument());

    // 4. Voltar Dashboard via Sidebar
    const sidebar = screen.getByRole('complementary');
    fireEvent.click(within(sidebar).getByText('Dashboard'));

    // 5. Iniciar Protocolo (Focused -> Discursive)
    await waitFor(() => screen.getByText(/Iniciar Protocolo/i));
    fireEvent.click(screen.getByText(/Iniciar Protocolo/i));
    
    // 6. Verificar que abriu a sala de batalha (não o aviso de bloqueio)
    await waitFor(() => {
        expect(screen.getByText(/Sala de Batalha Discursiva/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});