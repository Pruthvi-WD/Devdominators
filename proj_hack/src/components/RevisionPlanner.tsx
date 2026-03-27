import { RevisionTask } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Calendar, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';

interface RevisionPlannerProps {
  tasks: RevisionTask[];
}

export default function RevisionPlanner({ tasks }: RevisionPlannerProps) {
  const toggleStatus = async (task: RevisionTask) => {
    await updateDoc(doc(db, 'revisionTasks', task.id!), {
      status: task.status === 'Completed' ? 'Pending' : 'Completed'
    });
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM dd');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h3 className="tech-label mb-2">AI Generated Schedule</h3>
          <h2 className="text-4xl font-bold tracking-tighter uppercase glow-text-blue">Revision Roadmap</h2>
        </div>
        <div className="text-right font-mono text-xs text-text-dim">
          <span className="text-neon-blue font-bold">{tasks.filter(t => t.status === 'Completed').length}</span> / {tasks.length} COMPLETED
        </div>
      </div>

      <div className="space-y-6">
        {sortedTasks.map((task, i) => (
          <div 
            key={task.id} 
            className={`group flex items-start gap-6 p-6 glass-panel border transition-all relative overflow-hidden ${
              task.status === 'Completed' 
                ? 'border-border opacity-50 grayscale' 
                : 'border-border hover:border-neon-blue/50'
            }`}
          >
            <div className="absolute inset-0 scanline opacity-5" />
            
            <div className="pt-1 relative z-10">
              <button 
                onClick={() => toggleStatus(task)}
                className={`transition-all active:scale-90 ${
                  task.status === 'Completed' ? 'text-neon-blue' : 'text-text-dim hover:text-neon-blue'
                }`}
              >
                {task.status === 'Completed' ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
              </button>
            </div>

            <div className="flex-1 relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-mono bg-neon-blue/10 text-neon-blue px-2 py-0.5 uppercase tracking-widest border border-neon-blue/20">{task.subject}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 uppercase tracking-widest border ${
                  task.priority === 'High' ? 'bg-neon-red/10 text-neon-red border-neon-red/20' : 
                  task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-neon-blue/10 text-neon-blue border-neon-blue/20'
                }`}>
                  {task.priority} Priority
                </span>
              </div>
              <h4 className={`text-2xl font-bold mb-2 tracking-tight ${task.status === 'Completed' ? 'line-through text-text-dim' : 'text-white'}`}>
                {task.topic}
              </h4>
              <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim uppercase tracking-widest">
                <Calendar className="w-3 h-3 text-neon-blue" />
                {getDayLabel(task.dueDate)}
              </div>
            </div>

            <button 
              onClick={() => deleteDoc(doc(db, 'revisionTasks', task.id!))}
              className="p-3 text-neon-red opacity-0 group-hover:opacity-100 hover:bg-neon-red/10 transition-all relative z-10"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="p-20 text-center glass-panel border-2 border-dashed border-border opacity-30">
            <p className="font-serif italic text-xl">No tasks generated yet. Click "Re-Sync Twin" to build your roadmap.</p>
          </div>
        )}
      </div>
    </div>
  );
}
