import { WeatherData, wmoInfo } from "@/lib/weather";

interface Props {
  weather: WeatherData;
}

const WeeklyForecast = ({ weather }: Props) => {
  const dly = weather.daily;
  if (!dly?.time?.length) return null;

  const days = dly.time.slice(0, 7).map((t, i) => {
    const date = new Date(t);
    const dayName = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "long" });
    const code = dly.weathercode?.[i] ?? 0;
    const { icon, label } = wmoInfo(code);
    const hi = dly.temperature_2m_max?.[i];
    const lo = dly.temperature_2m_min?.[i];
    const pop = dly.precipitation_probability_max?.[i] ?? 0;
    return { dayName, icon, label, hi, lo, pop, isToday: i === 0 };
  });

  return (
    <section id="weekly" className="relative z-10 my-8">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="section-heading">
          Weather for <span className="text-primary">a Week</span>
        </h2>
        <span className="meta-label">Upcoming</span>
      </div>
      <div className="border-t border-border">
        {days.map((day, i) => (
          <div
            key={i}
            className="flex items-center py-3.5 border-b border-border/50 hover:bg-secondary/30 hover:rounded-lg transition-all px-2 -mx-2"
          >
            <div className={`flex-1 text-sm font-medium ${day.isToday ? "text-primary font-bold" : "text-secondary-foreground"}`}>
              {day.dayName}
            </div>
            <div className="flex-1 text-xs text-muted-foreground text-center">{day.label}</div>
            <div className="text-2xl mx-4">{day.icon}</div>
            <div className="flex gap-2 items-center">
              <span className="text-sm font-bold text-secondary-foreground">{day.hi}°</span>
              <span className="text-sm text-muted-foreground">{day.lo}°</span>
              {day.pop > 10 && (
                <span className="text-[0.62rem] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full">
                  💧 {day.pop}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WeeklyForecast;
