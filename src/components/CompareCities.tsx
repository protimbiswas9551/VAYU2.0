import { useState, useCallback } from "react";
import { WeatherData, geocodeCity, fetchWeatherData, wmoInfo } from "@/lib/weather";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Search, X, ArrowLeftRight } from "lucide-react";

interface CityWeather {
  name: string;
  data: WeatherData;
}

const METRICS = [
  { key: "temp", label: "Temperature", unit: "°C", icon: "🌡️" },
  { key: "wind", label: "Wind Speed", unit: " km/h", icon: "💨" },
  { key: "humidity", label: "Humidity", unit: "%", icon: "💧" },
  { key: "rain", label: "Rain Chance", unit: "%", icon: "🌧️" },
  { key: "uv", label: "UV Index", unit: "", icon: "☀️" },
];

function getMetricValue(data: WeatherData, key: string): number {
  switch (key) {
    case "temp":
      return Math.round(data.current_weather?.temperature ?? 0);
    case "wind":
      return Math.round(data.current_weather?.windspeed ?? 0);
    case "humidity":
      return Math.round(data.hourly?.relativehumidity_2m?.[0] ?? 0);
    case "rain":
      return Math.round(data.daily?.precipitation_probability_max?.[0] ?? 0);
    case "uv":
      return Math.round(data.daily?.uv_index_max?.[0] ?? 0);
    default:
      return 0;
  }
}

function getAqiLabel(pm25: number): { label: string; color: string } {
  if (pm25 <= 12) return { label: "Good", color: "#22c55e" };
  if (pm25 <= 35) return { label: "Moderate", color: "#eab308" };
  if (pm25 <= 55) return { label: "Unhealthy (sensitive)", color: "#f97316" };
  if (pm25 <= 150) return { label: "Unhealthy", color: "#ef4444" };
  return { label: "Hazardous", color: "#a855f7" };
}

const CitySearchInput = ({
  placeholder,
  onSearch,
  loading,
  city,
  onClear,
  accentColor,
}: {
  placeholder: string;
  onSearch: (q: string) => void;
  loading: boolean;
  city: CityWeather | null;
  onClear: () => void;
  accentColor: string;
}) => {
  const [q, setQ] = useState("");

  const submit = () => {
    if (q.trim()) onSearch(q.trim());
  };

  return (
    <div className="flex-1 min-w-0">
      {city ? (
        <div
          className="glass-card px-4 py-3 flex items-center justify-between"
          style={{ borderColor: `${accentColor}30` }}
        >
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-0.5">
              City
            </p>
            <p className="font-bold text-secondary-foreground text-sm truncate max-w-[200px]">
              {city.name}
            </p>
          </div>
          <button
            onClick={onClear}
            className="ml-3 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-card/60 backdrop-blur-xl border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
            placeholder={placeholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            disabled={loading}
          />
          <button
            onClick={submit}
            disabled={loading || !q.trim()}
            className="px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary transition-colors disabled:opacity-40"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const CompareCities = () => {
  const [cityA, setCityA] = useState<CityWeather | null>(null);
  const [cityB, setCityB] = useState<CityWeather | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCity = useCallback(
    async (query: string, setter: (c: CityWeather | null) => void, setLoading: (v: boolean) => void) => {
      setLoading(true);
      setError(null);
      const geo = await geocodeCity(query);
      if (!geo) {
        setError(`City "${query}" not found. Try a different name.`);
        setLoading(false);
        return;
      }
      const data = await fetchWeatherData(geo.lat, geo.lon);
      if (!data) {
        setError("Failed to fetch weather data. Please try again.");
        setLoading(false);
        return;
      }
      setter({ name: geo.name, data });
      setLoading(false);
    },
    []
  );

  const weeklyChartData =
    cityA && cityB
      ? cityA.data.daily.time.slice(0, 7).map((t, i) => {
          const label = i === 0
            ? "Today"
            : new Date(t).toLocaleDateString("en-US", { weekday: "short" });
          return {
            day: label,
            [`${cityA.name.split(",")[0]} hi`]: cityA.data.daily.temperature_2m_max?.[i],
            [`${cityB.name.split(",")[0]} hi`]: cityB.data.daily.temperature_2m_max?.[i],
          };
        })
      : [];

  const pm25A = cityA?.data.air_quality?.hourly?.pm2_5?.[0];
  const pm25B = cityB?.data.air_quality?.hourly?.pm2_5?.[0];

  const winner = (key: string): "A" | "B" | "tie" | null => {
    if (!cityA || !cityB) return null;
    const a = getMetricValue(cityA.data, key);
    const b = getMetricValue(cityB.data, key);
    // For these metrics, lower is better: wind, rain, uv, humidity above 70%
    const lowerBetter = ["wind", "rain", "uv"];
    if (a === b) return "tie";
    if (lowerBetter.includes(key)) return a < b ? "A" : "B";
    // For temp, closeness to 22°C is "better" — but let's just show values
    return null;
  };

  return (
    <section id="compare" className="relative z-10 my-8">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="section-heading">
          Compare <span className="text-primary">Cities</span>
        </h2>
        <span className="meta-label">Side by side</span>
      </div>

      {/* Search row */}
      <div className="flex items-center gap-3 mb-6 flex-wrap md:flex-nowrap">
        <CitySearchInput
          placeholder="First city (e.g. London)"
          onSearch={(q) => loadCity(q, setCityA, setLoadingA)}
          loading={loadingA}
          city={cityA}
          onClear={() => setCityA(null)}
          accentColor="hsl(42,78%,48%)"
        />
        <div className="shrink-0 p-2 rounded-full glass-card text-muted-foreground">
          <ArrowLeftRight size={16} />
        </div>
        <CitySearchInput
          placeholder="Second city (e.g. Tokyo)"
          onSearch={(q) => loadCity(q, setCityB, setLoadingB)}
          loading={loadingB}
          city={cityB}
          onClear={() => setCityB(null)}
          accentColor="hsl(200,78%,48%)"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Placeholder when no cities */}
      {!cityA && !cityB && (
        <div className="glass-card p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-5xl">🌍</div>
          <p className="text-secondary-foreground font-medium">Search two cities to compare their weather</p>
          <p className="text-muted-foreground text-sm">Temperature, wind, humidity, AQI and 7-day forecast</p>
        </div>
      )}

      {/* Single city loaded — prompt for second */}
      {(cityA || cityB) && !(cityA && cityB) && (
        <div className="glass-card p-8 flex flex-col items-center justify-center text-center gap-2">
          <div className="text-4xl mb-1">➕</div>
          <p className="text-secondary-foreground font-medium">Now search a second city to compare</p>
        </div>
      )}

      {/* Both cities loaded */}
      {cityA && cityB && (
        <div className="space-y-5">
          {/* Current weather header */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { city: cityA, color: "hsl(42,78%,48%)", label: "City A" },
              { city: cityB, color: "hsl(200,78%,48%)", label: "City B" },
            ].map(({ city, color, label }) => {
              const { icon, label: condLabel } = wmoInfo(city.data.current_weather?.weathercode ?? 0);
              return (
                <div key={label} className="glass-card p-5" style={{ borderColor: `${color}25` }}>
                  <p className="text-[0.6rem] font-semibold tracking-[0.15em] uppercase mb-1"
                     style={{ color }}>
                    {label}
                  </p>
                  <p className="text-sm font-bold text-secondary-foreground truncate">{city.name}</p>
                  <div className="flex items-end gap-3 mt-3">
                    <span className="text-5xl font-bold leading-none" style={{ color }}>
                      {Math.round(city.data.current_weather?.temperature ?? 0)}°
                    </span>
                    <div>
                      <div className="text-2xl leading-none">{icon}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{condLabel}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metric comparison rows */}
          <div className="glass-card p-5">
            <p className="meta-label mb-4">Key Metrics</p>
            <div className="space-y-4">
              {METRICS.map((m) => {
                const a = getMetricValue(cityA.data, m.key);
                const b = getMetricValue(cityB.data, m.key);
                const maxVal = Math.max(a, b, 1);
                const w = winner(m.key);
                return (
                  <div key={m.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        {m.icon} {m.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 items-center">
                      {/* City A bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(a / maxVal) * 100}%`,
                              background: "hsl(42,78%,48%)",
                            }}
                          />
                        </div>
                        <span className={`text-xs font-mono font-bold w-16 text-right ${
                          w === "A" ? "text-primary" : "text-secondary-foreground"
                        }`}>
                          {a}{m.unit}
                          {w === "A" && <span className="ml-1">✓</span>}
                        </span>
                      </div>
                      {/* City B bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(b / maxVal) * 100}%`,
                              background: "hsl(200,78%,48%)",
                            }}
                          />
                        </div>
                        <span className={`text-xs font-mono font-bold w-16 text-right ${
                          w === "B" ? "" : "text-secondary-foreground"
                        }`}
                          style={w === "B" ? { color: "hsl(200,78%,48%)" } : {}}>
                          {b}{m.unit}
                          {w === "B" && <span className="ml-1">✓</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Column labels */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(42,78%,48%)" }} />
                <span className="text-xs text-muted-foreground truncate">{cityA.name.split(",")[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(200,78%,48%)" }} />
                <span className="text-xs text-muted-foreground truncate">{cityB.name.split(",")[0]}</span>
              </div>
            </div>
          </div>

          {/* AQI comparison */}
          {(pm25A != null || pm25B != null) && (
            <div className="glass-card p-5">
              <p className="meta-label mb-4">Air Quality (PM2.5)</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { pm: pm25A, city: cityA.name, color: "hsl(42,78%,48%)" },
                  { pm: pm25B, city: cityB.name, color: "hsl(200,78%,48%)" },
                ].map(({ pm, city, color }) => {
                  if (pm == null) return (
                    <div key={city} className="text-muted-foreground text-sm">N/A</div>
                  );
                  const aqiInfo = getAqiLabel(pm);
                  return (
                    <div key={city}>
                      <p className="text-xs text-muted-foreground truncate mb-1">{city.split(",")[0]}</p>
                      <p className="text-2xl font-bold font-mono" style={{ color }}>
                        {pm.toFixed(1)} <span className="text-xs text-muted-foreground font-sans font-normal">µg/m³</span>
                      </p>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={{ background: `${aqiInfo.color}20`, color: aqiInfo.color }}
                      >
                        {aqiInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7-day temperature comparison chart */}
          <div className="glass-card p-5">
            <p className="meta-label mb-4">7-Day High Temperature</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyChartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "hsl(220,10%,40%)", fontSize: 10, fontFamily: "DM Mono, monospace" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(220,10%,40%)", fontSize: 10, fontFamily: "DM Mono, monospace" }}
                  tickLine={false}
                  axisLine={false}
                  unit="°"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(240,12%,7%)",
                    border: "1px solid hsl(240,8%,12%)",
                    borderRadius: "0.5rem",
                    color: "hsl(40,10%,90%)",
                    fontSize: "0.72rem",
                  }}
                  formatter={(v: number) => [`${v}°C`]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "0.7rem", color: "hsl(220,10%,55%)" }}
                  formatter={(value) => value.split(" hi")[0]}
                />
                <Bar
                  dataKey={`${cityA.name.split(",")[0]} hi`}
                  fill="hsl(42,78%,48%)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                  fillOpacity={0.8}
                />
                <Bar
                  dataKey={`${cityB.name.split(",")[0]} hi`}
                  fill="hsl(200,78%,48%)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                  fillOpacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
};

export default CompareCities;
