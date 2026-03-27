import { useState } from 'react';
import { LogIn, AlertCircle, Loader2, BrainCircuit, Sparkles } from 'lucide-react';

interface AuthProps {
  onLogin: () => Promise<any>;
}

export default function Auth({ onLogin }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    console.log("Auth: Starting login process...");
    setLoading(true);
    setError(null);
    
    const timeout = setTimeout(() => {
      console.log("Auth: Login process taking longer than 15s...");
      setError("Login is taking longer than expected. Please check if a popup window is hidden behind your browser or if popups are blocked.");
      setLoading(false);
    }, 15000);

    try {
      console.log("Auth: Calling onLogin...");
      await onLogin();
      console.log("Auth: onLogin successful");
    } catch (err: any) {
      console.error("Auth: Login failed:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("The login popup was blocked. Please allow popups for this site and try again.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Login was cancelled. Please try again.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for login. Please try opening the app in a new tab or contact support.");
      } else {
        setError(`Failed to initialize (${err.code || 'unknown error'}). Please check your connection or try again later.`);
      }
    } finally {
      console.log("Auth: Login process finished");
      setLoading(false);
      clearTimeout(timeout);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden scanline">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-red/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full glass-panel p-10 neon-border neon-border-blue relative z-10 animate-fade-in">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 bg-neon-blue rounded-sm flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            <BrainCircuit className="w-12 h-12 text-bg" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase glow-text-blue mb-2">Aura</h1>
          <p className="tech-label">Neural Synchronization Interface</p>
        </div>

        <div className="space-y-6">
          <p className="text-text-dim text-sm text-center leading-relaxed italic font-serif">
            "The future of education is not one-size-fits-all. It's a digital reflection of your unique learning journey."
          </p>

          {error && (
            <div className="p-4 bg-neon-red/10 border border-neon-red/20 text-neon-red text-xs font-mono uppercase tracking-widest animate-in fade-in slide-in-from-top-2 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full btn-neon-blue py-4 flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                INITIALIZE LINK
              </>
            )}
          </button>

          <div className="pt-6 border-t border-border">
            <div className="flex items-center gap-3 text-text-dim">
              <Sparkles className="w-4 h-4 text-neon-blue" />
              <p className="text-[10px] font-mono uppercase tracking-widest leading-relaxed">
                Tip: If the login window doesn't appear, check if your browser is blocking popups. 
                <br />
                Safari users: If login fails, try opening the app in a new tab.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-30">
        <div className="flex flex-col items-center">
          <p className="tech-label">Encryption</p>
          <p className="text-[10px] font-mono">AES-256-GCM</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex flex-col items-center">
          <p className="tech-label">Protocol</p>
          <p className="text-[10px] font-mono">NEURAL-SYNC v2.4</p>
        </div>
      </div>
    </div>
  );
}
