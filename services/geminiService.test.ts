import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiService } from './geminiService';
import { resetCircuits, resetHealthRegistry, initChaos } from './chaosOrchestrator';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Hoist mocks to ensure they are available before imports
const mocks = vi.hoisted(() => {
  return {
    generateContent: vi.fn(),
    GoogleGenAIConstructor: vi.fn()
  };
});

// Mock @google/genai module as a Class
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      public models: { generateContent: typeof mocks.generateContent };
      constructor(params: { apiKey?: string }) {
        mocks.GoogleGenAIConstructor(params);
        this.models = {
          generateContent: mocks.generateContent
        };
      }
    }
  };
});

describe('GeminiService', () => {
  // Clear mocks and reset modules before each test to ensure isolation
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
    // Ensure project is empty so it doesn't default to Vertex
    vi.stubEnv('GOOGLE_CLOUD_PROJECT', '');
    vi.stubEnv('VITE_GOOGLE_CLOUD_PROJECT', '');

    // Reset chaos/resilience state
    initChaos({ enabled: false, experiments: {} });
    resetCircuits();
    resetHealthRegistry();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ===========================================================================
  // 1. INITIALIZATION & CONFIGURATION
  // ===========================================================================

  describe('Initialization', () => {
    it('should initialize with API Key from environment', () => {
      const info = GeminiService.getProviderInfo();
      // In JSDOM (default vitest env), isServer is false, so it defaults to google-ai-studio
      expect(info.provider).toBe('google-ai-studio');
    });

    // NOTE: Vertex AI test omitted because 'isServer' constant is evaluated at load time
    // and correctly detects 'browser' (JSDOM), enforcing API Key mode.
  });

  // ===========================================================================
  // 2. CORE FUNCTIONALITIES
  // ===========================================================================

  describe('Functionalities', () => {

    // --- Helper to mock successful JSON response ---
    const mockSuccess = (data: Record<string, unknown>) => {
      mocks.generateContent.mockResolvedValueOnce({
        text: JSON.stringify(data)
      });
    };

    // --- Helper to mock successful JSON response with Markdown block ---
    const mockSuccessWithMarkdown = (data: Record<string, unknown>) => {
      mocks.generateContent.mockResolvedValueOnce({
        text: "```json\n" + JSON.stringify(data) + "\n```"
      });
    };

    // --- 1. Analyze Edital ---
    it('should analyze edital and return structured JSON', async () => {
      const mockResponse = {
        metadata: { banca: 'FGV', orgao: 'TCU' },
        verticalizado: [{ disciplina: 'Direito', topicos: ['Constitucional'] }]
      };
      mockSuccess(mockResponse);

      const result = await GeminiService.analyzeEdital('Texto do edital...');

      expect(mocks.generateContent).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    // --- 2. Analyze Bank Profile ---
    it('should analyze bank profile correctly', async () => {
      const mockResponse = {
        perfil: { nome: 'Cebraspe', estilo: 'Certo/Errado' },
        dna_pegadinhas: []
      };
      mockSuccessWithMarkdown(mockResponse);

      const result = await GeminiService.analyzeBankProfile('Dados da banca');

      expect(result.perfil.nome).toBe('Cebraspe');
    });

    // --- 3. Neuro Study Plan ---
    it('should generate a neuro study plan', async () => {
      const mockResponse = {
        diagnostico: { perfil_cognitivo: 'Visual' },
        blocos_estudo: []
      };
      mockSuccess(mockResponse);

      const params = {
        availability: 4,
        level: 'Intermediate',
        preferences: ['Video'],
        targetDate: '2025-12-31'
      };

      const result = await GeminiService.generateNeuroStudyPlan(params as any);
      expect(result.diagnostico.perfil_cognitivo).toBe('Visual');
    });

    // --- 4. Generate Question ---
    it('should generate a valid question', async () => {
      const mockResponse = {
        discipline: 'Math',
        statement: '2+2?',
        options: ['3', '4', '5'],
        correctAnswer: 1
      };
      mockSuccess(mockResponse);

      const result = await GeminiService.generateQuestion('Math', 'Algebra', 'FCC', 'Medium');
      expect(result.correctAnswer).toBe(1);
      expect(result.options).toHaveLength(3);
    });

    // --- 5. Surgical Material ---
    it('should generate surgical material (80/20)', async () => {
      const mockResponse = {
        titulo: 'Resumo Crase',
        modulos: [{ titulo: 'Regra Geral', conteudo: '...' }]
      };
      mockSuccess(mockResponse);

      const result = await GeminiService.generateSurgicalMaterial('Crase', 'FGV');
      expect(result.titulo).toBe('Resumo Crase');
    });

    // --- 6. Analyze Question Error ---
    it('should analyze question error', async () => {
      const mockResponse = {
        diagnostico_erro: 'Falta de atenção',
        vacina_mental: 'Ler comando da questão'
      };
      mockSuccess(mockResponse);

      const result = await GeminiService.analyzeQuestionError('Questão X', 'A', 'B');
      expect(result.diagnostico_erro).toBe('Falta de atenção');
    });

    // --- 7. Discursive Theme ---
    it('should generate discursive theme', async () => {
      const mockResponse = {
        titulo: 'Dissertação sobre IA',
        quesitos: ['Impacto social', 'Regulação']
      };
      mockSuccess(mockResponse);

      const result = await GeminiService.generateDiscursiveTheme('Analista', 'Cebraspe', 'Contexto');
      expect(result.quesitos).toContain('Impacto social');
    });

    // --- 8. Evaluate Discursive ---
    it('should evaluate discursive text', async () => {
      const mockResponse = {
        pontuacao: { total: 90 },
        erros_identificados: []
      };
      mockSuccess(mockResponse);

      const theme = { titulo: 'T', enunciado: 'E', quesitos: [], instrucoes: '' };
      const result = await GeminiService.evaluateDiscursive(theme, 'Meu texto...', 'Cebraspe');
      expect(result.pontuacao.total).toBe(90);
    });
  });

  // ===========================================================================
  // 3. ERROR HANDLING & RETRY LOGIC
  // ===========================================================================

  describe('Error Handling & Retry', () => {

    it('should retry on failure and eventually succeed', async () => {
      const mockData = { success: true };

      // Mock failure twice, then success
      mocks.generateContent
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Server busy'))
        .mockResolvedValueOnce({ text: JSON.stringify(mockData) });

      const result = await GeminiService.analyzeEdital('test');

      expect(mocks.generateContent).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockData);
    });

    it('should throw error after max retries', async () => {
      // Mock failure 3 times (MAX_RETRIES)
      mocks.generateContent.mockRejectedValue(new Error('Persistent error'));

      await expect(GeminiService.analyzeEdital('test')).rejects.toThrow(/Falha apos 3 tentativas/);
      expect(mocks.generateContent).toHaveBeenCalledTimes(3);
    });

    it('should handle malformed JSON response gracefully', async () => {
      // Mock invalid JSON -> Retry -> Success
      mocks.generateContent
        .mockResolvedValueOnce({ text: "Not JSON" })
        .mockResolvedValueOnce({ text: JSON.stringify({ success: true }) });

      const result = await GeminiService.analyzeEdital('test');
      expect(result).toEqual({ success: true });
      expect(mocks.generateContent).toHaveBeenCalledTimes(2);
    });

    it('should clean JSON with surrounding text (garbage collection)', async () => {
      const data = { key: "value" };
      const dirtyText = "Here is the json: \n\n { \"key\": \"value\" } \n\n Hope this helps!";

      mocks.generateContent.mockResolvedValueOnce({ text: dirtyText });

      const result = await GeminiService.analyzeEdital('test');
      expect(result).toEqual(data);
    });
  });
});
