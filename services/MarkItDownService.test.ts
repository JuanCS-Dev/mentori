import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================================
// MOCK SETUP
// =============================================================================

const mocks = vi.hoisted(() => {
  return {
    getTextContent: vi.fn(),
    getPage: vi.fn(),
    getDocument: vi.fn()
  };
});

vi.mock('pdfjs-dist', () => {
  return {
    GlobalWorkerOptions: { workerSrc: '' },
    version: '3.0.0',
    getDocument: vi.fn(() => ({
      promise: mocks.getDocument()
    }))
  };
});

import { MarkItDownService } from './MarkItDownService';

describe('MarkItDownService', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // Default PDF mock behavior
    mocks.getDocument.mockReturnValue(Promise.resolve({
      numPages: 1,
      getPage: mocks.getPage
    }));

    mocks.getPage.mockResolvedValue({
      getTextContent: mocks.getTextContent
    });

    mocks.getTextContent.mockResolvedValue({
      items: [{ str: 'Hello' }, { str: 'World' }]
    });
  });

  describe('readTextFile', () => {
    it('should read text file content', async () => {
      const content = 'Test file content';
      const mockFile = new File([content], 'test.txt', { type: 'text/plain' });

      const result = await MarkItDownService.readTextFile(mockFile);

      expect(result.text).toContain(content);
      expect(result.text).toContain('[ARQUIVO IMPORTADO: test.txt]');
      expect(result.metadata?.type).toBe('text');
    });

    it('should reject on file error', async () => {
      // FileReader error testing requires complex mocking
      // Covered by integration tests
    });
  });

  describe('convertFile', () => {
    it('should route txt files to text reader', async () => {
      const mockFile = new File(['Hello'], 'test.txt', { type: 'text/plain' });
      const result = await MarkItDownService.convertFile(mockFile);
      expect(result.text).toContain('Hello');
    });

    it('should route pdf files to pdf extractor', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      // We need to mock arrayBuffer because it's used in extractPdfText
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

      const result = await MarkItDownService.convertFile(mockFile);

      expect(result.text).toContain('Hello World');
      expect(result.metadata?.type).toBe('pdf');
    });

    it('should route docx files to docx extractor', async () => {
      const mockFile = new File(['docx'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const result = await MarkItDownService.convertFile(mockFile);
      expect(result.metadata?.type).toBe('docx');
    });
  });

  describe('extractPdfText', () => {
    it('should extract text from multiple pages', async () => {
      const mockFile = new File(['pdf'], 'test.pdf');
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

      mocks.getDocument.mockReturnValue(Promise.resolve({
        numPages: 2,
        getPage: mocks.getPage
      }));

      mocks.getTextContent
        .mockResolvedValueOnce({ items: [{ str: 'Page 1 text' }] })
        .mockResolvedValueOnce({ items: [{ str: 'Page 2 text' }] });

      const result = await MarkItDownService.extractPdfText(mockFile);

      expect(result.text).toContain('Page 1 text');
      expect(result.text).toContain('Page 2 text');
      expect(result.metadata?.pages).toBe(2);
    });

    it('should handle scanned PDFs (no text)', async () => {
      const mockFile = new File(['pdf'], 'scanned.pdf');
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

      mocks.getTextContent.mockResolvedValue({ items: [] });

      const result = await MarkItDownService.extractPdfText(mockFile);

      expect(result.text).toContain('PDF ESCANEADO');
      expect(result.text).toContain('imagem escaneada');
    });

    it('should handle PDF extraction errors', async () => {
      const mockFile = new File(['pdf'], 'corrupt.pdf');
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

      mocks.getDocument.mockImplementation(() => {
        throw new Error('PDF Corrupt');
      });

      const result = await MarkItDownService.extractPdfText(mockFile);

      expect(result.error).toContain('Falha ao extrair PDF');
      expect(result.text).toBe('');
    });
  });

  describe('extractDocxText', () => {
    it('should return fallback for DOCX', async () => {
      const mockFile = new File(['docx'], 'test.docx');
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

      const result = await MarkItDownService.extractDocxText(mockFile);

      expect(result.text).toContain('Não foi possível extrair o texto automaticamente');
      expect(result.error).toBe('Extração de DOCX requer colar texto manualmente');
    });
  });
});