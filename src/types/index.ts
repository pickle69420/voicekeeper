// Recording types
export interface Recording {
  id: string;
  created_at: string;
  date: string;
  audio_url: string;
  duration_seconds: number;
  file_size_bytes?: number;
  title?: string;
  thumbnail_url?: string;
}

export interface Word {
  text: string;
  start: number; // milliseconds from AssemblyAI, convert to seconds for storage
  end: number;
  confidence: number;
  speaker?: string;
}

export interface Utterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  words: Word[];
}

export interface Transcript {
  id: string;
  recording_id: string;
  created_at: string;
  text: string;
  language: string;
  confidence_avg?: number;
  words: Word[];
  utterances?: Utterance[];
}

// Embedding and chunk types
export interface Chunk {
  text: string;
  index: number;
  start_time: number;
  end_time: number;
  speaker?: string;
  word_count: number;
  token_count: number;
  avg_confidence: number;
}

export interface Embedding {
  id: string;
  recording_id: string;
  created_at: string;
  chunk_text: string;
  chunk_index: number;
  start_time?: number;
  end_time?: number;
  speaker_label?: string;
  pinecone_id: string;
}

// Search types
export interface SearchResult {
  recording_id: string;
  chunk_text: string;
  start_time: number;
  end_time: number;
  speaker?: string;
  date: string;
  relevance_score: number;
  source_type: 'semantic' | 'keyword' | 'hybrid';
  recording?: Recording;
}

export interface RAGSource {
  recording_id: string;
  date: string;
  speaker?: string;
  start_time: number;
  end_time: number;
  chunk_text: string;
  relevance_score: number;
}

export interface RAGResponse {
  answer: string;
  sources: RAGSource[];
}

// Brain game types
export type GameType = 'memory_match' | 'word_recall' | 'daily_quiz';

export interface BrainGameSession {
  id: string;
  created_at: string;
  date: string;
  game_type: GameType;
  difficulty_level: number;
  score: number;
  max_score: number;
  accuracy?: number;
  duration_seconds?: number;
  metadata?: Record<string, unknown>;
}

export interface GameCard {
  id: string;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  sourceRecording?: {
    recording_id: string;
    date: string;
    chunk_text: string;
  };
}

// Stats types
export interface UserStats {
  id: string;
  stat_date: string;
  recordings_count: number;
  total_recording_seconds: number;
  games_played: number;
  has_recording: boolean;
  streak_days: number;
  updated_at: string;
}

export interface DashboardStats {
  current_streak: number;
  total_recordings: number;
  total_hours: number;
  total_games: number;
  avg_game_score?: number;
  activity_heatmap: HeatmapData[];
}

export interface HeatmapData {
  date: string;
  count: number;
}

// AssemblyAI WebSocket types
export interface AssemblyAIPartialTranscript {
  message_type: 'PartialTranscript';
  text: string;
  created: string;
  audio_start: number;
  audio_end: number;
}

export interface AssemblyAIFinalTranscript {
  message_type: 'FinalTranscript';
  text: string;
  words: AssemblyAIWord[];
  created: string;
  audio_start: number;
  audio_end: number;
}

export interface AssemblyAIWord {
  text: string;
  start: number; // milliseconds
  end: number;
  confidence: number;
  speaker?: string;
}

export interface AssemblyAISessionBegins {
  message_type: 'SessionBegins';
  session_id: string;
  expires_at: string;
}

export type AssemblyAIMessage = 
  | AssemblyAIPartialTranscript 
  | AssemblyAIFinalTranscript 
  | AssemblyAISessionBegins
  | { message_type: 'SessionTerminated' };

// Pinecone metadata type - using compatible types for RecordMetadata
export interface PineconeMetadata {
  [key: string]: string | number | boolean | string[];
  recording_id: string;
  chunk_index: number;
  chunk_text: string;
  start_time: number;
  end_time: number;
  date: string;
  confidence: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StreamingSearchEvent {
  type: 'status' | 'token' | 'sources' | 'suggestions' | 'error' | 'done';
  content?: string;
  sources?: RAGSource[];
  suggestions?: string[];
  error?: string;
}
