import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, RotateCcw, Sparkles, AlertCircle, Edit3, Volume2 } from 'lucide-react';

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

  // Suggested voice prompt presets
  const quickPrompts = [
    'Kapan jadwal servis dan ganti oli mesin berikutnya?',
    'Berapa rata-rata efisiensi konsumsi BBM armada saya?',
    'Cek status masa berlaku pajak STNK tahunan dan kaleng.',
    'Berapa estimasi biaya servis tak terduga bulan ini?',
  ];

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
        recognitionRef.current.abort();
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

    // 1. Setup Audio Frequency Visualizer (Sound Vibration)
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
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
        }
      }
    } catch {
      // Fallback: simulated rhythmic vibration
      runSimulatedVibration();
    }

    // 2. Setup Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorNotice('Browser Anda belum mengizinkan Web Speech API secara otomatis. Anda dapat mengetik langsung atau memilih ucapan instan di bawah.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let accumulated = '';
        for (let i = 0; i < event.results.length; i++) {
          accumulated += event.results[i][0].transcript + ' ';
        }
        const clean = accumulated.trim();
        if (clean) {
          setTranscript(clean);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[VMS Voice] Speech recognition event:', event.error);
        if (event.error === 'not-allowed') {
          setErrorNotice('Izin mikrofon belum diberikan. Silakan izinkan akses mikrofon di browser Anda.');
          setIsRecording(false);
        } else if (event.error === 'no-speech') {
          // Normal when silent, don't crash
        } else if (event.error === 'network') {
          setErrorNotice('Layanan suara online browser tidak merespon. Gunakan tombol cepat di bawah atau ketik langsung.');
        }
      };

      recognition.onend = () => {
        // Only restart if user hasn't explicitly stopped
        if (isRecording && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            // Already started or finished
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition init error:', err);
      setErrorNotice('Gagal mengaktifkan pengenalan suara. Anda dapat memilih pertanyaan cepat di bawah.');
    }
  };

  const runSimulatedVibration = () => {
    const simulateWave = () => {
      setAudioLevels((prev) =>
        prev.map(() => Math.floor(Math.random() * 70) + 15)
      );
      animationFrameRef.current = requestAnimationFrame(simulateWave);
    };
    simulateWave();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm animate-fade-in text-zinc-900">
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400 text-zinc-950 shadow-xs">
              <Mic className={`w-4 h-4 stroke-[2.5] ${isRecording ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900">
                Speech to Text AI
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                {isRecording ? '● Mendengarkan suara Anda...' : '○ Perekaman dijeda'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SOUND VIBRATION ANIMATION AREA */}
        <div className="my-4 p-5 bg-zinc-950 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent pointer-events-none"></div>

          {/* Sound Wave Vibration Bars */}
          <div className="flex items-center justify-center gap-1.5 h-20 w-full px-2">
            {audioLevels.map((lvl, idx) => (
              <div
                key={idx}
                className="w-2 rounded-full transition-all duration-75"
                style={{
                  height: `${lvl}%`,
                  backgroundColor: lvl > 45 ? '#facc15' : '#71717a',
                  boxShadow: lvl > 55 ? '0 0 10px #facc15' : 'none',
                }}
              ></div>
            ))}
          </div>

          {/* Indicator pill */}
          <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
            {isRecording ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-mono text-yellow-400 font-bold">Merekam Suara (Vibration Active)</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                <span className="font-mono text-zinc-400">Jeda / Siap Dikirim</span>
              </>
            )}
          </div>
        </div>

        {/* LIVE TEXT PREVIEW BOX (EDITABLE) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              <span>Pratinjau Hasil Suara (Bisa Diedit):</span>
            </span>
            {transcript && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                isRecording
                  ? 'Bicaralah sekarang, teks otomatis terketik di sini (atau pilih pertanyaan di bawah)...'
                  : 'Ketik pesan atau pilih pertanyaan suara cepat di bawah...'
              }
              className="w-full p-3.5 bg-zinc-50 rounded-2xl border-2 border-zinc-300 focus:border-zinc-900 focus:bg-white text-xs text-zinc-900 font-medium leading-relaxed focus:outline-none transition resize-none shadow-2xs"
            />
            <div className="absolute right-2.5 bottom-2.5 text-[10px] text-zinc-400 flex items-center gap-1 pointer-events-none">
              <Edit3 className="w-3 h-3" />
              <span>Dapat diedit</span>
            </div>
          </div>

          {/* Error Notice */}
          {errorNotice && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorNotice}</span>
            </div>
          )}
        </div>

        {/* QUICK VOICE PROMPTS */}
        <div className="mt-3.5 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
            Pertanyaan Suara Instan:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {quickPrompts.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTranscript(promptText)}
                className="p-2 text-left bg-zinc-50 hover:bg-yellow-50 border border-zinc-200 hover:border-yellow-400 rounded-xl text-[11px] text-zinc-700 hover:text-zinc-950 font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 className="w-3 h-3 text-yellow-600 shrink-0" />
                <span className="line-clamp-1">{promptText}</span>
              </button>
            ))}
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-zinc-100">
          {isRecording ? (
            <button
              type="button"
              onClick={handleStopRecording}
              className="py-3 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MicOff className="w-4 h-4 text-red-500" />
              <span>Jeda Bicara</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResumeRecording}
              className="py-3 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-yellow-600" />
              <span>Mulai Bicara</span>
            </button>
          )}

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
