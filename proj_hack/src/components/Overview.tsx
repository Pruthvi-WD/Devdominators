import { StudentProfile, StudySession, QuizScore, AIAnalysis } from '../types';
import { Brain, Target, TrendingUp, Clock, AlertCircle, Sparkles, Activity } from 'lucide-react';

interface OverviewProps {
  profile: StudentProfile;
  sessions: StudySession[];
  scores: QuizScore[];
  analysis: AIAnalysis | null;
}

export default function Overview({ profile, sessions, scores, analysis }: OverviewProps) {
  const totalStudyTime = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Predicted Score" 
          value={analysis?.predictedScore ? `${analysis.predictedScore}%` : 'TBD'} 
          icon={Target} 
          subValue={`Target: ${profile.targetScore}%`}
          color="blue"
        />
        <StatCard 
          label="Engagement" 
          value={analysis?.engagement.status || 'Analyzing...'} 
          icon={TrendingUp} 
          subValue={analysis?.engagement.trend ? `Trend: ${analysis.engagement.trend}` : 'Calculating trend'}
          color={
            analysis?.engagement.status === 'At Risk' ? 'red' : 
            analysis?.engagement.status === 'Losing Interest' ? 'red' : 'blue'
          }
        />
        <StatCard 
          label="Total Study Time" 
          value={`${(totalStudyTime / 60).toFixed(1)}h`} 
          icon={Clock} 
          subValue={`${sessions.length} Sessions`}
          color="blue"
        />
        <StatCard 
          label="Learning Style" 
          value={profile.learningStyle || 'Analyzing...'} 
          icon={Brain} 
          subValue="AI Classified"
          color="blue"
        />
      </div>

      {/* Engagement Alert */}
      {analysis?.engagement && analysis.engagement.status !== 'Consistent' && (
        <div className={`p-6 glass-panel border-l-4 flex items-center gap-6 animate-fade-in relative overflow-hidden ${
          analysis.engagement.status === 'At Risk' ? 'border-neon-red bg-neon-red/5' : 'border-neon-red/50 bg-neon-red/5'
        }`}>
          <div className="absolute inset-0 scanline opacity-10" />
          <div className={`w-12 h-12 rounded-sm flex items-center justify-center shrink-0 relative z-10 ${
            analysis.engagement.status === 'At Risk' ? 'bg-neon-red text-bg shadow-[0_0_15px_rgba(255,0,60,0.4)]' : 'bg-neon-red/50 text-bg'
          }`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-bold uppercase tracking-widest mb-1 text-neon-red">Engagement Warning: {analysis.engagement.status}</h4>
            <p className="text-sm font-serif italic text-text-dim leading-relaxed">{analysis.engagement.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Motivational Nudge */}
        <div className="lg:col-span-2 glass-panel p-8 neon-border neon-border-blue relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="w-24 h-24 text-neon-blue" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-neon-blue" />
            <h3 className="tech-label">Digital Twin Status</h3>
          </div>
          <p className="text-2xl font-serif italic leading-relaxed text-white relative z-10">
            "{analysis?.motivationalMessage || "Your digital twin is currently gathering data. Log your study sessions and quizzes to see your performance predictions."}"
          </p>
        </div>

        {/* Quick Weak Topics */}
        <div className="glass-panel p-8 border border-neon-red/20 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 text-neon-red">
            <AlertCircle className="w-5 h-5" />
            <h3 className="tech-label text-neon-red">Danger Zones</h3>
          </div>
          <div className="space-y-4">
            {analysis?.weakTopics && analysis.weakTopics.length > 0 ? (
              analysis.weakTopics.slice(0, 5).map((topic, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface border border-border border-dashed hover:border-neon-red/30 transition-all">
                  <div className="w-1.5 h-1.5 bg-neon-red shadow-[0_0_5px_rgba(255,0,60,0.8)] rounded-full" />
                  <span className="text-sm font-bold text-white tracking-tight">{topic}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-dim italic">No critical data points yet...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, subValue, color }: any) {
  const isRed = color === 'red';
  
  return (
    <div className={`glass-panel p-6 border transition-all group relative overflow-hidden ${
      isRed ? 'border-neon-red/20 hover:border-neon-red/50' : 'border-border hover:border-neon-blue/50'
    }`}>
      <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl -mr-12 -mt-12 transition-all ${
        isRed ? 'bg-neon-red/5 group-hover:bg-neon-red/10' : 'bg-neon-blue/5 group-hover:bg-neon-blue/10'
      }`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <span className="tech-label">{label}</span>
        <Icon className={`w-4 h-4 opacity-30 group-hover:opacity-60 transition-opacity ${
          isRed ? 'text-neon-red' : 'text-neon-blue'
        }`} />
      </div>
      
      <div className={`text-3xl font-bold tracking-tighter mb-2 relative z-10 ${
        isRed ? 'text-neon-red glow-text-red' : 'text-white'
      }`}>
        {value}
      </div>
      
      <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest relative z-10">
        {subValue}
      </div>
    </div>
  );
}
