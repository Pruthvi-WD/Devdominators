import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { StudentProfile } from '../types';
import { Save, User as UserIcon, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProfileProps {
  profile: StudentProfile;
  onUpdate: (profile: StudentProfile) => void;
}

export default function Profile({ profile, onUpdate }: ProfileProps) {
  const [formData, setFormData] = useState({
    name: profile.name,
    subjects: profile.subjects.join(', '),
    studyHours: profile.studyHoursPerDay,
    targetScore: profile.targetScore || 85,
    examDate: profile.examDate || '',
    learningStyle: profile.learningStyle || 'Visual'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const updatedProfile: StudentProfile = {
      ...profile,
      name: formData.name,
      subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s !== ''),
      studyHoursPerDay: formData.studyHours,
      targetScore: formData.targetScore,
      examDate: formData.examDate,
      learningStyle: formData.learningStyle as any
    };

    try {
      await setDoc(doc(db, 'profiles', profile.uid), updatedProfile);
      onUpdate(updatedProfile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="glass-panel p-10 neon-border neon-border-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <UserIcon className="w-32 h-32 text-neon-blue" />
        </div>

        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="w-12 h-12 bg-neon-blue/10 border border-neon-blue/30 rounded-sm flex items-center justify-center">
            <UserIcon className="w-7 h-7 text-neon-blue" />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter uppercase glow-text-blue">Student Profile</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-2">
              <label className="tech-label">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-surface border-b border-border py-3 focus:outline-none focus:border-neon-blue transition-all font-serif italic text-2xl text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="tech-label">Subjects (comma separated)</label>
              <input 
                type="text" 
                value={formData.subjects}
                onChange={e => setFormData({...formData, subjects: e.target.value})}
                className="w-full bg-surface border-b border-border py-3 focus:outline-none focus:border-neon-blue transition-all font-serif italic text-2xl text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="tech-label">Daily Study Hours</label>
                <input 
                  type="number" 
                  min="1" max="24"
                  value={formData.studyHours}
                  onChange={e => setFormData({...formData, studyHours: parseInt(e.target.value) || 1})}
                  className="w-full bg-surface border-b border-border py-3 focus:outline-none focus:border-neon-blue transition-all font-mono text-xl text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="tech-label">Target Score (%)</label>
                <input 
                  type="number" 
                  min="0" max="100"
                  value={formData.targetScore}
                  onChange={e => setFormData({...formData, targetScore: parseInt(e.target.value) || 0})}
                  className="w-full bg-surface border-b border-border py-3 focus:outline-none focus:border-neon-blue transition-all font-mono text-xl text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="tech-label">Exam Date</label>
                <input 
                  type="date" 
                  value={formData.examDate}
                  onChange={e => setFormData({...formData, examDate: e.target.value})}
                  className="w-full bg-surface border-b border-border py-3 focus:outline-none focus:border-neon-blue transition-all font-mono text-xl text-white [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="tech-label">Learning Style</label>
                <select 
                  value={formData.learningStyle}
                  onChange={e => setFormData({...formData, learningStyle: e.target.value})}
                  className="w-full bg-surface border-b border-border py-3 focus:outline-none focus:border-neon-blue transition-all font-serif italic text-2xl text-white appearance-none cursor-pointer"
                >
                  <option value="Visual" className="bg-bg">Visual</option>
                  <option value="Auditory" className="bg-bg">Auditory</option>
                  <option value="Reading-Writing" className="bg-bg">Reading-Writing</option>
                  <option value="Kinesthetic" className="bg-bg">Kinesthetic</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 flex items-center gap-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-neon-blue py-5 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                  SAVING CHANGES...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  SAVE PROFILE
                </>
              )}
            </button>
            
            {saved && (
              <div className="flex items-center gap-2 text-neon-blue font-bold animate-fade-in">
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-[10px] uppercase tracking-widest">Updated</span>
              </div>
            )}
          </div>
        </form>

        <div className="mt-12 p-6 glass-panel border border-border border-dashed relative overflow-hidden">
          <div className="absolute inset-0 scanline opacity-10" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <Sparkles className="w-4 h-4 text-neon-blue" />
            <h4 className="tech-label">Digital Twin Note</h4>
          </div>
          <p className="text-sm font-serif italic text-text-dim leading-relaxed relative z-10">
            Updating your profile parameters will help Aura refine your performance predictions and revision roadmap. Your learning style can be manually adjusted here if you feel the AI classification needs correction.
          </p>
        </div>
      </div>
    </div>
  );
}
