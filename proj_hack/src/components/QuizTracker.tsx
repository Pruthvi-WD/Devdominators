import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { QuizScore, StudentProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Trophy, Plus, Trash2, Target, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getSuggestedTopics } from '../lib/ai';

interface QuizTrackerProps {
  user: User;
  scores: QuizScore[];
  profile: StudentProfile;
}

export default function QuizTracker({ user, scores, profile }: QuizTrackerProps) {
  const [formData, setFormData] = useState({
    subject: profile.subjects[0] || '',
    topic: '',
    score: 0,
    total: 10
  });
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (formData.subject) {
      const fetchTopics = async () => {
        setLoadingTopics(true);
        try {
          const topics = await getSuggestedTopics(formData.subject);
          setSuggestedTopics(topics);
        } catch (error) {
          console.error("Failed to fetch topics:", error);
        } finally {
          setLoadingTopics(false);
        }
      };
      fetchTopics();
    }
  }, [formData.subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.topic) return;

    await addDoc(collection(db, 'quizScores'), {
      uid: user.uid,
      subject: formData.subject,
      topic: formData.topic,
      score: formData.score,
      total: formData.total,
      timestamp: new Date().toISOString()
    });

    setFormData({ subject: profile.subjects[0] || '', topic: '', score: 0, total: 10 });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Form */}
      <div className="glass-panel p-8 neon-border neon-border-red relative overflow-hidden h-fit">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Target className="w-20 h-20 text-neon-red" />
        </div>
        <div className="flex items-center gap-3 mb-8">
          <Plus className="w-5 h-5 text-neon-red" />
          <h3 className="tech-label text-neon-red">Log Quiz</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="tech-label">Subject</label>
            <select 
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value, topic: ''})}
              className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-neon-red/50 transition-all font-sans text-lg appearance-none cursor-pointer"
            >
              <option value="" disabled className="bg-bg">Select a subject</option>
              {profile.subjects.map(s => (
                <option key={s} value={s} className="bg-bg">{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="tech-label flex items-center justify-between">
              Topic
              {loadingTopics && <Loader2 className="w-3 h-3 animate-spin text-neon-red" />}
            </label>
            <div className="relative">
              <input 
                type="text" 
                list="suggested-topics-quiz"
                value={formData.topic}
                onChange={e => setFormData({...formData, topic: e.target.value})}
                className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-neon-red/50 transition-all font-sans text-lg placeholder:text-text-dim/30"
                placeholder="Select or type a topic"
              />
              <datalist id="suggested-topics-quiz">
                {suggestedTopics.map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="tech-label">Score</label>
              <input 
                type="number" 
                value={formData.score}
                onChange={e => setFormData({...formData, score: parseInt(e.target.value) || 0})}
                className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-neon-red/50 transition-all font-mono text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="tech-label">Total</label>
              <input 
                type="number" 
                value={formData.total}
                onChange={e => setFormData({...formData, total: parseInt(e.target.value) || 0})}
                className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-neon-red/50 transition-all font-mono text-lg"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={!formData.subject || !formData.topic}
            className="w-full btn-neon-red py-4 flex items-center justify-center gap-3 group disabled:opacity-50"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            LOG SCORE
          </button>
        </form>
      </div>

      {/* List */}
      <div className="lg:col-span-2 glass-panel border border-border overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border bg-surface/50 flex justify-between items-center relative">
          <div className="absolute inset-0 scanline opacity-10" />
          <div className="flex items-center gap-3 relative z-10">
            <Trophy className="w-5 h-5 text-neon-red" />
            <h3 className="tech-label">Performance History</h3>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-2 h-2 bg-neon-red rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-neon-red uppercase tracking-widest">Neural Records</span>
          </div>
        </div>
        
        <div className="divide-y divide-border overflow-y-auto max-h-[600px] custom-scrollbar">
          {scores.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(score => {
            const percentage = (score.score / score.total) * 100;
            return (
              <div key={score.id} className="p-6 flex justify-between items-center hover:bg-neon-red/5 transition-all group">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-surface border border-border rounded-sm flex flex-col items-center justify-center shrink-0 group-hover:border-neon-red/30 transition-all relative">
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-neon-red transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="text-white font-bold text-lg leading-none">{score.score}</span>
                    <div className="w-full h-[1px] bg-border my-1" />
                    <span className="text-text-dim font-mono text-[10px] leading-none">{score.total}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-mono bg-neon-red/10 text-neon-red border border-neon-red/20 px-2 py-0.5 uppercase tracking-widest">{score.subject}</span>
                      <span className="text-lg font-bold text-white tracking-tight">{score.topic}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-text-dim uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(score.timestamp), 'MMM dd, yyyy · HH:mm')}
                      </div>
                      <div className={`flex items-center gap-1.5 ${percentage >= 80 ? 'text-neon-blue' : percentage >= 50 ? 'text-neon-yellow' : 'text-neon-red'}`}>
                        {percentage.toFixed(0)}% ACCURACY
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => deleteDoc(doc(db, 'quizScores', score.id!))}
                  className="p-3 text-text-dim hover:text-neon-red hover:bg-neon-red/10 border border-transparent hover:border-neon-red/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
          {scores.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-surface border border-border border-dashed rounded-full flex items-center justify-center opacity-20">
                <Trophy className="w-8 h-8" />
              </div>
              <p className="text-text-dim font-serif italic text-lg">No performance data recorded in the neural network yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
