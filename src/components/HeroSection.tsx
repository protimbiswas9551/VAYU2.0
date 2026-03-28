import { WeatherData, wmoInfo } from "@/lib/weather";

interface HeroProps {
  weather: WeatherData;
  cityName: string;
}

const HeroSection = ({ weather, cityName }: HeroProps) => {
  const cur = weather.current_weather;
  const dly = weather.daily;
  const hrly = weather.hourly;
  const temp = Math.round(cur.temperature);
  const { icon, label: condition } = wmoInfo(cur.weathercode);
  const tmax = dly?.temperature_2m_max?.[0] ?? temp;
  const tmin = dly?.temperature_2m_min?.[0] ?? temp;
  const humidity = hrly?.relativehumidity_2m?.[0] ?? 0;
  const rain = dly?.precipitation_probability_max?.[0] ?? 0;
  const sunrise = dly?.sunrise?.[0] ? new Date(dly.sunrise[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
  const sunset = dly?.sunset?.[0] ? new Date(dly.sunset[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  const ghostNums = [-3, -2, -1, 1, 2, 3];

  return (
    <section id="current" className="relative z-10 text-center py-8 md:py-12 animate-slide-up">
      <p className="meta-label mb-1">📍 {cityName}</p>
      <p className="text-sm text-muted-foreground tracking-wide">
        {condition} · {today}
      </p>

      {/* Weather icon */}
      <div className="text-7xl my-4">{icon}</div>

      {/* Scroll-wheel temperature */}
      <div className="flex items-center justify-center overflow-hidden gap-0 my-2">
        {ghostNums.slice(0, 3).map((offset, i) => (
          <span
            key={offset}
            className={`font-display text-foreground/5 leading-none text-center shrink-0 ${
              i === 2 ? "text-6xl w-20 text-foreground/10" : "text-5xl w-16"
            }`}
          >
            {temp + offset}
          </span>
        ))}
        <span className="font-display text-[8rem] md:text-[10rem] text-foreground leading-[0.88] w-60 text-center shrink-0 relative z-10">
          {temp}
          <sup className="font-display text-4xl align-super">°</sup>
        </span>
        {ghostNums.slice(3).map((offset, i) => (
          <span
            key={offset}
            className={`font-display text-foreground/5 leading-none text-center shrink-0 ${
              i === 0 ? "text-6xl w-20 text-foreground/10" : "text-5xl w-16"
            }`}
          >
            {temp + offset}
          </span>
        ))}
      </div>

      {/* Hi / Lo */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <span className="text-sm text-secondary-foreground flex items-center gap-1.5">
          <span className="text-primary text-xs">↑</span> {tmax}°
        </span>
        <div className="w-px h-4 bg-border" />
        <span className="text-sm text-secondary-foreground flex items-center gap-1.5">
          <span className="text-primary text-xs">↓</span> {tmin}°
        </span>
      </div>

      {/* Meta strip */}
      <div className="flex justify-center gap-6 md:gap-10 flex-wrap pt-4 border-t border-border">
        {[
          { label: "Humidity", value: `${humidity}%` },
          { label: "Wind", value: `${cur.windspeed} km/h` },
          { label: "Direction", value: `${cur.winddirection}°` },
          { label: "Rain Chance", value: `${rain}%` },
          { label: "Sunrise", value: sunrise },
          { label: "Sunset", value: sunset },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="meta-label mb-1">{item.label}</div>
            <div className="meta-value">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
