// JSON file structure (from quran_deck.json)
export interface VocabWordJSON {
  id: number;
  deck_id: string;
  word_type: 'noun' | 'verb' | 'adjective' | 'particle' | string;
  source_term: string;
  target_term: string;
  details: {
    // For nouns and adjectives
    source_plural?: string;
    target_plural?: string;
    // For verbs
    present?: string;
    verbal_noun?: string;
    form?: number;
  };
}

// Database types
export interface Deck {
  id: string;
  user_id: string;
  name: string;
  deck_id: string;
  source_language: string;
  target_language: string;
  created_at: string;
  word_count?: number;
}

export interface Word {
  id: string;
  deck_id: string;
  word_type: string;
  source_term: string;
  target_term: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  deck_id: string;
  quiz_type: 'multiple_choice' | 'type_answer' | 'sentence';
  direction: 'source_to_target' | 'target_to_source';
  total_questions: number;
  correct_answers: number;
  completed_at: string | null;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  word_id: string;
  user_answer: string;
  is_correct: boolean;
  created_at: string;
}

// Quiz types
export interface QuizQuestion {
  word: Word;
  options?: string[]; // For multiple choice
  questionText: string;
  correctAnswer: string;
}

export interface QuizState {
  session: QuizSession | null;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: { wordId: string; userAnswer: string; isCorrect: boolean }[];
  isComplete: boolean;
}

// User type
export interface User {
  id: string;
  email: string;
  created_at: string;
}

