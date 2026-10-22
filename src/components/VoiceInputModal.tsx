import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, RotateCcw, Sparkles } from 'lucide-react';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTranscript: (text: string) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onSendTranscript,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 25, 45, 60, 30, 70, 85, 50, 40, 65, 30, 20]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition & Audio Analyser when modal opens
  useEffect(() => {
    if (!isOpen) {
      cleanupAudio();
      setTranscript('');
      setIsRecording(false);
      setErrorNotice(null);
      return;
    }

    startListening();

    return () => {
      cleanupAudio();
    };
  }, [isOpen]);

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const startListening = async () => {
    setIsRecording(true);
    setErrorNotice(null);

    // 1. Setup Microphone & Audio Frequency Visualizer (Sound Vibration)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVibration = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sample 16 discrete bar heights (normalized 10% to 100%)
        const bars: number[] = [];
        const step = Math.floor(bufferLength / 16) || 1;
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          const heightPct = Math.max(12, Math.min(100, Math.round((val / 255) * 100)));
          bars.push(heightPct);
        }
        setAudioLevels(bars);

        animationFrameRef.current = requestAnimationFrame(updateVibration);
      };

      updateVibration();
    } catch (err) {
      console.warn('Microphone stream error, falling back to simulated vibration:', err);
      // Fallback: animated vibration wave simulation
      const simulateWave = () => {
        setAudioLevels((prev) =>
          prev.map(() => Math.floor(Math.random() * 75) + 15)
        );
        animationFrameRef.current = requestAnimationFrame(simulateWave);
      };
      simulateWave();
    }

    // 2. Setup Web Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID'; // Bahasa Indonesia
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript.trim());
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setErrorNotice('Izin mikrofon ditolak oleh browser.');
          }
        };

        recognition.onend = () => {
          // If still recording mode, restart
          if (isRecording && recognitionRef.current) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    } else {
      setErrorNotice('Browser Anda tidak mendukung Web Speech API secara native. Anda bisa gunakan preset simulasi di bawah.');
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    // Return sound wave to idle flat line
    setAudioLevels(new Array(16).fill(12));
  };

  const handleResumeRecording = () => {
    startListening();
  };

  const handleReset = () => {
    setTranscript('');
    startListening();
  };

  const handleSend = () => {
    if (!transcript.trim()) return;
    onSendTranscript(transcript.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 rounded-3xl p-5 shadow-2xl text-zinc-900 relative">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400 text-zinc-950 animate-pulse">
              <Mic className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900">
                Speech to Text AI
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                {isRecording ? '● Mendengarkan suara Anda...' : '○ Perekaman selesai'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SOUND VIBRATION ANIMATION AREA */}
        <div className="my-6 p-6 bg-zinc-950 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          {/* Subtle glow background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent pointer-events-none"></div>

          {/* Sound Wave Vibration Bars */}
          <div className="flex items-center justify-center gap-1.5 h-24 w-full px-2">
            {audioLevels.map((lvl, idx) => (
              <div
                key={idx}
                className="w-2 rounded-full transition-all duration-75"
                style={{
                  height: `${lvl}%`,
                  backgroundColor: lvl > 50 ? '#facc15' : '#e4e4e7',
                  boxShadow: lvl > 60 ? '0 0 8px #facc15' : 'none',
                }}
              ></div>
            ))}
          </div>

          {/* Micro Indicator pill */}
          <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
            {isRecording ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-mono text-yellow-400 font-bold">Merekam Suara (Vibration Active)</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                <span className="font-mono text-zinc-400">Jeda / Selesai Bicara</span>
              </>
            )}
          </div>
        </div>

        {/* LIVE TEXT PREVIEW BOX */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              <span>Pratinjau Teks (Live Preview):</span>
            </span>
            {transcript && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Ulangi</span>
              </button>
            )}
          </div>

          <div className="min-h-[72px] max-h-28 overflow-y-auto p-3.5 bg-zinc-50 rounded-2xl border-2 border-zinc-200 text-xs text-zinc-900 leading-relaxed no-scrollbar">
            {transcript ? (
              <p className="font-medium text-zinc-900">"{transcript}"</p>
            ) : (
              <p className="text-zinc-400 italic">
                {isRecording
                  ? 'Silakan berbicara ke mikrofon (misal: "Kapan Vario saya harus ganti oli dan cek busi?")...'
                  : 'Belum ada suara terdeteksi.'}
              </p>
            )}
          </div>

          {/* Fallback Simulation Prompts if browser has speech permission restrictions */}
          {errorNotice && (
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              {errorNotice}
              <div className="mt-1 flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setTranscript('Kapan oli mesin dan V-Belt Honda Vario 125 2015 saya wajib diganti?')}
                  className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 rounded text-[10px] font-bold"
                >
                  + Uji Suara Servis Vario
                </button>
                <button
                  type="button"
                  onClick={() => setTranscript('Tolong hitung konsumsi BBM Gran Max bulan ini dari pengisian terakhir.')}
                  className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 rounded text-[10px] font-bold"
                >
                  + Uji Suara BBM Gran Max
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-zinc-100">
          {/* Pause / Resume Recording Button */}
          {isRecording ? (
            <button
              type="button"
              onClick={handleStopRecording}
              className="py-3 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MicOff className="w-4 h-4 text-red-500" />
              <span>Selesai Bicara</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResumeRecording}
              className="py-3 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-yellow-600" />
              <span>Lanjut Rekam</span>
            </button>
          )}

          {/* Send to AI Directly Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!transcript.trim()}
            className="py-3 px-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-yellow-400/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4 stroke-[2.8]" />
            <span>Kirim ke AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
