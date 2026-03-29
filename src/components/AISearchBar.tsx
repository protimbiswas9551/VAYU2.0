// FILE: src/components/AISearchBar.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Plus, AudioWaveform, X, ChevronDown } from "lucide-react";
import { WeatherData } from "@/lib/weather";

interface Props {
  weather?: WeatherData | null;
  cityName?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL    = "llama-3.1-8b-instant";
const LS_KEY   = "vayu_groq_api_key";
const LS_HIST  = "vayu_search_history";

const SUGGESTIONS = [
  "What should I wear today?",
  "Is it safe to go for a run?",
  "Best time to travel this week?",
  "Explain the UV index",
  "Plan my weekend activities",
  "Tell me something interesting",
];

const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const voiceOk = !!SR;

async function callGroq(key: string, history: Message[], system: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      temperature: 0.72,
      messages: [{ role: "system", content: system }, ...history.slice(-16)],
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message ?? `HTTP ${res.status}`);
  }
  const d = await res.json();
  return d.choices?.[0]?.message?.content?.trim() ?? "No response.";
}

const AISearchBar = ({ weather, cityName }: Props) => {
  const [apiKey, setApiKey]           = useState(() => localStorage.getItem(LS_KEY) ?? "");
  const [keyDraft, setKeyDraft]       = useState("");
  const [showKeyPrompt, setShowKeyPrompt] = useState(() => !localStorage.getItem(LS_KEY));
  const [history, setHistory]         = useState<Message[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_HIST) ?? "[]"); } catch { return []; }
  });
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [listening, setListening]     = useState(false);
  const [showResult, setShowResult]   = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef  = useRef<HTMLInputElement>(null);
  const srRef     = useRef<any>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(LS_HIST, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (showResult) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
    }
  }, [showResult, history]);

  const buildSystem = useCallback((): string => {
    let ctx = "";
    if (weather && cityName) {
      const c  = weather.current_weather;
      const d  = weather.daily;
      const aq = weather.air_quality?.hourly;
      ctx = ` Live weather for ${cityName}: temp=${Math.round(c.temperature)}°C, wind=${c.windspeed}km/h, max=${d?.temperature_2m_max?.[0]}°C, min=${d?.temperature_2m_min?.[0]}°C, rain=${d?.precipitation_probability_max?.[0]}%, UV=${d?.uv_index_max?.[0]}, PM2.5=${aq?.pm2_5?.[0]?.toFixed(1)} µg/m³.`;
    }
    return `You are VAYU AI 2.0, a knowledgeable and concise assistant embedded in VAYU 2.0, a cinematic weather dashboard. Answer ANY question — not limited to weather. When weather data is available, use it for context-aware answers. Keep answers concise (2–5 sentences), use plain text, be direct and smart.${ctx}`;
  }, [weather, cityName]);

  const saveKey = () => {
    const k = keyDraft.trim();
    if (!k.startsWith("gsk_") || k.length < 10) {
      setError("Key should start with gsk_ — get one free at console.groq.com");
      return;
    }
    localStorage.setItem(LS_KEY, k);
    setApiKey(k);
    setKeyDraft("");
    setShowKeyPrompt(false);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const send = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    if (!apiKey) { setShowKeyPrompt(true); return; }

    setError(null);
    setLoading(true);
    setShowResult(true);
    setShowSuggestions(false);

    const userMsg: Message = { role: "user", content: q };
    const next = [...history, userMsg];
    setHistory(next);
    setInput("");

    try {
      const reply = await callGroq(apiKey, next, buildSystem());
      setHistory(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [apiKey, history, loading, buildSystem]);

  const toggleVoice = useCallback(() => {
    if (!voiceOk) return;
    if (listening) { srRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult  = (e: any) => { setListening(false); send(e.results[0][0].transcript); };
    rec.onerror   = () => setListening(false);
    rec.onend     = () => setListening(false);
    srRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, send]);

  const clearAll = () => {
    setHistory([]);
    setShowResult(false);
    setError(null);
    localStorage.removeItem(LS_HIST);
  };

  const lastAI   = [...history].reverse().find(m => m.role === "assistant");
  const lastUser = [...history].reverse().find(m => m.role === "user");

  return (
    <section className="relative z-10 my-8">

      {/* ── One-time API key setup ── */}
      {showKeyPrompt && (
        <div className="mb-6 px-5 py-4 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-xl">
          <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            <span className="text-primary">✦</span> Set up VAYU AI 2.0
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Get a <strong className="text-foreground font-medium">free</strong> Groq API key at{" "}
            <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
              console.groq.com
            </a>{" "}
            → Sign in → API Keys → Create Key. Saved permanently — never asked again.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveKey()}
              placeholder="gsk_..."
              autoFocus
              className="flex-1 bg-secondary/60 border border-border rounded-xl px-4 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-all"
            />
            <button
              onClick={saveKey}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      )}

      {/* ── Hero heading — "VAYU AI 2.0" like ChatGPT's "What can I help with?" ── */}
      {!showResult && (
        <div className="text-center mb-6">
          <h2
            className="font-display tracking-wider text-foreground"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            VAYU <span className="text-primary">AI</span> 2.0
          </h2>
        </div>
      )}

      {/* ── Result panel (appears above bar after first response) ── */}
      {showResult && (
        <div ref={resultRef} className="mb-3 px-5 py-4 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl">
          {/* Last question */}
          {lastUser && (
            <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              {lastUser.content}
            </p>
          )}

          {/* Answer */}
          {loading ? (
            <div className="flex items-center gap-2 py-1">
              <span className="text-sm text-muted-foreground">Thinking</span>
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/70 inline-block"
                  style={{ animation: `vayuDot 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          ) : lastAI ? (
            <p className="text-[15px] leading-relaxed text-secondary-foreground font-light">
              {lastAI.content}
            </p>
          ) : null}

          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}

          {/* Footer row */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
            <span className="text-[10px] font-mono text-muted-foreground/40 tracking-wide">
              VAYU AI 2.0 · Llama 3.1 · Groq
            </span>
            <div className="flex items-center gap-3">
              {history.length > 2 && (
                <span className="text-[11px] text-muted-foreground">
                  {Math.floor(history.length / 2)} exchange{history.length > 2 ? "s" : ""}
                </span>
              )}
              <button
                onClick={clearAll}
                className="text-[11px] text-muted-foreground/50 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Clear
              </button>
              <button
                onClick={() => setShowResult(false)}
                className="text-[11px] text-muted-foreground/50 hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ChevronDown className="w-3 h-3" /> Hide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ChatGPT-style pill bar ── */}
      <div
        className="flex items-center gap-0 rounded-full border border-border/60 bg-secondary/50 backdrop-blur-xl px-2 py-2 transition-all duration-200 hover:border-border focus-within:border-primary/40 focus-within:bg-secondary/70"
        style={{ boxShadow: "0 2px 24px rgba(0,0,0,0.25)" }}
      >

        {/* + button (left) */}
        <button
          onClick={() => setShowSuggestions(s => !s)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/40 transition-all shrink-0"
          title="Suggestions"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") send(input);
          }}
          placeholder={listening ? "Listening…" : showResult ? "Ask a follow-up…" : "Ask anything"}
          disabled={loading || listening}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none px-2 leading-none disabled:opacity-60 min-w-0"
          style={{ height: "36px" }}
        />

        {/* Mic button */}
        {voiceOk && (
          <button
            onClick={toggleVoice}
            disabled={loading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
              listening
                ? "text-red-400 animate-pulse"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
            title={listening ? "Stop" : "Voice input"}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        {/* Send button — dark circle with waveform icon, matches ChatGPT's right button */}
        <button
          onClick={() => input.trim() ? send(input) : toggleVoice()}
          disabled={loading}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ml-1 disabled:opacity-40"
          style={{
            background: input.trim()
              ? "hsl(var(--primary))"
              : "hsl(var(--foreground))",
          }}
          title="Send"
        >
          {input.trim() ? (
            /* Up-arrow when text is typed */
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 13V3M3 8l5-5 5 5" stroke="hsl(var(--primary-foreground))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            /* Waveform icon when idle */
            <AudioWaveform className="w-4 h-4" style={{ color: "hsl(var(--background))" }} />
          )}
        </button>
      </div>

      {/* ── Suggestion chips — shown when + is clicked ── */}
      {showSuggestions && (
        <div className="mt-3 flex gap-2 flex-wrap animate-slide-up">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setShowSuggestions(false); send(s); }}
              className="text-[12px] text-muted-foreground border border-border/60 rounded-full px-3.5 py-1.5 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all whitespace-nowrap bg-secondary/30"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Change key link ── */}
      {apiKey && !showKeyPrompt && (
        <p className="text-center mt-3">
          <button
            onClick={() => { setShowKeyPrompt(true); setKeyDraft(""); }}
            className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors"
          >
            change API key
          </button>
        </p>
      )}

      <style>{`
        @keyframes vayuDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default AISearchBar;
