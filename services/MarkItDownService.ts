import * as pdfjsLib from 'pdfjs-dist';
import { chaosCrash, chaosLatency, chaosCorruption } from './chaosOrchestrator';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Simple interface for the conversion result
export interface ConversionResult {
  text: string;
  metadata?: {
    type: string;
    size?: number;
    pages?: number;
    title?: string;
  };
  error?: string;
}

/**
 * MarkItDownService (Client-Side Implementation)
 *
 * Inspired by Microsoft's MarkItDown, this service handles file conversions
 * directly in the browser to prepare content for the Gemini LLM.
 *
 * Supported Formats (Client-Side):
 * - .txt, .md, .csv, .json (Native text reading)
 * - .pdf (Real extraction via pdfjs-dist)
 * - .docx (Basic extraction via JSZip + XML parsing)
 */
export const MarkItDownService = {

  /**
   * Main entry point to convert a file to Markdown-friendly text.
   */
  async convertFile(file: File): Promise<ConversionResult> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    // CRM: Chaos Crash Simulation
    try {
      chaosCrash('MarkItDownService');
    } catch (e) {
      return { text: "", error: (e as Error).message };
    }

    try {
      // CRM: Chaos Latency Simulation
      return await chaosLatency(async () => {
        let result: ConversionResult;
        switch (extension) {
          case 'txt':
          case 'md':
          case 'csv':
          case 'json':
            result = await this.readTextFile(file);
            break;
          case 'pdf':
            result = await this.extractPdfText(file);
            break;
          case 'docx':
            result = await this.extractDocxText(file);
            break;
          default:
            result = await this.readTextFile(file); // Try text anyway
        }

        // CRM: Chaos Corruption Simulation
        return chaosCorruption(result, 'MarkItDownService');
      }, 'convertFile');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Erro ao processar arquivo:', error);
      return { text: "", error: `Falha ao processar arquivo: ${message}` };
    }
  },

  /**
   * Extract text from PDF using pdfjs-dist
   */
  async extractPdfText(file: File): Promise<ConversionResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const textParts: string[] = [];
      const numPages = pdf.numPages;

      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // PDF.js types are complex union types - using assertion for text items
        const pageText = (textContent.items as Array<{ str?: string }>)
          .filter((item) => typeof item.str === 'string')
          .map((item) => item.str!)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageText) {
          textParts.push(`--- Página ${pageNum} ---\n${pageText}`);
        }
      }

      const fullText = textParts.join('\n\n');

      if (!fullText.trim()) {
        return {
          text: `[PDF ESCANEADO: ${file.name}]\n\nEste PDF parece ser uma imagem escaneada sem texto extraível. Por favor, cole o texto do edital manualmente ou use um PDF com texto selecionável.`,
          metadata: { type: 'pdf', size: file.size, pages: numPages }
        };
      }

      return {
        text: `[EDITAL EXTRAÍDO: ${file.name}]\n[${numPages} páginas]\n\n${fullText}`,
        metadata: { type: 'pdf', size: file.size, pages: numPages }
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Erro ao extrair PDF:', error);
      return {
        text: "",
        error: `Falha ao extrair PDF: ${message}. Tente colar o texto diretamente.`
      };
    }
  },

  /**
   * Extract text from DOCX (basic implementation)
   * DOCX files are ZIP archives containing XML
   */
  async extractDocxText(file: File): Promise<ConversionResult> {
    try {
      // DOCX is a ZIP file containing XML
      const arrayBuffer = await file.arrayBuffer();

      // Fallback: read as text and try to parse
      // chaosLatency is implicitly handled by the parent caller, but we could add granular chaos here if needed.
      const text = await this.readDocxAsText(arrayBuffer, file.name);

      return {
        text: `[DOCUMENTO EXTRAÍDO: ${file.name}]\n\n${text}`,
        metadata: { type: 'docx', size: file.size }
      };
    } catch (error: unknown) {
      console.error('Erro ao extrair DOCX:', error);
      // Fallback message
      return {
        text: `[DOCUMENTO: ${file.name}]\n\nNão foi possível extrair o texto automaticamente. Por favor, abra o documento no Word, selecione todo o texto (Ctrl+A), copie (Ctrl+C) e cole aqui.`,
        metadata: { type: 'docx', size: file.size },
        error: 'Extração de DOCX requer colar texto manualmente'
      };
    }
  },

  /**
   * Helper to read DOCX content
   * Uses basic ZIP extraction to get document.xml
   */
  async readDocxAsText(_arrayBuffer: ArrayBuffer, _fileName: string): Promise<string> {
    // For now, prompt user to paste text
    // Full DOCX extraction would require JSZip library
    throw new Error('DOCX extraction requires manual paste');
  },

  async readTextFile(file: File): Promise<ConversionResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Basic Markdown normalization
        const normalizedText = `[ARQUIVO IMPORTADO: ${file.name}]\n\n${text}`;
        resolve({ text: normalizedText, metadata: { type: 'text' } });
      };

      reader.onerror = () => reject(new Error("Erro de leitura de arquivo"));
      reader.readAsText(file);
    });
  }
};
