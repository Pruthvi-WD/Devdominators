import React, { useState, useRef } from 'react';
import { StudentProfile } from '../types';
import { getTutorExplanation, transcribeAudio } from '../lib/ai';
import { MessageSquare, Send, Bot, User as UserIcon, Loader2, Mic, Square, AlertCircle, Globe } from 'lucide-react';

interface AITutorProps {
  profile: StudentProfile;
}

export default function AITutor({ profile }: AITutorProps) {
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setLoading(true);
          try {
            const transcript = await transcribeAudio(base64Audio, 'audio/webm');
            if (transcript.trim()) {
              setTopic(transcript);
            } else {
              setMicError("Could not understand the audio. Please speak clearly.");
            }
          } catch (err) {
            console.error("Transcription failed:", err);
            setMicError("Failed to transcribe audio. Please try typing.");
          } finally {
            setLoading(false);
          }
        };
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      if (err.name === 'NotAllowedError') {
        setMicError("Microphone access denied. Please check your browser permissions.");
      } else {
        setMicError("Could not access microphone. Please ensure it's connected.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    const userMsg = topic;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTopic('');
    setLoading(true);

    try {
      const explanation = await getTutorExplanation(userMsg, profile.learningStyle || 'Visual');
      setMessages(prev => [...prev, { role: 'bot', text: explanation }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "I'm sorry, I couldn't process that request right now. Try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-240px)] flex flex-col glass-panel neon-border neon-border-blue animate-fade-in">
      <div className="p-6 border-b border-border flex justify-between items-center bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neon-blue/10 flex items-center justify-center border border-neon-blue/30">
            <Bot className="w-6 h-6 text-neon-blue glow-text-blue" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase glow-text-blue">AURA Neural Tutor</h3>
            <p className="tech-label">Optimized for {profile.learningStyle} learning</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface border border-border rounded-full">
            <Globe className="w-3 h-3 text-neon-blue" />
            <span className="text-[8px] font-mono text-text-dim uppercase tracking-widest">Multi-Lingual Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
            <span className="font-mono text-[10px] text-neon-blue uppercase tracking-widest">Link Stable</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-black/20">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-neon-blue/30 flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-neon-blue" />
            </div>
            <p className="font-sans font-medium text-xl max-w-xs tracking-tight">
              "Initiate query in any language. I will synthesize explanations tailored to your neural profile."
            </p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
            <div className={`w-10 h-10 flex items-center justify-center rounded-sm border ${
              msg.role === 'bot' 
                ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' 
                : 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple'
            }`}>
              {msg.role === 'bot' ? <Bot className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
            </div>
            <div className={`max-w-[80%] p-5 border ${
              msg.role === 'bot' 
                ? 'bg-surface border-border rounded-tr-2xl rounded-br-2xl rounded-bl-2xl' 
                : 'bg-surface-light border-neon-purple/20 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl shadow-[0_0_15px_rgba(188,0,255,0.05)]'
            }`}>
              <p className="text-sm leading-relaxed font-sans whitespace-pre-wrap text-white/90">{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 flex items-center justify-center rounded-sm border border-neon-blue/30 bg-neon-blue/10 text-neon-blue">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-5 border border-border bg-surface rounded-tr-2xl rounded-br-2xl rounded-bl-2xl flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-neon-blue" />
              <span className="tech-label">Synthesizing Response...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-6 border-t border-border bg-black/40">
        {micError && (
          <div className="mb-4 p-3 bg-neon-red/10 border border-neon-red/20 text-[10px] font-mono text-neon-red uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            {micError}
          </div>
        )}
        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <input 
              type="text" 
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={isRecording ? "Neural Capture Active..." : "Query the Aura Tutor..."}
              className={`w-full bg-surface border border-border px-6 py-4 pr-14 text-sm focus:outline-none focus:border-neon-blue/50 transition-all font-sans ${
                isRecording ? 'border-neon-red/50 ring-1 ring-neon-red/50 text-neon-red' : 'text-white'
              }`}
              disabled={isRecording}
            />
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 transition-all rounded-full ${
                isRecording 
                  ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,0,85,0.5)]' 
                  : 'text-text-dim hover:text-neon-blue hover:bg-white/5'
              }`}
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          <button 
            type="submit"
            disabled={loading || isRecording || !topic.trim()}
            className="btn-neon-blue h-[54px] w-[54px] flex items-center justify-center p-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
