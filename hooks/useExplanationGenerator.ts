/**
 * useExplanationGenerator - Background AI Explanation Generation
 *
 * Generates explanations for questions that don't have them yet.
 * Runs in background using requestIdleCallback for non-blocking operation.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { QuestionsDB, ConcursoQuestion } from '../services/database';
import { GeminiService } from '../services/geminiService';
import { QuestionExplanation } from '../types';

interface ExplanationGeneratorState {
  isGenerating: boolean;
  questionsProcessed: number;
  questionsRemaining: number;
  lastError: string | null;
}

/**
 * Hook that generates AI explanations for questions in background
 * @param enabled - Whether to run the generator (default: true)
 * @param batchSize - Number of questions to process per batch (default: 5)
 */
export function useExplanationGenerator(
  enabled: boolean = true,
  batchSize: number = 5
): ExplanationGeneratorState {
  const [state, setState] = useState<ExplanationGeneratorState>({
    isGenerating: false,
    questionsProcessed: 0,
    questionsRemaining: 0,
    lastError: null
  });

  const isRunningRef = useRef(false);
  const processedCountRef = useRef(0);

  const generateExplanationsForBatch = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    setState(prev => ({ ...prev, isGenerating: true, lastError: null }));

    try {
      // Get questions without explanations
      const questions = await QuestionsDB.getQuestionsWithoutExplanation(batchSize);

      if (questions.length === 0) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          questionsRemaining: 0
        }));
        isRunningRef.current = false;
        return;
      }

      setState(prev => ({ ...prev, questionsRemaining: questions.length }));

      for (const question of questions) {
        try {
          // Generate explanation using Gemini
          const explanation = await GeminiService.generateExplanation(
            question.enunciado,
            question.alternativas,
            question.gabarito,
            question.disciplina,
            question.banca
          );

          // Save to database
          await QuestionsDB.updateExplanation(question.id, explanation);

          processedCountRef.current++;
          setState(prev => ({
            ...prev,
            questionsProcessed: processedCountRef.current,
            questionsRemaining: prev.questionsRemaining - 1
          }));
        } catch (error) {
          console.error('[ExplanationGenerator] Failed to generate explanation for question:', question.id, error);
          // Continue with next question
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ExplanationGenerator] Batch processing error:', error);
      setState(prev => ({ ...prev, lastError: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
      isRunningRef.current = false;
    }
  }, [batchSize]);

  useEffect(() => {
    if (!enabled) return;

    // Run in idle time to avoid blocking UI
    const scheduleGeneration = () => {
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => {
          generateExplanationsForBatch();
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => generateExplanationsForBatch(), 5000);
      }
    };

    // Initial delay before starting (let app load first)
    const initialTimer = setTimeout(scheduleGeneration, 10000);

    // Check for more questions periodically (every 5 minutes)
    const intervalTimer = setInterval(() => {
      if (!isRunningRef.current) {
        scheduleGeneration();
      }
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [enabled, generateExplanationsForBatch]);

  return state;
}

/**
 * Manually trigger explanation generation for a specific question
 */
export async function generateExplanationForQuestion(
  question: ConcursoQuestion
): Promise<QuestionExplanation | null> {
  try {
    const explanation = await GeminiService.generateExplanation(
      question.enunciado,
      question.alternativas,
      question.gabarito,
      question.disciplina,
      question.banca
    );

    await QuestionsDB.updateExplanation(question.id, explanation);
    return explanation;
  } catch (error) {
    console.error('[generateExplanationForQuestion] Failed:', error);
    return null;
  }
}
