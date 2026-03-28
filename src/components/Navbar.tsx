import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "#current", label: "Current" },
  { href: "#hourly", label: "Hourly" },
  { href: "#weekly", label: "7-Day" },
  { href: "#aqi", label: "AQI" },
  { href: "#wind", label: "Wind" },
  { href: "#alerts", label: "Alerts" },
];

const Navbar = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-xl border-b border-border z-50 flex items-center justify-between px-6 md:px-10">
      <div className="font-display text-2xl tracking-widest text-foreground">
        VAYU <span className="text-primary">2.0</span>
      </div>
      <div className="hidden md:flex gap-0.5 overflow-x-auto scrollbar-thin">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-muted-foreground hover:text-foreground text-xs font-medium tracking-wider uppercase px-3 py-1.5 rounded-full hover:bg-secondary transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>
      <div className="font-mono text-xs text-muted-foreground bg-secondary border border-border px-3 py-1 rounded-full">
        🇮🇳 {time} IST
      </div>
    </nav>
  );
};

export default Navbar;
