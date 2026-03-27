import { useState } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { StudentProfile } from '../types';
import { ArrowRight, Sparkles, BrainCircuit, ChevronLeft } from 'lucide-react';

interface OnboardingProps {
  user: User;
  onComplete: (profile: StudentProfile) => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: user.displayName || '',
    subjects: '',
    studyHours: 2,
    targetScore: 85,
    examDate: '',
  });

  const handleSubmit = async () => {
    const profile: StudentProfile = {
      uid: user.uid,
      name: formData.name,
      subjects: formData.subjects.split(',').map(s => s.trim()),
      studyHoursPerDay: formData.studyHours,
      targetScore: formData.targetScore,
      examDate: formData.examDate,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'profiles', user.uid), profile);
    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden scanline">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-red/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-xl w-full glass-panel p-10 neon-border neon-border-blue relative z-10 animate-fade-in">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-neon-blue/10 border border-neon-blue/30 rounded-sm flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-neon-blue" />
            </div>
            <div className="flex flex-col">
              <span className="tech-label">Neural Profile Initialization</span>
              <div className="flex items-center gap-2">
                <div className={`h-1 w-8 rounded-full transition-all ${step >= 1 ? 'bg-neon-blue shadow-[0_0_8px_rgba(0,240,255,0.5)]' : 'bg-white/10'}`} />
                <div className={`h-1 w-8 rounded-full transition-all ${step >= 2 ? 'bg-neon-blue shadow-[0_0_8px_rgba(0,240,255,0.5)]' : 'bg-white/10'}`} />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter uppercase glow-text-blue">Building Your Twin</h2>
          <p className="text-[10px] font-mono text-text-dim uppercase mt-2">Authenticated: {user.email}</p>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <label className="tech-label">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-neon-blue/50 transition-all font-sans text-lg"
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <label className="tech-label">Subjects (comma separated)</label>
              <input 
                type="text" 
                placeholder="Math, Physics, History..."
                value={formData.subjects}
                onChange={e => setFormData({...formData, subjects: e.target.value})}
                className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-neon-blue/50 transition-all font-sans text-lg"
              />
            </div>
            <button 
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.subjects}
              className="w-full btn-neon-blue py-4 flex items-center justify-between group"
            >
              <span className="uppercase tracking-widest">Next Phase</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="tech-label">Daily Study Hours</label>
                <span className="text-neon-blue font-mono text-sm">{formData.studyHours} HRS</span>
              </div>
              <input 
                type="range" min="1" max="12"
                value={formData.studyHours}
                onChange={e => setFormData({...formData, studyHours: parseInt(e.target.value) || 1})}
                className="w-full accent-neon-blue bg-surface-light h-2 rounded-full appearance-none cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="tech-label">Target Score (%)</label>
                <input 
                  type="number" 
                  value={formData.targetScore}
                  onChange={e => setFormData({...formData, targetScore: parseInt(e.target.value) || 0})}
                  className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-neon-blue/50 transition-all font-mono text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="tech-label">Exam Date</label>
                <input 
                  type="date" 
                  value={formData.examDate}
                  onChange={e => setFormData({...formData, examDate: e.target.value})}
                  className="w-full bg-surface border border-border px-4 py-3 text-white focus:outline-none focus:border-neon-blue/50 transition-all font-mono text-lg"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 btn-neon-outline py-4 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                BACK
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-[2] btn-neon-blue py-4 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                FINALIZE TWIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
