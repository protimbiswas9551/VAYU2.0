import { WeatherData } from "@/lib/weather";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  weather: WeatherData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-bold text-primary">{payload[0].value} km/h</p>
    </div>
  );
};

const WindChart = ({ weather }: Props) => {
  const hrly = weather.hourly;
  if (!hrly?.time?.length || !hrly?.windspeed_10m?.length) return null;

  const data = hrly.time.slice(0, 24).map((t, i) => ({
    time: new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    speed: hrly.windspeed_10m[i],
  }));

  const maxSpeed = Math.max(...data.map((d) => d.speed));
  const avgSpeed = Math.round(data.reduce((s, d) => s + d.speed, 0) / data.length);
  const peakHour = data.reduce((best, d) => (d.speed > best.speed ? d : best), data[0]);

  return (
    <section id="wind" className="relative z-10 my-8">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="section-heading">
          Wind <span className="text-primary">Analyzer</span>
        </h2>
        <span className="meta-label">24-hour trend</span>
      </div>

      {/* Stat chips */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {[
          { label: "Peak", value: `${maxSpeed} km/h`, sub: `at ${peakHour.time}` },
          { label: "Average", value: `${avgSpeed} km/h`, sub: "today" },
          {
            label: "Condition",
            value:
              maxSpeed > 60
                ? "Strong"
                : maxSpeed > 30
                ? "Moderate"
                : "Calm",
            sub:
              maxSpeed > 60
                ? "⚠️ Secure loose items"
                : maxSpeed > 30
                ? "🌬️ Breezy"
                : "🍃 Gentle breeze",
          },
        ].map((s) => (
          <div key={s.label} className="glass-card px-4 py-3 min-w-[130px]">
            <p className="meta-label mb-1">{s.label}</p>
            <p className="text-lg font-bold text-secondary-foreground leading-none">{s.value}</p>
            <p className="text-[0.62rem] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(42,78%,48%)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(42,78%,48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(220,10%,40%)", fontSize: 10, fontFamily: "DM Mono, monospace" }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fill: "hsl(220,10%,40%)", fontSize: 10, fontFamily: "DM Mono, monospace" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              unit=" km/h"
              width={58}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(42,78%,48%)", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="speed"
              stroke="hsl(42,78%,48%)"
              strokeWidth={2}
              fill="url(#windGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(42,78%,48%)", stroke: "hsl(240,20%,4%)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default WindChart;
