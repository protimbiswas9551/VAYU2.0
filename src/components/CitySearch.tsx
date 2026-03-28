import { useState } from "react";
import { Search, MapPin } from "lucide-react";

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai",
  "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Ghaziabad",
  "New York", "London", "Tokyo", "Paris", "Sydney", "Dubai", "Singapore",
];

interface CitySearchProps {
  onCitySelect: (city: string) => void;
  isLoading: boolean;
}

const CitySearch = ({ onCitySelect, isLoading }: CitySearchProps) => {
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      onCitySelect(search.trim());
    }
  };

  return (
    <div className="relative z-10 pt-20 pb-4 px-4 md:px-0">
      <div className="meta-label mb-3 flex items-center gap-1.5">
        <MapPin className="w-3 h-3" /> Select Location
      </div>
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search any city…"
              className="w-full bg-secondary/60 border border-border rounded-xl px-4 pl-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-semibold uppercase tracking-wider hover:bg-primary/20 hover:border-primary/40 transition-all disabled:opacity-50"
          >
            {isLoading ? "…" : "Search"}
          </button>
        </form>
        <div className="flex gap-1.5 flex-wrap">
          {INDIAN_CITIES.slice(0, 8).map((city) => (
            <button
              key={city}
              onClick={() => onCitySelect(city)}
              className="px-3 py-1.5 text-xs text-muted-foreground bg-secondary/40 border border-border rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CitySearch;
