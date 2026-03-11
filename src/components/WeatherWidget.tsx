import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer } from 'lucide-react';
import { motion } from 'motion/react';

export default function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated weather for KGF location
    // In a real app, you'd fetch from OpenWeatherMap or similar
    setTimeout(() => {
      setWeather({
        temp: 28,
        condition: 'Clear',
        humidity: 45,
        wind: 12,
        icon: 'Sun'
      });
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) return (
    <div className="glass-morphism p-6 rounded-3xl w-full max-w-xs animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-4" />
      <div className="h-8 w-16 bg-white/10 rounded" />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="glass-morphism p-6 rounded-3xl w-full max-w-xs border border-white/5"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">ARENA WEATHER</p>
          <h4 className="text-2xl font-display font-black">KGF HUB</h4>
        </div>
        <div className="p-2 bg-primary/20 rounded-xl">
          <Sun className="text-primary w-6 h-6" />
        </div>
      </div>

      <div className="flex items-end gap-2 mb-6">
        <span className="text-4xl font-display font-black">{weather.temp}°</span>
        <span className="text-white/40 text-sm mb-1 uppercase font-bold">{weather.condition}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-white/40">
          <Wind className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase">{weather.wind} KM/H</span>
        </div>
        <div className="flex items-center gap-2 text-white/40">
          <Thermometer className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase">{weather.humidity}% HUM</span>
        </div>
      </div>
      
      <p className="mt-6 text-[9px] text-primary font-black uppercase tracking-widest flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
        Perfect for a match
      </p>
    </motion.div>
  );
}
