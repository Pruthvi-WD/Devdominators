import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { StudySession, QuizScore, QuizQuestion, StudentProfile } from '../types';
import { generateQuiz, getSuggestedTopics } from '../lib/ai';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Brain, Sparkles, CheckCircle2, XCircle, ArrowRight, Loader2, Trophy, Target, ChevronRight } from 'lucide-react';

interface AIQuizProps {
  user: User;
  sessions: StudySession[];
  scores: QuizScore[];
  profile: StudentProfile;
}

export default function AIQuiz({ user, sessions, scores, profile }: AIQuizProps) {
  const [step, setStep] = useState<'select' | 'loading' | 'quiz' | 'result'>('select');
  const [selectedSubject, setSelectedSubject] = useState(profile.subjects[0] || '');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<{ score: number, total: number } | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Fetch suggested topics when subject changes
  React.useEffect(() => {
    if (selectedSubject) {
      const fetchTopics = async () => {
        setLoadingTopics(true);
        try {
          const topics = await getSuggestedTopics(selectedSubject);
          setSuggestedTopics(topics);
        } catch (error) {
          console.error("Failed to fetch topics:", error);
        } finally {
          setLoadingTopics(false);
        }
      };
      fetchTopics();
    }
  }, [selectedSubject]);

  const startGeneration = async () => {
    if (!selectedSubject || !selectedTopic) return;
    setStep('loading');
    try {
      const generatedQuestions = await generateQuiz(selectedSubject, selectedTopic, questionCount, scores);
      setQuestions(generatedQuestions);
      setStep('quiz');
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
    } catch (error) {
      console.error("Quiz generation failed:", error);
      setStep('select');
    }
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = async (answers: string[]) => {
    let correctCount = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correctCount++;
    });

    setQuizResult({ score: correctCount, total: questions.length });
    setStep('result');

    // Save to Firestore
    await addDoc(collection(db, 'quizScores'), {
      uid: user.uid,
      subject: selectedSubject,
      topic: selectedTopic,
      score: correctCount,
      total: questions.length,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {step === 'select' && (
        <div className="glass-panel p-10 neon-border neon-border-blue relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Brain className="w-32 h-32 text-neon-blue" />
          </div>
          
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-neon-blue/10 border border-neon-blue/30 rounded-sm flex items-center justify-center">
              <Brain className="w-7 h-7 text-neon-blue" />
            </div>
            <h2 className="text-3xl font-bold tracking-tighter uppercase glow-text-blue">AI Quiz Generator</h2>
          </div>

          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="tech-label">Select Subject</label>
                <select 
                  value={selectedSubject}
                  onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic(''); }}
                  className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-neon-blue/50 transition-all font-sans text-lg appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-bg">Choose Subject...</option>
                  {profile.subjects.map(s => <option key={s} value={s} className="bg-bg">{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="tech-label flex items-center justify-between">
                  Select Topic
                  {loadingTopics && <Loader2 className="w-3 h-3 animate-spin text-neon-blue" />}
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    list="suggested-topics-ai-quiz"
                    value={selectedTopic}
                    onChange={e => setSelectedTopic(e.target.value)}
                    disabled={!selectedSubject}
                    className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-neon-blue/50 transition-all font-sans text-lg placeholder:text-text-dim/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    placeholder="Select or type a topic"
                  />
                  <datalist id="suggested-topics-ai-quiz">
                    {suggestedTopics.map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="tech-label">Number of Questions</label>
              <div className="flex flex-wrap gap-4">
                {[3, 5, 10, 15].map(n => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`flex-1 min-w-[80px] py-3 font-mono text-sm border transition-all ${
                      questionCount === n 
                        ? 'bg-neon-blue text-bg border-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.4)]' 
                        : 'bg-surface border-border text-text-dim hover:border-neon-blue/50'
                    }`}
                  >
                    {n} Qs
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGeneration}
              disabled={!selectedSubject || !selectedTopic}
              className="w-full btn-neon-blue py-5 flex items-center justify-center gap-3 group"
            >
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              GENERATE CUSTOM QUIZ
            </button>
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div className="glass-panel p-20 neon-border neon-border-blue flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 scanline opacity-20" />
          <Loader2 className="w-16 h-16 text-neon-blue animate-spin mb-8" />
          <h3 className="text-2xl font-bold tracking-tighter uppercase glow-text-blue mb-4">Aura is Crafting Questions</h3>
          <p className="font-serif italic text-text-dim text-lg max-w-md">
            Analyzing your previous performance to set the perfect difficulty level...
          </p>
        </div>
      )}

      {step === 'quiz' && questions[currentQuestionIndex] && (
        <div className="glass-panel neon-border neon-border-blue animate-fade-in overflow-hidden relative">
          <div className="bg-surface border-b border-border p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neon-blue/10 border border-neon-blue/30 rounded-sm flex items-center justify-center">
                <span className="text-neon-blue font-mono text-xs">{currentQuestionIndex + 1}</span>
              </div>
              <span className="tech-label">Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            <span className="tech-label text-neon-blue">{selectedSubject} / {selectedTopic}</span>
          </div>
          
          <div className="p-12">
            <h3 className="text-2xl font-serif italic mb-12 leading-relaxed text-white">
              "{questions[currentQuestionIndex].question}"
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {questions[currentQuestionIndex].options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  className="w-full text-left p-6 bg-surface border border-border hover:border-neon-blue/50 hover:bg-neon-blue/5 transition-all group flex items-center justify-between"
                >
                  <span className="font-bold text-lg tracking-tight group-hover:text-neon-blue transition-colors">{option}</span>
                  <ChevronRight className="w-5 h-5 text-neon-blue opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="h-1 bg-surface-light">
            <div 
              className="h-full bg-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.8)] transition-all duration-500" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 'result' && quizResult && (
        <div className="glass-panel p-12 neon-border neon-border-blue animate-fade-in text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-neon-blue" />
          
          <div className="inline-flex items-center justify-center w-24 h-24 bg-neon-blue/10 border border-neon-blue/30 rounded-full mb-8 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
            <Trophy className="w-12 h-12 text-neon-blue" />
          </div>
          
          <h2 className="text-4xl font-bold tracking-tighter uppercase glow-text-blue mb-2">Quiz Complete</h2>
          <p className="font-serif italic text-text-dim mb-10">Data synced to your digital twin profile.</p>

          <div className="flex items-center justify-center gap-12 mb-12">
            <div className="text-center">
              <div className="text-6xl font-bold tracking-tighter text-white mb-2">
                {quizResult.score}<span className="text-2xl text-text-dim">/{quizResult.total}</span>
              </div>
              <div className="tech-label">Correct Answers</div>
            </div>
            <div className="w-px h-16 bg-border" />
            <div className="text-center">
              <div className="text-6xl font-bold tracking-tighter text-neon-blue mb-2">
                {Math.round((quizResult.score / quizResult.total) * 100)}<span className="text-2xl">%</span>
              </div>
              <div className="tech-label text-neon-blue">Accuracy</div>
            </div>
          </div>

          <div className="space-y-6 text-left max-w-2xl mx-auto mb-12">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Target className="w-4 h-4 text-neon-blue" />
              <h4 className="tech-label">Review Explanations</h4>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {questions.map((q, i) => (
                <div key={i} className="p-5 bg-surface border border-border border-dashed hover:border-neon-blue/30 transition-all">
                  <div className="flex items-start gap-4 mb-3">
                    {userAnswers[i] === q.correctAnswer ? (
                      <CheckCircle2 className="w-5 h-5 text-neon-blue shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-neon-red shrink-0 mt-0.5" />
                    )}
                    <p className="font-bold text-white tracking-tight leading-tight">{q.question}</p>
                  </div>
                  <div className="pl-9">
                    <p className="text-xs font-serif italic text-text-dim leading-relaxed border-l-2 border-border pl-4">{q.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep('select')}
            className="btn-neon-blue py-4 px-12 uppercase tracking-widest"
          >
            Back to Generator
          </button>
        </div>
      )}
    </div>
  );
}
