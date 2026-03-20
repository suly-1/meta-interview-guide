/**
 * SoundtrackPlayer — Ambient study sounds via Web Audio API (no external files).
 * Three modes: Lo-Fi (layered tones + gentle noise), White Noise, Rain.
 * Persists last-used mode to localStorage. Renders as a compact toolbar button.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Music2, Wind, CloudRain, VolumeX } from "lucide-react";

const STORAGE_KEY = "meta-guide-soundtrack-mode";
type SoundMode = "off" | "lofi" | "whitenoise" | "rain";

interface AudioNodes {
  ctx: AudioContext;
  masterGain: GainNode;
  sources: AudioNode[];
  stop: () => void;
}

// ─── Lo-Fi Generator ─────────────────────────────────────────────────────────
// Layered: soft noise floor + two detuned sine tones that slowly drift
function createLoFi(ctx: AudioContext, master: GainNode): AudioNode[] {
  const nodes: AudioNode[] = [];

  // Soft noise floor
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

  // Two detuned sine tones (A2 + slightly detuned)
  const freqs = [110, 110.5];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = 0.06;
    // Slow LFO tremolo
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

  // Sub-bass pulse (very soft)
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
// Filtered noise shaped to sound like rain: high-freq hiss + low rumble
function createRain(ctx: AudioContext, master: GainNode): AudioNode[] {
  const nodes: AudioNode[] = [];

  // High-frequency rain hiss
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

  // Low rumble
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

  // Occasional drip-like amplitude modulation
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

// ─── Main hook ────────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
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

  // Persist mode
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }, [mode]);

  // Start/stop audio when mode changes
  useEffect(() => {
    if (mode === "off") {
      stop();
    } else {
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

  return (
    <div className="relative flex-shrink-0" ref={popoverRef}>
      {/* Trigger button */}
      <button
        onClick={() => setShowVolume(v => !v)}
        title={isPlaying ? `Playing: ${activeMode?.title} — click to adjust` : "Study Soundtrack"}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
          isPlaying
            ? "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
            : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400"
        }`}
      >
        {isPlaying ? activeMode?.icon : <VolumeX size={13} />}
        <span className="hidden sm:inline">{isPlaying ? activeMode?.label : "Sound"}</span>
        {isPlaying && (
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
        )}
      </button>

      {/* Popover */}
      {showVolume && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Study Soundtrack</p>

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
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400"
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
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <VolumeX size={12} /> Stop
            </button>
          )}

          {/* Volume slider */}
          {isPlaying && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-semibold">Volume</span>
                <span className="text-[10px] text-gray-400">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>
          )}

          <p className="text-[9px] text-gray-400 leading-relaxed">
            All sounds generated locally via Web Audio API — no downloads or network requests.
          </p>
        </div>
      )}
    </div>
  );
}
