import { AIAnalysis } from '../types';
import { BrainCircuit, AlertCircle, CheckCircle2, Sparkles, Activity } from 'lucide-react';

interface AIInsightsProps {
  analysis: AIAnalysis | null;
}

export default function AIInsights({ analysis }: AIInsightsProps) {
  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 animate-fade-in">
        <div className="w-20 h-20 bg-surface border border-border rounded-sm flex items-center justify-center mb-6 relative">
          <BrainCircuit className="w-12 h-12 text-neon-blue opacity-20" />
          <div className="absolute inset-0 bg-neon-blue/5 animate-pulse rounded-sm" />
        </div>
        <h3 className="text-xl font-bold uppercase tracking-tighter glow-text-blue mb-2">Awaiting Data Sync</h3>
        <p className="max-w-md text-sm text-text-dim font-serif italic leading-relaxed">
          Your digital twin needs more data to generate deep insights. Log your study sessions and quiz scores, then click "Re-Sync Twin" to update your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
      {/* Learning Style */}
      <div className="col-span-1 md:col-span-2 glass-panel p-8 neon-border neon-border-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity className="w-24 h-24 text-neon-blue" />
        </div>
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 text-neon-blue" />
          <h3 className="tech-label">Learning Style Analysis</h3>
        </div>
        <p className="text-2xl font-serif italic leading-relaxed text-white relative z-10">
          "{analysis.learningStyleAnalysis}"
        </p>
      </div>

      {/* Weak Topics */}
      <div className="glass-panel p-8 border border-neon-red/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/5 blur-3xl -mr-16 -mt-16 group-hover:bg-neon-red/10 transition-all" />
        <div className="flex items-center gap-3 mb-6 text-neon-red">
          <AlertCircle className="w-5 h-5" />
          <h3 className="tech-label text-neon-red">Danger Zones (Weak Topics)</h3>
        </div>
        <div className="space-y-4">
          {analysis.weakTopics.map((topic, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-surface border border-border border-dashed hover:border-neon-red/50 transition-all">
              <span className="font-bold text-white tracking-tight">{topic}</span>
              <span className="text-[10px] font-mono uppercase text-neon-red tracking-widest bg-neon-red/10 px-2 py-1">High Priority</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strong Topics */}
      <div className="glass-panel p-8 border border-neon-blue/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 blur-3xl -mr-16 -mt-16 group-hover:bg-neon-blue/10 transition-all" />
        <div className="flex items-center gap-3 mb-6 text-neon-blue">
          <CheckCircle2 className="w-5 h-5" />
          <h3 className="tech-label text-neon-blue">Mastery Zones (Strong Topics)</h3>
        </div>
        <div className="space-y-4">
          {analysis.strongTopics.map((topic, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-surface border border-border border-dashed hover:border-neon-blue/50 transition-all">
              <span className="font-bold text-white tracking-tight">{topic}</span>
              <span className="text-[10px] font-mono uppercase text-neon-blue tracking-widest bg-neon-blue/10 px-2 py-1">Mastered</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
