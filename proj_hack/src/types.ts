export interface StudentProfile {
  uid: string;
  name: string;
  subjects: string[];
  studyHoursPerDay: number;
  learningStyle?: 'Visual' | 'Auditory' | 'Reading-Writing' | 'Kinesthetic';
  examDate?: string;
  targetScore?: number;
  createdAt: string;
}

export interface StudySession {
  id?: string;
  uid: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  timestamp: string;
  engagementLevel: number;
}

export interface QuizScore {
  id?: string;
  uid: string;
  subject: string;
  topic: string;
  score: number;
  total: number;
  timestamp: string;
}

export interface RevisionTask {
  id?: string;
  uid: string;
  subject: string;
  topic: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed';
  source: 'AI_GENERATED' | 'MANUAL';
}

export interface ForgettingState {
  subject: string;
  topic: string;
  retention: number; // 0 to 1
  nextReview: string;
}

export interface EngagementAnalysis {
  status: 'Consistent' | 'Losing Interest' | 'At Risk';
  message: string;
  trend: 'Up' | 'Down' | 'Stable';
  lastActivityGapDays: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface MemoryAnalysis {
  topic: string;
  subject: string;
  retention: number; // 0-100
  lastStudied: string;
  nextOptimalReview: string;
  revisionsCount: number;
  status: 'Retained' | 'Fading' | 'Forgotten';
  recommendation: string;
}

export interface StudyPlanTask {
  id?: string;
  uid: string;
  day: string; // ISO date (YYYY-MM-DD)
  timeSlot: string; // e.g. "09:00 - 10:30"
  subject: string;
  topic: string;
  objective: string;
  status: 'Pending' | 'Completed';
  type: 'Study' | 'Quiz' | 'Revision';
}

export interface AIAnalysis {
  predictedScore: number;
  weakTopics: string[];
  strongTopics: string[];
  learningStyleAnalysis: string;
  motivationalMessage: string;
  revisionPlan: RevisionTask[];
  engagement: EngagementAnalysis;
  memoryAnalysis: MemoryAnalysis[];
  studyPlan: StudyPlanTask[];
}
