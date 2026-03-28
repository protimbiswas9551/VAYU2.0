import { WeatherData, wmoInfo } from "@/lib/weather";

interface Props {
  weather: WeatherData;
}

const HourlyForecast = ({ weather }: Props) => {
  const hrly = weather.hourly;
  if (!hrly?.time?.length) return null;

  const now = new Date();
  let startIdx = 0;
  for (let i = 0; i < hrly.time.length; i++) {
    const dt = new Date(hrly.time[i]);
    if (dt.getDate() === now.getDate() && dt.getHours() >= now.getHours()) {
      startIdx = i;
      break;
    }
  }

  const items = hrly.time.slice(startIdx, startIdx + 24).map((t, i) => {
    const idx = startIdx + i;
    const hour = new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const temp = hrly.temperature_2m?.[idx];
    const pop = hrly.precipitation_probability?.[idx] ?? 0;
    const code = hrly.weathercode?.[idx] ?? 0;
    const { icon } = wmoInfo(code);
    return { hour, temp, pop, icon, isNow: i === 0 };
  });

  return (
    <section id="hourly" className="relative z-10 my-8">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="section-heading">
          Hourly <span className="text-primary">Forecast</span>
        </h2>
        <span className="meta-label">Next 24h</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin">
        {items.map((item, i) => (
          <div
            key={i}
            className={`shrink-0 w-[72px] rounded-xl border text-center py-3 px-1.5 transition-all hover:-translate-y-1 ${
              item.isNow
                ? "bg-primary/10 border-primary/30"
                : "bg-secondary/30 border-border hover:bg-primary/5 hover:border-primary/15"
            }`}
          >
            <div className={`font-mono text-[0.6rem] mb-2 ${item.isNow ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {item.isNow ? "NOW" : item.hour}
            </div>
            <div className="text-xl leading-none mb-2">{item.icon}</div>
            <div className="text-sm font-bold text-secondary-foreground">{item.temp}°</div>
            {item.pop > 10 && (
              <div className="text-[0.58rem] text-blue-400 font-semibold mt-1">💧 {item.pop}%</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default HourlyForecast;
