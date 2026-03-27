import { GoogleGenAI, Type } from "@google/genai";
import { StudentProfile, StudySession, QuizScore, AIAnalysis, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function analyzeStudentData(
  profile: StudentProfile,
  sessions: StudySession[],
  scores: QuizScore[]
): Promise<AIAnalysis> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this student's learning data and build their "Digital Twin" profile.
    
    Student Profile: ${JSON.stringify(profile)}
    Study Sessions: ${JSON.stringify(sessions)}
    Quiz Scores: ${JSON.stringify(scores)}
    
    Provide:
    1. Predicted exam score range (0-100).
    2. List of weak topics (danger zones).
    3. List of strong topics.
    4. Learning style analysis based on behavior.
    5. A personalized motivational message. Tone should adapt: encouraging if doing well, supportive/firm if struggling or losing consistency.
    6. A 7-day revision plan with specific topics and priorities.
    7. Engagement Analysis:
       - Status: "Consistent", "Losing Interest", or "At Risk".
       - Message: A brief explanation of their current engagement trend.
       - Trend: "Up", "Down", or "Stable".
        - lastActivityGapDays: Number of days since last activity.
    8. Memory Analysis (Ebbinghaus Forgetting Curve):
       - For each topic studied, predict current retention (0-100%).
       - Use exponential decay: R = e^(-t/S). Stability S increases with quiz scores and revisions.
       - Identify "nextOptimalReview" date (when retention hits 60%).
       - Status: "Retained" (>80%), "Fading" (60-80%), "Forgotten" (<60%).
       - Recommendation: "Revise [Topic] today" or "Next review in X days".
    9. A 7-day Dynamic Study Plan:
       - For each of the next 7 days, provide 2-3 specific study tasks.
       - Each task must have:
         - "day": ISO date string (YYYY-MM-DD).
         - "timeSlot": A specific time window (e.g., "09:00 - 10:30").
         - "subject": The subject to focus on.
         - "topic": The specific topic/chapter.
         - "objective": A clear goal for the session (e.g., "Master quadratic equations", "Complete 20 practice questions").
         - "type": One of "Study", "Quiz", or "Revision".
         - "status": Always "Pending".
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          predictedScore: { type: Type.NUMBER },
          weakTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          strongTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          learningStyleAnalysis: { type: Type.STRING },
          motivationalMessage: { type: Type.STRING },
          revisionPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                topic: { type: Type.STRING },
                dueDate: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                status: { type: Type.STRING, enum: ["Pending"] },
                source: { type: Type.STRING, enum: ["AI_GENERATED"] }
              },
              required: ["subject", "topic", "dueDate", "priority", "status", "source"]
            }
          },
          engagement: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["Consistent", "Losing Interest", "At Risk"] },
              message: { type: Type.STRING },
              trend: { type: Type.STRING, enum: ["Up", "Down", "Stable"] },
              lastActivityGapDays: { type: Type.NUMBER }
            },
            required: ["status", "message", "trend", "lastActivityGapDays"]
          },
          memoryAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                subject: { type: Type.STRING },
                retention: { type: Type.NUMBER },
                lastStudied: { type: Type.STRING },
                nextOptimalReview: { type: Type.STRING },
                revisionsCount: { type: Type.NUMBER },
                status: { type: Type.STRING, enum: ["Retained", "Fading", "Forgotten"] },
                recommendation: { type: Type.STRING }
              },
              required: ["topic", "subject", "retention", "lastStudied", "nextOptimalReview", "revisionsCount", "status", "recommendation"]
            }
          },
          studyPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                timeSlot: { type: Type.STRING },
                subject: { type: Type.STRING },
                topic: { type: Type.STRING },
                objective: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["Study", "Quiz", "Revision"] },
                status: { type: Type.STRING, enum: ["Pending"] }
              },
              required: ["day", "timeSlot", "subject", "topic", "objective", "type", "status"]
            }
          }
        },
        required: ["predictedScore", "weakTopics", "strongTopics", "learningStyleAnalysis", "motivationalMessage", "revisionPlan", "engagement", "memoryAnalysis", "studyPlan"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateQuiz(
  subject: string, 
  topic: string, 
  count: number, 
  previousScores: QuizScore[]
): Promise<QuizQuestion[]> {
  const model = "gemini-3-flash-preview";
  
  // Calculate average performance for this topic to set difficulty
  const topicScores = previousScores.filter(s => s.topic.toLowerCase() === topic.toLowerCase());
  const avgPerformance = topicScores.length > 0 
    ? topicScores.reduce((acc, s) => acc + (s.score / s.total), 0) / topicScores.length
    : 0.5;

  const difficulty = avgPerformance > 0.8 ? "Advanced" : avgPerformance > 0.5 ? "Intermediate" : "Basic";

  const prompt = `
    Generate a quiz with ${count} multiple-choice questions.
    Subject: ${subject}
    Topic: ${topic}
    Target Difficulty: ${difficulty} (based on student's current performance of ${(avgPerformance * 100).toFixed(0)}%)
    
    Each question must have:
    - The question text
    - 4 options
    - The correct answer (must match one of the options exactly)
    - A brief explanation of why it's correct.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType } },
        { text: "Transcribe this audio exactly as spoken. Return only the transcribed text, nothing else." }
      ]
    },
    config: {
      systemInstruction: "You are a precise transcription assistant. Your only job is to convert audio to text accurately."
    }
  });
  
  return response.text || "";
}

export async function getTutorExplanation(topic: string, learningStyle: string): Promise<string> {
  const model = "gemini-3-flash-preview";
  const prompt = `Explain ${topic} in simple terms, tailored for a ${learningStyle} learner.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: "You are a friendly AI tutor. Keep explanations concise and engaging. CRITICAL: Always respond in the same language as the user's input. If they ask in Spanish, respond in Spanish. If they ask in Hindi, respond in Hindi, etc."
    }
  });
  
  return response.text;
}

export async function getSuggestedTopics(subject: string): Promise<string[]> {
  const model = "gemini-3-flash-preview";
  const prompt = `List 10 most common and important study topics/chapters for the subject: ${subject}. Return as a simple JSON array of strings.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  
  return JSON.parse(response.text);
}
