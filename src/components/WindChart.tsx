import { WeatherData } from "@/lib/weather";

interface Props {
  weather: WeatherData;
}

const WindChart = ({ weather }: Props) => {
  const hrly = weather.hourly;
  if (!hrly?.time?.length || !hrly?.windspeed_10m?.length) return null;

  const data = hrly.time.slice(0, 24).map((t, i) => ({
    time: new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    speed: hrly.windspeed_10m[i],
  }));

  const maxSpeed = Math.max(...data.map((d) => d.speed), 1);

  return (
    <section id="wind" className="relative z-10 my-8">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="section-heading">
          Wind <span className="text-primary">Analyzer</span>
        </h2>
      </div>
      <div className="glass-card p-4 overflow-x-auto scrollbar-thin">
        <div className="flex items-end gap-1 h-40 min-w-[600px]">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[0.55rem] text-muted-foreground font-mono">{d.speed}</span>
              <div
                className="w-full rounded-t bg-primary/60 hover:bg-primary transition-all min-w-[8px]"
                style={{ height: `${(d.speed / maxSpeed) * 100}%` }}
                title={`${d.time}: ${d.speed} km/h`}
              />
              <span className="text-[0.5rem] text-muted-foreground font-mono -rotate-45 origin-top-left mt-1 whitespace-nowrap">
                {i % 3 === 0 ? d.time : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WindChart;
