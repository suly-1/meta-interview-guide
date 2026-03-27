/**
 * SoundtrackPlayer — Ambient study sounds via Web Audio API (no external files).
 * Three modes: Lo-Fi (layered tones + gentle noise), White Noise, Rain.
 * Persists last-used mode to localStorage. Renders as a compact toolbar button.
 *
 * Also includes an integrated Pomodoro Timer (25/5 work/break cycles):
 * - Auto-pauses music during break phases
 * - Resumes music when work phase starts
 * - Session counter persisted in localStorage
 * - Browser notification at phase transitions (if permission granted)
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Music2, Wind, CloudRain, VolumeX, Timer, Play, Pause, RotateCcw, Coffee } from "lucide-react";

const STORAGE_KEY = "meta-guide-soundtrack-mode";
const POMODORO_SESSIONS_KEY = "meta-guide-pomodoro-sessions";
const POMODORO_HISTORY_KEY = "meta-guide-pomodoro-history";
type SoundMode = "off" | "lofi" | "whitenoise" | "rain";
type PomodoroPhase = "work" | "break" | "idle";

interface PomodoroSession {
  completedAt: number; // Unix ms
  durationMin: number; // always 25 for a full work session
}

function loadHistory(): PomodoroSession[] {
  try { return JSON.parse(localStorage.getItem(POMODORO_HISTORY_KEY) ?? "[]"); } catch { return []; }
}

function saveHistory(h: PomodoroSession[]) {
  try { localStorage.setItem(POMODORO_HISTORY_KEY, JSON.stringify(h.slice(-50))); } catch {}
}

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

interface AudioNodes {
  ctx: AudioContext;
  masterGain: GainNode;
  sources: AudioNode[];
  stop: () => void;
}

// ─── Lo-Fi Generator ─────────────────────────────────────────────────────────
function createLoFi(ctx: AudioContext, master: GainNode): AudioNode[] {
  const nodes: AudioNode[] = [];
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.04;
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 800;
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(master);
  noiseSource.start();
  nodes.push(noiseSource);

  const freqs = [110, 110.5];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = 0.06;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15 + i * 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    nodes.push(osc, lfo);
  });

  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = 55;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.04;
  sub.connect(subGain);
  subGain.connect(master);
  sub.start();
  nodes.push(sub);
  return nodes;
}

// ─── White Noise Generator ────────────────────────────────────────────────────
function createWhiteNoise(ctx: AudioContext, master: GainNode): AudioNode[] {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2000;
  filter.Q.value = 0.5;
  source.connect(filter);
  filter.connect(master);
  source.start();
  return [source];
}

// ─── Rain Generator ───────────────────────────────────────────────────────────
function createRain(ctx: AudioContext, master: GainNode): AudioNode[] {
  const nodes: AudioNode[] = [];
  const bufSize = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(2, bufSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
  }
  const hiss = ctx.createBufferSource();
  hiss.buffer = buf;
  hiss.loop = true;
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 1200;
  const hissGain = ctx.createGain();
  hissGain.gain.value = 0.35;
  hiss.connect(highpass);
  highpass.connect(hissGain);
  hissGain.connect(master);
  hiss.start();
  nodes.push(hiss);

  const rumbleBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const rd = rumbleBuf.getChannelData(0);
  for (let i = 0; i < rumbleBuf.length; i++) rd[i] = (Math.random() * 2 - 1) * 0.15;
  const rumble = ctx.createBufferSource();
  rumble.buffer = rumbleBuf;
  rumble.loop = true;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 200;
  rumble.connect(lowpass);
  lowpass.connect(master);
  rumble.start();
  nodes.push(rumble);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 3.5;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.08;
  lfo.connect(lfoGain);
  lfoGain.connect(hissGain.gain);
  lfo.start();
  nodes.push(lfo);
  return nodes;
}

// ─── Audio Engine Hook ────────────────────────────────────────────────────────
function useAudioEngine() {
  const audioRef = useRef<AudioNodes | null>(null);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    try {
      audioRef.current.stop();
      audioRef.current.ctx.close();
    } catch {}
    audioRef.current = null;
  }, []);

  const play = useCallback((mode: Exclude<SoundMode, "off">, volume: number) => {
    stop();
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);

    let sources: AudioNode[] = [];
    if (mode === "lofi")       sources = createLoFi(ctx, masterGain);
    if (mode === "whitenoise") sources = createWhiteNoise(ctx, masterGain);
    if (mode === "rain")       sources = createRain(ctx, masterGain);

    audioRef.current = {
      ctx, masterGain, sources,
      stop: () => {
        sources.forEach(s => {
          try { (s as AudioBufferSourceNode | OscillatorNode).stop(); } catch {}
        });
      },
    };
  }, [stop]);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.masterGain.gain.value = v;
  }, []);

  useEffect(() => () => stop(), [stop]);
  return { play, stop, setVolume };
}

// ─── Pomodoro Hook ────────────────────────────────────────────────────────────
function usePomodoro(onPhaseChange: (phase: PomodoroPhase) => void) {
  const [phase, setPhase] = useState<PomodoroPhase>("idle");
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(POMODORO_SESSIONS_KEY) || "0"); } catch { return 0; }
  });
  const [history, setHistory] = useState<PomodoroSession[]>(() => loadHistory());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<PomodoroPhase>("idle");

  const notify = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico", tag: "pomodoro" });
    }
  };

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startWork = useCallback(() => {
    clearTimer();
    phaseRef.current = "work";
    setPhase("work");
    setTimeLeft(WORK_DURATION);
    setRunning(true);
    onPhaseChange("work");
  }, [onPhaseChange]);

  const startBreak = useCallback(() => {
    clearTimer();
    phaseRef.current = "break";
    setPhase("break");
    setTimeLeft(BREAK_DURATION);
    setRunning(true);
    onPhaseChange("break");
    notify("Break time! ☕", "5-minute break. Step away from the screen.");
  }, [onPhaseChange]);

  const reset = useCallback(() => {
    clearTimer();
    phaseRef.current = "idle";
    setPhase("idle");
    setTimeLeft(WORK_DURATION);
    setRunning(false);
    onPhaseChange("idle");
  }, [onPhaseChange]);

  const togglePause = useCallback(() => {
    setRunning(prev => !prev);
  }, []);

  // Tick
  useEffect(() => {
    if (!running) {
      clearTimer();
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          if (phaseRef.current === "work") {
            // Work session complete
            setSessions(s => {
              const next = s + 1;
              try { localStorage.setItem(POMODORO_SESSIONS_KEY, String(next)); } catch {}
              return next;
            });
            setHistory(prev => {
              const entry: PomodoroSession = { completedAt: Date.now(), durationMin: 25 };
              const updated = [...prev, entry];
              saveHistory(updated);
              return updated;
            });
            notify("Work session complete! 🎉", "Time for a 5-minute break.");
            // Auto-start break
            setTimeout(() => startBreak(), 500);
          } else if (phaseRef.current === "break") {
            notify("Break over! 💪", "Ready for another 25-minute focus session?");
            setTimeout(() => {
              phaseRef.current = "idle";
              setPhase("idle");
              setRunning(false);
              onPhaseChange("idle");
            }, 500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [running, startBreak, onPhaseChange]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return { phase, timeLeft, running, sessions, history, startWork, startBreak, reset, togglePause, formatTime };
}

// ─── Main Component ───────────────────────────────────────────────────────────
const MODES: { id: SoundMode; label: string; icon: React.ReactNode; title: string }[] = [
  { id: "lofi",       label: "Lo-Fi",  icon: <Music2 size={13} />,    title: "Lo-Fi ambient tones" },
  { id: "whitenoise", label: "Noise",  icon: <Wind size={13} />,      title: "White noise" },
  { id: "rain",       label: "Rain",   icon: <CloudRain size={13} />, title: "Rain sounds" },
];

export default function SoundtrackPlayer() {
  const [mode, setMode] = useState<SoundMode>(() => {
    try { return (localStorage.getItem(STORAGE_KEY) as SoundMode) ?? "off"; } catch { return "off"; }
  });
  const [volume, setVolumeState] = useState(0.5);
  const [showVolume, setShowVolume] = useState(false);
  const { play, stop, setVolume } = useAudioEngine();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Pomodoro: auto-pause/resume music based on phase
  const handlePhaseChange = useCallback((phase: PomodoroPhase) => {
    if (phase === "break") {
      // Pause music during break
      stop();
    } else if (phase === "work") {
      // Resume music when work starts (if a mode was selected)
      setMode(prev => {
        if (prev !== "off") play(prev, volume);
        return prev;
      });
    }
  }, [stop, play, volume]);

  const pomodoro = usePomodoro(handlePhaseChange);

  // Persist mode
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }, [mode]);

  // Start/stop audio when mode changes
  useEffect(() => {
    if (mode === "off") {
      stop();
    } else if (pomodoro.phase !== "break") {
      // Don't start audio during break phase
      play(mode, volume);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Close volume popover on outside click
  useEffect(() => {
    if (!showVolume) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowVolume(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVolume]);

  const handleModeClick = (m: SoundMode) => {
    setMode(prev => prev === m ? "off" : m);
  };

  const handleVolumeChange = (v: number) => {
    setVolumeState(v);
    setVolume(v);
  };

  const isPlaying = mode !== "off";
  const activeMode = MODES.find(m => m.id === mode);
  const { phase, timeLeft, running, sessions, history, startWork, reset, togglePause, formatTime } = pomodoro;

  // Compact nav button label
  const navLabel = () => {
    if (phase === "work") return formatTime(timeLeft);
    if (phase === "break") return `Break ${formatTime(timeLeft)}`;
    if (isPlaying) return activeMode?.label;
    return "Sound";
  };

  const navIcon = () => {
    if (phase === "work") return <Timer size={13} className={running ? "text-orange-500" : ""} />;
    if (phase === "break") return <Coffee size={13} className="text-emerald-500" />;
    if (isPlaying) return activeMode?.icon;
    return <VolumeX size={13} />;
  };

  return (
    <div className="relative flex-shrink-0" ref={popoverRef}>
      {/* Trigger button */}
      <button
        onClick={() => setShowVolume(v => !v)}
        title={
          phase === "work" ? `Pomodoro: ${formatTime(timeLeft)} remaining` :
          phase === "break" ? `Break: ${formatTime(timeLeft)} remaining` :
          isPlaying ? `Playing: ${activeMode?.title} — click to adjust` : "Study Soundtrack & Pomodoro"
        }
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
          phase === "work"
            ? "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-800"
            : phase === "break"
            ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
            : isPlaying
            ? "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
            : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400"
        }`}
      >
        {navIcon()}
        <span className="hidden sm:inline">{navLabel()}</span>
        {(phase !== "idle" || isPlaying) && (
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            phase === "work" ? (running ? "bg-orange-500 animate-pulse" : "bg-orange-300") :
            phase === "break" ? "bg-emerald-500 animate-pulse" :
            "bg-violet-500 animate-pulse"
          }`} />
        )}
      </button>

      {/* Popover */}
      {showVolume && (
        <div className="absolute right-0 top-full mt-2 z-50 w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3 space-y-3">

          {/* ── Pomodoro Section ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Pomodoro Timer</p>
              <span className="text-[10px] text-gray-600 font-semibold">{sessions} session{sessions !== 1 ? "s" : ""} today</span>
            </div>

            {/* Timer display */}
            <div className={`rounded-xl p-3 text-center mb-2 ${
              phase === "work" ? "bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" :
              phase === "break" ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800" :
              "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            }`}>
              <p className={`text-2xl font-bold tabular-nums tracking-wider ${
                phase === "work" ? "text-orange-800 dark:text-orange-900" :
                phase === "break" ? "text-emerald-600 dark:text-emerald-400" :
                "text-gray-700 dark:text-gray-300"
              }`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {formatTime(timeLeft)}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {phase === "work" ? (running ? "Focus session in progress" : "Paused") :
                 phase === "break" ? "Break — music paused" :
                 "25 min focus · 5 min break"}
              </p>
            </div>

            {/* Progress bar */}
            {phase !== "idle" && (
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${phase === "work" ? "bg-orange-500" : "bg-emerald-500"}`}
                  style={{
                    width: `${((phase === "work" ? WORK_DURATION : BREAK_DURATION) - timeLeft) /
                      (phase === "work" ? WORK_DURATION : BREAK_DURATION) * 100}%`
                  }}
                />
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-1.5">
              {phase === "idle" ? (
                <button
                  onClick={startWork}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <Play size={12} /> Start Focus
                </button>
              ) : (
                <>
                  <button
                    onClick={togglePause}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-colors ${
                      running
                        ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200"
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    }`}
                  >
                    {running ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                  </button>
                  <button
                    onClick={reset}
                    title="Reset timer"
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                  >
                    <RotateCcw size={12} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Session History ── */}
          {history.length > 0 && (() => {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todaySessions = history.filter(s => s.completedAt >= todayStart.getTime());
            const totalFocusMin = todaySessions.reduce((sum, s) => sum + s.durationMin, 0);
            const last5 = [...history].reverse().slice(0, 5);
            return (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Session History</p>
                  <span className="text-[10px] text-orange-800 font-bold">{totalFocusMin} min focus today</span>
                </div>
                <div className="space-y-1">
                  {last5.map((s, i) => {
                    const d = new Date(s.completedAt);
                    const isToday = d >= todayStart;
                    const label = isToday
                      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <span className={`text-[10px] ${isToday ? "text-orange-800 font-semibold" : "text-gray-600"}`}>{label}</span>
                        <span className="text-[10px] text-gray-600">{s.durationMin} min</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Study Soundtrack</p>

            {/* Mode buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleModeClick(m.id)}
                  title={m.title}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    mode === m.id
                      ? "bg-violet-100 dark:bg-violet-900/30 border-violet-400 dark:border-violet-600 text-violet-700 dark:text-violet-300"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            {/* Off button */}
            {isPlaying && (
              <button
                onClick={() => { setMode("off"); setShowVolume(false); }}
                className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <VolumeX size={12} /> Stop Sound
              </button>
            )}

            {/* Volume slider */}
            {isPlaying && (
              <div className="space-y-1 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600 font-semibold">Volume</span>
                  <span className="text-[10px] text-gray-600">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range" min={0} max={1} step={0.05} value={volume}
                  onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>
            )}

            {phase === "break" && isPlaying && (
              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1.5 text-center font-semibold">
                Music auto-paused during break
              </p>
            )}
          </div>

          <p className="text-[9px] text-gray-600 leading-relaxed">
            Sounds via Web Audio API — no downloads. Notifications require browser permission.
          </p>
        </div>
      )}
    </div>
  );
}
