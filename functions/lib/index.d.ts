/**
 * Mentori Cloud Functions
 *
 * Backend proxy para Vertex AI.
 * Usa ADC (Application Default Credentials) - automático no Cloud Functions.
 */
/**
 * Mentor Chat Endpoint
 *
 * POST /mentorChat
 * Body: { message, history, context?, useProModel? }
 *
 * Returns: streaming text/event-stream
 */
export declare const mentorChat: import("firebase-functions/v2/https").HttpsFunction;
