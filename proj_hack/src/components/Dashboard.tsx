import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { StudentProfile, StudySession, QuizScore, AIAnalysis, RevisionTask, StudyPlanTask } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { analyzeStudentData } from '../lib/ai';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  BrainCircuit, 
  Calendar, 
  ClipboardList, 
  MessageSquare,
  LogOut,
  User as UserIcon,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Clock
} from 'lucide-react';
import Overview from './Overview';
import StudyTracker from './StudyTracker';
import QuizTracker from './QuizTracker';
import AIInsights from './AIInsights';
import RevisionPlanner from './RevisionPlanner';
import StudyPlanner from './StudyPlanner';
import AITutor from './AITutor';
import Profile from './Profile';

import AIQuiz from './AIQuiz';

interface DashboardProps {
  user: User;
  profile: StudentProfile;
  onLogout: () => void;
  onProfileUpdate: (profile: StudentProfile) => void;
}

export default function Dashboard({ user, profile, onLogout, onProfileUpdate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [scores, setScores] = useState<QuizScore[]>([]);
  const [tasks, setTasks] = useState<RevisionTask[]>([]);
  const [studyPlanTasks, setStudyPlanTasks] = useState<StudyPlanTask[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const qSessions = query(collection(db, 'studySessions'), where('uid', '==', user.uid));
    const qScores = query(collection(db, 'quizScores'), where('uid', '==', user.uid));
    const qTasks = query(collection(db, 'revisionTasks'), where('uid', '==', user.uid));
    const qPlan = query(collection(db, 'studyPlanTasks'), where('uid', '==', user.uid));

    const unsubSessions = onSnapshot(qSessions, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudySession)));
    });
    const unsubScores = onSnapshot(qScores, (snap) => {
      setScores(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizScore)));
    });
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as RevisionTask)));
    });
    const unsubPlan = onSnapshot(qPlan, (snap) => {
      setStudyPlanTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyPlanTask)));
    });

    return () => {
      unsubSessions();
      unsubScores();
      unsubTasks();
      unsubPlan();
    };
  }, [user.uid]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeStudentData(profile, sessions, scores);
      setAnalysis(result);
      
      // Sync AI tasks to Firestore if they don't exist
      for (const task of result.revisionPlan) {
        const exists = tasks.find(t => t.topic === task.topic && t.dueDate === task.dueDate);
        if (!exists) {
          await addDoc(collection(db, 'revisionTasks'), {
            ...task,
            uid: user.uid
          });
        }
      }

      // Sync Memory-based tasks
      for (const item of result.memoryAnalysis) {
        if (item.status === 'Forgotten' || item.status === 'Fading') {
          const exists = tasks.find(t => t.topic === item.topic && t.dueDate === item.nextOptimalReview);
          if (!exists) {
            await addDoc(collection(db, 'revisionTasks'), {
              uid: user.uid,
              subject: item.subject,
              topic: item.topic,
              dueDate: item.nextOptimalReview,
              priority: item.status === 'Forgotten' ? 'High' : 'Medium',
              status: 'Pending',
              source: 'AI_GENERATED'
            });
          }
        }
      }

      // Sync Study Plan Tasks
      for (const task of result.studyPlan) {
        const exists = studyPlanTasks.find(t => t.day === task.day && t.timeSlot === task.timeSlot);
        if (!exists) {
          await addDoc(collection(db, 'studyPlanTasks'), {
            ...task,
            uid: user.uid
          });
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'study', label: 'Study Log', icon: BookOpen },
    { id: 'quiz', label: 'Quiz Log', icon: Trophy },
    { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
    { id: 'revision', label: 'Revision Plan', icon: ClipboardList },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
    { id: 'quiz-gen', label: 'AI Quiz', icon: Sparkles },
    { id: 'tutor', label: 'AI Tutor', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="flex h-screen bg-bg text-white font-sans overflow-hidden relative">
      {/* Sidebar */}
      <aside className="w-72 glass-panel border-r border-border flex flex-col z-20 scanline">
        <div className="p-8 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-neon-blue rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <BrainCircuit className="w-6 h-6 text-bg" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter uppercase glow-text-blue">Aura</h1>
              <p className="tech-label">Digital Twin v2.0</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 transition-all group relative ${
                activeTab === item.id 
                  ? 'text-neon-blue' 
                  : 'text-text-dim hover:text-white'
              }`}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neon-blue shadow-[0_0_10px_rgba(0,240,255,1)]" />
              )}
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'glow-text-blue' : ''}`} />
              <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-border bg-black/20">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-4 mb-6 p-2 rounded-sm transition-all hover:bg-surface-light group ${activeTab === 'profile' ? 'bg-neon-blue/10 border border-neon-blue/30' : ''}`}
          >
            <div className="w-10 h-10 rounded-full border border-neon-blue/30 p-1 group-hover:border-neon-blue transition-colors">
              <div className="w-full h-full rounded-full bg-surface-light flex items-center justify-center">
                <span className="font-bold text-neon-blue">{profile.name[0]}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold truncate uppercase tracking-tight group-hover:text-neon-blue transition-colors">{profile.name}</p>
              <p className="text-[10px] font-mono text-text-dim uppercase">Neural Link Active</p>
            </div>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neon-red/30 text-neon-red text-xs font-bold uppercase tracking-widest hover:bg-neon-red/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            DISCONNECT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 glass-panel border-b border-border flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse shadow-[0_0_8px_rgba(0,240,255,1)]" />
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-neon-blue">
              {menuItems.find(m => m.id === activeTab)?.label} // Neural Link Active
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={runAnalysis}
              disabled={analyzing}
              className="flex items-center gap-3 btn-neon-outline px-4 py-2 text-[10px] tracking-widest disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'SYNCING...' : 'RE-SYNC TWIN'}
            </button>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-dim" />
              <span className="text-xs font-mono text-text-dim uppercase">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {activeTab === 'overview' && <Overview profile={profile} sessions={sessions} scores={scores} analysis={analysis} />}
            {activeTab === 'study' && <StudyTracker user={user} sessions={sessions} profile={profile} />}
            {activeTab === 'quiz' && <QuizTracker user={user} scores={scores} profile={profile} />}
            {activeTab === 'insights' && <AIInsights analysis={analysis} />}
            {activeTab === 'revision' && <RevisionPlanner tasks={tasks} />}
            {activeTab === 'planner' && <StudyPlanner analysis={analysis} studyPlanTasks={studyPlanTasks} />}
            {activeTab === 'quiz-gen' && <AIQuiz user={user} sessions={sessions} scores={scores} profile={profile} />}
            {activeTab === 'tutor' && <AITutor profile={profile} />}
            {activeTab === 'profile' && <Profile profile={profile} onUpdate={onProfileUpdate} />}
          </div>
        </div>
      </main>
    </div>
  );
}
