import { WeatherData, getAqiLevel } from "@/lib/weather";

interface Props {
  weather: WeatherData;
}

const AqiSection = ({ weather }: Props) => {
  const aq = weather.air_quality?.hourly;
  const pm25 = aq?.pm2_5?.[0] ?? 0;
  const pm10 = aq?.pm10?.[0] ?? 0;
  const co = aq?.carbon_monoxide?.[0] ?? 0;
  const no2 = aq?.nitrogen_dioxide?.[0] ?? 0;
  const uv = weather.daily?.uv_index_max?.[0] ?? 0;
  const { label: aqiLabel, color: aqiColor } = getAqiLevel(pm25);

  const uvLabel = uv < 3 ? "Low" : uv < 6 ? "Moderate" : uv < 8 ? "High" : uv < 11 ? "Very High" : "Extreme";
  const uvColor = uv < 3 ? "#34d399" : uv < 6 ? "#fbbf24" : uv < 8 ? "#f97316" : uv < 11 ? "#ef4444" : "#a855f7";

  const pm25Aqi = (c: number) => {
    const ranges: [number, number, number, number][] = [
      [0, 12, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150],
      [55.5, 150.4, 151, 200], [150.5, 250.4, 201, 300], [250.5, 500.4, 301, 500],
    ];
    for (const [lc, hc, li, hi] of ranges) {
      if (c >= lc && c <= hc) return Math.round(((hi - li) / (hc - lc)) * (c - lc) + li);
    }
    return 500;
  };

  const aqiVal = pm25Aqi(pm25);

  const cards = [
    { label: "AQI", value: aqiVal.toString(), sub: aqiLabel, color: aqiColor },
    { label: "PM2.5", value: pm25.toFixed(1), sub: "µg/m³", color: aqiColor },
    { label: "PM10", value: pm10.toFixed(1), sub: "µg/m³", color: "#60a5fa" },
    { label: "UV Index", value: uv.toString(), sub: uvLabel, color: uvColor },
  ];

  return (
    <section id="aqi" className="relative z-10 my-8">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="section-heading">
          Air Quality <span className="text-primary">& UV</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-card-hover p-5 text-center">
            <div className="meta-label mb-2">{card.label}</div>
            <div className="text-3xl font-extrabold tracking-tight leading-none" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">{card.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "🟫", label: "Carbon Monoxide", value: `${co.toFixed(1)} µg/m³` },
          { icon: "🟤", label: "Nitrogen Dioxide", value: `${no2.toFixed(1)} µg/m³` },
        ].map((item) => (
          <div key={item.label} className="glass-card flex items-center gap-3 p-4">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <div className="meta-label mb-0.5">{item.label}</div>
              <div className="meta-value">{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AqiSection;
