export interface WeatherData {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relativehumidity_2m: number[];
    precipitation_probability: number[];
    weathercode: number[];
    windspeed_10m: number[];
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
  };
  air_quality?: {
    hourly?: {
      pm2_5?: number[];
      pm10?: number[];
      carbon_monoxide?: number[];
      nitrogen_dioxide?: number[];
    };
  };
  timezone?: string;
}

export interface GeoResult {
  lat: number;
  lon: number;
  name: string;
}

export async function geocodeCity(cityName: string): Promise<GeoResult | null> {
  if (!cityName.trim()) return null;
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
    );
    const data = await r.json();
    if (data.results?.length) {
      const x = data.results[0];
      return { lat: x.latitude, lon: x.longitude, name: `${x.name}, ${x.country || ""}` };
    }
  } catch {}
  return null;
}

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      timezone: "auto",
      current_weather: "true",
      hourly: "temperature_2m,relativehumidity_2m,precipitation_probability,weathercode,windspeed_10m",
      daily: "weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
    });
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    const data: WeatherData = await r.json();

    // Fetch air quality
    try {
      const aqParams = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        timezone: "auto",
        hourly: "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide",
      });
      const aqr = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${aqParams}`);
      const aq = await aqr.json();
      data.air_quality = aq;
    } catch {
      data.air_quality = {};
    }

    return data;
  } catch {
    return null;
  }
}

export function wmoInfo(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "Clear Sky" };
  if (code <= 2) return { icon: "🌤️", label: "Partly Cloudy" };
  if (code <= 3) return { icon: "☁️", label: "Overcast" };
  if (code <= 48) return { icon: "🌫️", label: "Foggy" };
  if (code <= 57) return { icon: "🌦️", label: "Drizzle" };
  if (code <= 67) return { icon: "🌧️", label: "Rainy" };
  if (code <= 77) return { icon: "❄️", label: "Snowy" };
  if (code <= 82) return { icon: "🌧️", label: "Showers" };
  if (code <= 99) return { icon: "⛈️", label: "Thunderstorm" };
  return { icon: "🌡️", label: "Unknown" };
}

export function getAqiLevel(pm25: number): { label: string; color: string } {
  if (pm25 <= 12) return { label: "Good", color: "#34d399" };
  if (pm25 <= 35.4) return { label: "Moderate", color: "#fbbf24" };
  if (pm25 <= 55.4) return { label: "Unhealthy (Sens.)", color: "#f97316" };
  if (pm25 <= 150.4) return { label: "Unhealthy", color: "#ef4444" };
  if (pm25 <= 250.4) return { label: "Very Unhealthy", color: "#a855f7" };
  return { label: "Hazardous", color: "#7e0023" };
}
