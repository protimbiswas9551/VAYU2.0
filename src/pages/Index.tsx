import { useState, useEffect, useCallback } from "react";
import GlobeBackground from "@/components/GlobeBackground";
import Navbar from "@/components/Navbar";
import CitySearch from "@/components/CitySearch";
import HeroSection from "@/components/HeroSection";
import HourlyForecast from "@/components/HourlyForecast";
import WeeklyForecast from "@/components/WeeklyForecast";
import AqiSection from "@/components/AqiSection";
import WindChart from "@/components/WindChart";
import WeatherAlerts from "@/components/WeatherAlerts";
import Footer from "@/components/Footer";
import { WeatherData, geocodeCity, fetchWeatherData } from "@/lib/weather";

const Index = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [cityName, setCityName] = useState("Mumbai, India");
  const [isLoading, setIsLoading] = useState(false);

  const loadWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setIsLoading(true);
    setCityName(name);
    const data = await fetchWeatherData(lat, lon);
    if (data) setWeather(data);
    setIsLoading(false);
  }, []);

  const handleCitySelect = useCallback(
    async (city: string) => {
      setIsLoading(true);
      const geo = await geocodeCity(city);
      if (geo) {
        await loadWeather(geo.lat, geo.lon, geo.name);
      }
      setIsLoading(false);
    },
    [loadWeather]
  );

  useEffect(() => {
    loadWeather(19.076, 72.8777, "Mumbai, India");
  }, [loadWeather]);

  return (
    <div className="min-h-screen relative">
      <GlobeBackground />
      <Navbar />
      <main className="max-w-[1360px] mx-auto px-4 md:px-8">
        <CitySearch onCitySelect={handleCitySelect} isLoading={isLoading} />

        {isLoading && !weather && (
          <div className="relative z-10 flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {weather && (
          <>
            <HeroSection weather={weather} cityName={cityName} />
            <HourlyForecast weather={weather} />
            <WeeklyForecast weather={weather} />
            <AqiSection weather={weather} />
            <WindChart weather={weather} />
            <WeatherAlerts weather={weather} />
            <Footer />
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
