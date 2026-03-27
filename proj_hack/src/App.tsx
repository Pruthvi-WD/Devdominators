import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { StudentProfile } from './types';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import Auth from './components/Auth';
import { Loader2, AlertCircle, RefreshCw, LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [takingLonger, setTakingLonger] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    console.log(`App: ${msg}`);
  };

  useEffect(() => {
    addLog("Initializing auth listener...");
    const timeout = setTimeout(() => {
      addLog("Initialization taking longer than 5s...");
      setTakingLonger(true);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      addLog(`Auth state changed. User: ${user?.uid || 'null'} (Verified: ${user?.emailVerified})`);
      try {
        setUser(user);
        if (user) {
          addLog(`Fetching profile for ${user.uid}`);
          const docRef = doc(db, 'profiles', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            addLog("Profile found");
            setProfile(docSnap.data() as StudentProfile);
          } else {
            addLog("No profile found, redirecting to onboarding");
          }
        } else {
          setProfile(null);
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        const errorCode = error?.code || 'no-code';
        addLog(`Auth state change error: [${errorCode}] ${errorMsg}`);
        
        if (errorCode === 'permission-denied') {
          setInitError(`Access Denied: You don't have permission to access your profile. This might be a temporary sync issue. Please try again in a moment.`);
        } else if (errorMsg.includes('offline')) {
          setInitError(`Connection Error: The app is unable to reach the database. Please check your internet connection.`);
        } else {
          setInitError(`Initialization error: ${errorMsg}`);
        }
      } finally {
        addLog("Initialization complete, setting loading to false");
        setLoading(false);
        clearTimeout(timeout);
      }
    });

    return () => {
      addLog("Cleaning up auth listener");
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (initError) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 scanline">
        <div className="max-w-md w-full glass-panel p-8 neon-border neon-border-red animate-fade-in">
          <div className="flex items-center gap-4 text-neon-red mb-6">
            <AlertCircle className="w-8 h-8" />
            <h1 className="text-xl font-bold uppercase tracking-wider glow-text-red">System Error</h1>
          </div>
          
          <div className="bg-neon-red/10 border border-neon-red/20 p-4 mb-8">
            <p className="text-neon-red text-sm font-mono">{initError}</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-neon-red text-white font-bold py-3 rounded-sm hover:shadow-[0_0_20px_rgba(255,0,85,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              RETRY INITIALIZATION
            </button>
            
            <button 
              onClick={() => logout()}
              className="w-full border border-white/10 text-text-dim font-bold py-3 rounded-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              SIGN OUT & TRY AGAIN
            </button>
          </div>

          {logs.length > 0 && (
            <div className="mt-8">
              <p className="tech-label mb-2">Error Diagnostics</p>
              <div className="p-4 bg-black/50 border border-white/5 font-mono text-[10px] text-neon-red/50 h-32 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="mb-1">
                    <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 relative overflow-hidden scanline">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.1),transparent_70%)]" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 border-2 border-neon-blue/20 rounded-full flex items-center justify-center animate-pulse mb-8">
            <Loader2 className="w-12 h-12 text-neon-blue animate-spin" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase glow-text-blue mb-2">Initializing Aura</h1>
          <p className="tech-label animate-pulse">Establishing Neural Link...</p>
          
          {takingLonger && (
            <div className="mt-12 max-w-md w-full glass-panel p-6 neon-border neon-border-blue animate-fade-in">
              <div className="flex items-center gap-3 text-neon-blue mb-4">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wider text-sm">System Latency Detected</span>
              </div>
              <p className="text-text-dim text-sm mb-6 leading-relaxed">
                The digital twin synchronization is taking longer than expected. This could be due to network congestion or a cold start.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="btn-neon-blue w-full flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  REBOOT SYSTEM
                </button>
                
                {logs.length > 0 && (
                  <div className="mt-4 p-4 bg-black/50 border border-white/5 font-mono text-[10px] text-neon-blue/70 h-32 overflow-y-auto">
                    {logs.map((log, i) => (
                      <div key={i} className="mb-1">
                        <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={signInWithGoogle} />;
  }

  if (!profile) {
    return <Onboarding user={user} onComplete={setProfile} />;
  }

  return <Dashboard user={user} profile={profile} onLogout={logout} onProfileUpdate={setProfile} />;
}
