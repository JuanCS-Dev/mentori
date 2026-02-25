import { supabase } from "./supabaseClient";
import { ConcursoQuestion, QuestionAttempt } from "./database";
import { UserProgress } from "../hooks/usePersistence";

/**
 * Supabase Service - Soberania em Nuvem
 *
 * Gerencia a persistência remota de questões, tentativas e progresso do usuário.
 */
export const SupabaseService = {
  // ===== QUESTIONS =====

  async getQuestions(filters: {
    discipline?: string;
    bank?: string;
    year?: number;
    tipo?: string;
    limit?: number;
    excludeIds?: string[];
  }): Promise<ConcursoQuestion[]> {
    let query = supabase.from("questions").select("*");

    if (filters.discipline) {
      query = query.ilike("disciplina", `%${filters.discipline}%`);
    }
    if (filters.bank && filters.bank !== "Todas") {
      query = query.eq("banca", filters.bank);
    }
    if (filters.year && filters.year > 0) {
      query = query.eq("ano", filters.year);
    }
    if (filters.tipo && filters.tipo !== "Qualquer") {
      query = query.eq("tipo", filters.tipo);
    }
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      query = query.not("id", "in", `(${filters.excludeIds.join(",")})`);
    }

    const { data, error } = await query.limit(filters.limit || 10);

    if (error) {
      console.error("[Supabase] Erro ao buscar questões:", error);
      return [];
    }

    return (data as unknown as ConcursoQuestion[]) || [];
  },

  async bulkUpsertQuestions(questions: ConcursoQuestion[]): Promise<void> {
    const { error } = await supabase
      .from("questions")
      .upsert(questions, { onConflict: "id" });

    if (error) {
      console.error("[Supabase] Erro no bulk upsert de questões:", error);
    }
  },

  // ===== ATTEMPTS =====

  async recordAttempt(attempt: QuestionAttempt): Promise<void> {
    const { error } = await supabase.from("attempts").insert({
      question_id: attempt.questionId,
      selected_answer: attempt.selectedAnswer,
      is_correct: attempt.isCorrect,
      timestamp: attempt.timestamp,
      time_spent: attempt.timeSpent,
    });

    if (error) {
      console.error("[Supabase] Erro ao gravar tentativa:", error);
    }
  },

  async getUserStats(): Promise<{
    total: number;
    correct: number;
    accuracy: number;
  }> {
    const { data, error } = await supabase
      .from("attempts")
      .select("is_correct");

    if (error) {
      console.error("[Supabase] Erro ao buscar stats:", error);
      return { total: 0, correct: 0, accuracy: 0 };
    }

    const total = data.length;
    const correct = data.filter((a) => a.is_correct).length;
    return {
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  },

  // ===== USER PROGRESS (PROFILES) =====

  async saveProgress(userId: string, progress: UserProgress): Promise<void> {
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      xp: progress.xp,
      level: progress.level,
      overall_elo: progress.overallElo,
      discipline_stats: progress.disciplineStats,
      streak_data: progress.streakData,
      badges: progress.badges,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Supabase] Erro ao salvar progresso:", error);
    }
  },

  async getProgress(userId: string): Promise<UserProgress | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        // Ignore "not found"
        console.error("[Supabase] Erro ao buscar progresso:", error);
      }
      return null;
    }

    return {
      questionsAnswered: 0, // Calculado a partir de attempts ou armazenado
      questionsCorrect: 0,
      totalStudyMinutes: 0,
      streakDays: data.streak_data?.currentStreak || 0,
      lastStudyDate: data.streak_data?.lastStudyDate || "",
      disciplineStats: data.discipline_stats || {},
      xp: data.xp,
      level: data.level,
      overallElo: data.overall_elo,
      badges: data.badges || [],
      consecutiveCorrect: 0,
      maxConsecutiveCorrect: 0,
      lastSessionAccuracy: 0,
      streakData: data.streak_data || {},
    } as UserProgress;
  },
};
