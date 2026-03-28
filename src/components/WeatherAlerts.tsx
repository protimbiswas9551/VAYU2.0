import { WeatherData } from "@/lib/weather";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  weather: WeatherData;
}

const WeatherAlerts = ({ weather }: Props) => {
  const dly = weather.daily;
  const alerts: { icon: string; title: string; msg: string; color: string }[] = [];

  if (dly) {
    const tmax = dly.temperature_2m_max?.[0] ?? 0;
    if (tmax > 35) alerts.push({ icon: "🔥", title: "Heatwave Alert", msg: `Max ${tmax}°C — stay hydrated and avoid the sun 11am–3pm.`, color: "#ef4444" });
    const rain = dly.precipitation_probability_max?.[0] ?? 0;
    if (rain > 80) alerts.push({ icon: "🌧️", title: "Heavy Rain Warning", msg: `${rain}% probability of significant rain. Carry an umbrella.`, color: "#60a5fa" });
  }
  const ws = weather.current_weather?.windspeed ?? 0;
  if (ws > 70) alerts.push({ icon: "💨", title: "Strong Wind Warning", msg: `Gusts of ${ws} km/h detected. Secure loose outdoor items.`, color: "#a78bfa" });

  return (
    <section id="alerts" className="relative z-10 my-8">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="section-heading">
          Weather <span className="text-primary">Alerts</span>
        </h2>
      </div>
      {alerts.length > 0 ? (
        alerts.map((alert, i) => (
          <div
            key={i}
            className="glass-card flex gap-3 items-start p-4 mb-3"
            style={{ borderLeftWidth: "3px", borderLeftColor: alert.color }}
          >
            <span className="text-2xl shrink-0">{alert.icon}</span>
            <div>
              <div className="text-sm font-bold text-secondary-foreground mb-0.5">{alert.title}</div>
              <div className="text-xs text-muted-foreground">{alert.msg}</div>
            </div>
          </div>
        ))
      ) : (
        <div className="glass-card flex items-center gap-3 p-4 border-green-500/20">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm text-muted-foreground">No active weather alerts. Conditions look clear!</span>
        </div>
      )}
    </section>
  );
};

export default WeatherAlerts;
