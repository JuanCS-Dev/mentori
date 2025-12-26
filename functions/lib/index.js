"use strict";
/**
 * Mentori Cloud Functions
 *
 * Backend proxy para Vertex AI.
 * Usa ADC (Application Default Credentials) - automático no Cloud Functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorChat = void 0;
const https_1 = require("firebase-functions/v2/https");
const genai_1 = require("@google/genai");
// Vertex AI config
const VERTEX_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'clinica-genesis-os-e689e';
const VERTEX_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_FLASH = 'gemini-2.5-flash';
const MODEL_PRO = 'gemini-2.5-pro';
// Lazy-loaded client
let aiClient = null;
function getAIClient() {
    if (!aiClient) {
        aiClient = new genai_1.GoogleGenAI({
            vertexai: true,
            project: VERTEX_PROJECT,
            location: VERTEX_LOCATION,
        });
    }
    return aiClient;
}
// MENTORI Persona
const MENTORI_SYSTEM_INSTRUCTION = `
DATA ATUAL: ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
ANO VIGENTE: ${new Date().getFullYear()}

VOCÊ É O MENTORI. Não uma IA genérica, mas o Maior Especialista em Concursos Públicos e Direito da História.

IMPORTANTE: Todas as suas respostas devem considerar a legislação, jurisprudência e entendimentos VIGENTES em ${new Date().getFullYear()}. Cite apenas súmulas, leis e precedentes atualizados. Se algo foi revogado ou superado, informe o aluno.

Sua persona é uma fusão de:
1. **Um Professor de Direito Lendário:** Profundo conhecimento jurídico, cita doutrina, jurisprudência (STF/STJ) e a "letra da lei" com precisão cirúrgica.
2. **Um Coach de Alta Performance (Navy SEAL):** Motivador, direto, exigente ("tough love"). Você não aceita mediocridade. Você empurra o aluno para o limite do potencial.
3. **Um Estrategista de Bancas:** Você conhece o "DNA" da FGV, Cebraspe, FCC como a palma da mão. Sabe as pegadinhas, as palavras-chave e os viéses de cada examinador.

**SEU TOM DE VOZ:**
- **Autoridade Suprema:** Fale com confiança absoluta.
- **Didática de Elite:** Explique conceitos complexos com metáforas brilhantes e clareza cristalina.
- **Motivador Implacável:** Quando o aluno errar, corrija com firmeza, mas mostre o caminho da vitória.
- **Sofisticação:** Use um vocabulário rico, técnico, mas acessível.

**SUA MISSÃO:**
Transformar estudantes em APROVADOS. Entregar ouro em pó em cada resposta.
`;
/**
 * Mentor Chat Endpoint
 *
 * POST /mentorChat
 * Body: { message, history, context?, useProModel? }
 *
 * Returns: streaming text/event-stream
 */
exports.mentorChat = (0, https_1.onRequest)({
    cors: true,
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 120,
}, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        const body = req.body;
        const { message, history = [], context, useProModel = false } = body;
        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }
        const ai = getAIClient();
        const model = useProModel ? MODEL_PRO : MODEL_FLASH;
        // Build context-aware system instruction
        let systemInstruction = MENTORI_SYSTEM_INSTRUCTION;
        if (context) {
            systemInstruction += `\n\nCONTEXTO DA SESSÃO:\n- Tela atual: ${context.currentView}`;
            if (context.editalLoaded) {
                systemInstruction += `\n- Edital carregado: ${context.editalLoaded}`;
            }
            if (context.sessionActive) {
                systemInstruction += `\n- Sessão de estudo ativa`;
            }
        }
        // Create chat session
        const chat = ai.chats.create({
            model,
            config: { systemInstruction },
            history,
        });
        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Stream response
        const response = await chat.sendMessageStream({ message });
        for await (const chunk of response) {
            if (chunk.text) {
                res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
        res.end();
    }
    catch (error) {
        console.error('Mentor chat error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
