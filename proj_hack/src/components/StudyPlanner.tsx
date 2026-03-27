import { useState, useMemo } from 'react';
import { AIAnalysis, StudyPlanTask } from '../types';
import { Calendar, CheckCircle2, Circle, Clock, BookOpen, Brain, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface StudyPlannerProps {
  analysis: AIAnalysis | null;
  studyPlanTasks: StudyPlanTask[];
}

export default function StudyPlanner({ analysis, studyPlanTasks }: StudyPlannerProps) {
  const [view, setView] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const filteredTasks = useMemo(() => {
    return studyPlanTasks.filter(task => isSameDay(parseISO(task.day), selectedDate));
  }, [studyPlanTasks, selectedDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      await updateDoc(doc(db, 'studyPlanTasks', taskId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'Study': return <BookOpen className="w-5 h-5" />;
      case 'Quiz': return <Trophy className="w-5 h-5" />;
      case 'Revision': return <Brain className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Study': return 'bg-neon-blue/10 text-neon-blue border-neon-blue/20';
      case 'Quiz': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Revision': return 'bg-neon-red/10 text-neon-red border-neon-red/20';
      default: return 'bg-surface-light text-text-dim border-border';
    }
  };

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-64 glass-panel border border-border border-dashed opacity-50">
        <Brain className="w-12 h-12 mb-4 text-neon-blue animate-pulse" />
        <p className="tech-label">Awaiting Digital Twin Sync...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header & View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter uppercase glow-text-blue mb-2">Dynamic Study Planner</h2>
          <p className="tech-label">AI-Optimized Schedule based on your Behavior</p>
        </div>
        
        <div className="flex items-center bg-surface border border-border p-1 rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.3)]">
          <button 
            onClick={() => setView('day')}
            className={`px-6 py-2 text-[10px] font-bold tracking-widest transition-all uppercase ${view === 'day' ? 'bg-neon-blue text-bg shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-text-dim hover:text-white'}`}
          >
            DAILY
          </button>
          <button 
            onClick={() => setView('week')}
            className={`px-6 py-2 text-[10px] font-bold tracking-widest transition-all uppercase ${view === 'week' ? 'bg-neon-blue text-bg shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-text-dim hover:text-white'}`}
          >
            WEEKLY
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between glass-panel p-6 neon-border neon-border-blue/30">
        <button 
          onClick={() => setSelectedDate(prev => addDays(prev, view === 'day' ? -1 : -7))}
          className="p-3 hover:bg-surface-light border border-border hover:border-neon-blue/50 transition-all text-text-dim hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <h3 className="text-2xl font-bold tracking-tight text-white mb-1">
            {view === 'day' 
              ? format(selectedDate, 'EEEE, MMMM do')
              : `${format(weekDays[0], 'MMM do')} - ${format(weekDays[6], 'MMM do, yyyy')}`
            }
          </h3>
          {view === 'day' && <p className="tech-label text-neon-blue">Today's Focus</p>}
        </div>

        <button 
          onClick={() => setSelectedDate(prev => addDays(prev, view === 'day' ? 1 : 7))}
          className="p-3 hover:bg-surface-light border border-border hover:border-neon-blue/50 transition-all text-text-dim hover:text-white"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {view === 'week' && (
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const dayTasks = studyPlanTasks.filter(t => isSameDay(parseISO(t.day), day));
            const completedCount = dayTasks.filter(t => t.status === 'Completed').length;
            
            return (
              <button
                key={day.toString()}
                onClick={() => {
                  setSelectedDate(day);
                  setView('day');
                }}
                className={`flex flex-col items-center p-4 border transition-all relative overflow-hidden ${
                  isSelected 
                    ? 'bg-neon-blue/10 border-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                    : 'bg-surface border-border hover:border-neon-blue/50'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-text-dim mb-1">{format(day, 'EEE')}</span>
                <span className={`text-xl font-bold ${isSelected ? 'text-neon-blue' : 'text-white'}`}>{format(day, 'd')}</span>
                {dayTasks.length > 0 && (
                  <div className="mt-3 flex gap-1">
                    {dayTasks.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full ${i < completedCount ? 'bg-neon-blue shadow-[0_0_5px_rgba(0,240,255,0.8)]' : 'bg-surface-light'}`} 
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Task List */}
      <div className="space-y-6">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div 
              key={task.id}
              className={`group flex items-center gap-8 p-8 glass-panel border transition-all relative overflow-hidden ${
                task.status === 'Completed' 
                  ? 'border-border opacity-60 grayscale' 
                  : 'border-border hover:border-neon-blue/50'
              }`}
            >
              <div className="absolute inset-0 scanline opacity-5" />
              
              <button 
                onClick={() => task.id && toggleTaskStatus(task.id, task.status)}
                className="flex-shrink-0 transition-transform active:scale-90 relative z-10"
              >
                {task.status === 'Completed' ? (
                  <CheckCircle2 className="w-10 h-10 text-neon-blue" />
                ) : (
                  <Circle className="w-10 h-10 text-text-dim group-hover:text-neon-blue" />
                )}
              </button>

              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-4 mb-2">
                  <span className={`px-3 py-1 text-[10px] font-bold tracking-widest border uppercase ${getTypeColor(task.type)}`}>
                    {task.type}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim uppercase tracking-widest">
                    <Clock className="w-3 h-3 text-neon-blue" />
                    {task.timeSlot}
                  </div>
                </div>
                <h4 className={`text-2xl font-bold truncate tracking-tight ${task.status === 'Completed' ? 'line-through text-text-dim' : 'text-white'}`}>
                  {task.subject}: {task.topic}
                </h4>
                <p className="text-sm text-text-dim mt-2 italic font-serif leading-relaxed">
                  Objective: {task.objective}
                </p>
              </div>

              <div className="hidden md:flex flex-col items-end gap-2 relative z-10">
                <div className="w-12 h-12 bg-surface-light border border-border rounded-sm flex items-center justify-center text-text-dim group-hover:text-neon-blue transition-colors">
                  {getTaskIcon(task.type)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 glass-panel border border-border border-dashed opacity-30">
            <Calendar className="w-16 h-16 mx-auto mb-6 text-neon-blue opacity-20" />
            <p className="tech-label mb-2">No tasks scheduled for this day</p>
            <p className="text-sm font-serif italic">AI generates your plan based on your study habits</p>
          </div>
        )}
      </div>

      {/* AI Strategy Summary */}
      <div className="glass-panel p-10 neon-border neon-border-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Brain className="w-32 h-32 text-neon-blue" />
        </div>
        
        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="w-12 h-12 bg-neon-blue/10 border border-neon-blue/30 rounded-sm flex items-center justify-center">
            <Brain className="w-7 h-7 text-neon-blue" />
          </div>
          <h3 className="text-2xl font-bold tracking-tighter uppercase glow-text-blue">AI Strategic Guidance</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-12 relative z-10">
          <div className="space-y-6">
            <p className="text-lg font-serif italic leading-relaxed text-text-dim">
              {analysis.learningStyleAnalysis}
            </p>
            <div className="p-6 bg-surface border border-border border-dashed">
              <p className="tech-label text-neon-blue mb-3">Motivational Pulse</p>
              <p className="text-2xl font-bold italic text-white leading-tight">"{analysis.motivationalMessage}"</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-surface border border-border">
              <span className="tech-label">Predicted Score Impact</span>
              <span className="text-3xl font-bold text-neon-blue glow-text-blue">+{analysis.predictedScore}%</span>
            </div>
            <div className="flex items-center justify-between p-6 bg-surface border border-border">
              <span className="tech-label">Engagement Status</span>
              <span className={`text-xs font-bold px-3 py-1 tracking-widest uppercase ${
                analysis.engagement.status === 'Consistent' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-neon-red/20 text-neon-red'
              }`}>
                {analysis.engagement.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
