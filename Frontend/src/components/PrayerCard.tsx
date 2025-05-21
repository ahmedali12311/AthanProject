import React, { memo, useMemo } from 'react';
import { 
  Sun, 
  Sunrise, 
  Sunset, 
  Moon, 
  Clock,
  Stars,
  Cloud,
} from 'lucide-react';
import { PrayerName } from '../types';
import { formatTimeToArabic } from '../utils/timeUtils';

// Define prayer styles with enhanced gradients and effects
const PRAYER_STYLES: Record<PrayerName, { bg: string; accent: string; iconBg: string; radial: string }> = {
  fajr: { 
    bg: 'from-blue-950/40 to-blue-900/20', 
    accent: 'blue-300', 
    iconBg: 'blue-600', 
    radial: 'radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)'
  },
  sunrise: { 
    bg: 'from-yellow-950/40 to-yellow-900/20', 
    accent: 'yellow-300', 
    iconBg: 'yellow-600', 
    radial: 'radial-gradient(circle at 80% 20%, rgba(234, 179, 8, 0.2) 0%, transparent 50%)'
  },
  dhuhr: { 
    bg: 'from-sky-950/40 to-sky-900/20', 
    accent: 'sky-300', 
    iconBg: 'sky-600', 
    radial: 'radial-gradient(circle at 50% 30%, rgba(14, 165, 233, 0.2) 0%, transparent 50%)'
  },
  asr: { 
    bg: 'from-orange-950/40 to-orange-900/20', 
    accent: 'orange-300', 
    iconBg: 'orange-600', 
    radial: 'radial-gradient(circle at 70% 40%, rgba(249, 115, 22, 0.2) 0%, transparent 50%)'
  },
  maghrib: { 
    bg: 'from-purple-950/40 to-purple-900/20', 
    accent: 'purple-300', 
    iconBg: 'purple-600', 
    radial: 'radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)'
  },
  isha: { 
    bg: 'from-indigo-950/40 to-indigo-900/20', 
    accent: 'indigo-300', 
    iconBg: 'indigo-600', 
    radial: 'radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 0.2) 0%, transparent 50%)'
  },
};

interface PrayerCardProps {
  name: PrayerName;
  time: Date;
  active: boolean;
  secondTime?: Date;
  isNextDay?: boolean;
  index?: number; // For staggered animations
}

const PrayerCard: React.FC<PrayerCardProps> = ({ 
  name, 
  time, 
  active,
  secondTime,
  isNextDay,
  index = 0,
}) => {
  // Memoize prayer styles
  const { bg, accent, iconBg, radial } = useMemo(() => 
    PRAYER_STYLES[name] || {
      bg: 'from-gray-950/40 to-gray-900/20',
      accent: 'gray-300',
      iconBg: 'gray-600',
      radial: 'radial-gradient(circle at 50% 50%, rgba(107, 114, 128, 0.2) 0%, transparent 50%)',
    }, [name]
  );

  // Get icon
  const getIcon = () => {
    const Icon = {
      fajr: Sunrise,
      sunrise: Sun,
      dhuhr: Sun,
      asr: Sun,
      maghrib: Sunset,
      isha: Moon,
    }[name] || Clock;
    
    return (
      <Icon 
        className={`h-6 w-6 sm:h-7 sm:w-7 ${active ? `animate-glow-pulse text-${accent}` : 'text-white/90'}`} 
        aria-hidden="true"
      />
    );
  };

  // Get Arabic prayer name
  const getPrayerName = () => {
    return {
      fajr: 'الفجر',
      sunrise: 'الشروق',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    }[name] || '';
  };

  // Card classes
  const getCardClasses = () => {
    const baseClasses = `
      relative overflow-hidden backdrop-blur-xl rounded-3xl p-4 sm:p-5 md:p-6 
      shadow-xl transition-all duration-300 hover:shadow-2xl border border-white/10 
      bg-gradient-to-br ${bg} group w-full flex flex-col font-arabic
      animate-card-entry
    `;
    
    return active 
      ? `${baseClasses} border-2 border-${accent}/70 shadow-${accent}/40 scale-[1.02] bg-[${radial}]`
      : `${baseClasses} hover:border-${accent}/30`;
  };

  // Icon container classes
  const getIconContainerClasses = () => {
    const baseClasses = `
      flex items-center justify-center rounded-full w-12 h-12 sm:w-14 sm:h-14 
      transition-all duration-300 group-hover:scale-105
    `;
    
    return `${baseClasses} ${active ? `bg-${iconBg}/70 scale-105 shadow-lg shadow-${accent}/40` : `bg-${iconBg}/40`}`;
  };

  // Background effects (starfield for night, clouds for day)
  const getBackgroundElements = () => {
    const isNightPrayer = ['fajr', 'isha'].includes(name);
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute -left-8 -top-8 w-48 h-48 bg-${accent}/20 rounded-full blur-3xl opacity-30 animate-glow-pulse`}></div>
        
        {isNightPrayer ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-2 h-2 bg-white/50 rounded-full animate-starfield-fast" style={{ top: '20%', left: '30%' }}></div>
              <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-starfield-medium" style={{ top: '50%', left: '60%' }}></div>
              <div className="absolute w-3 h-3 bg-white/60 rounded-full animate-twinkle" style={{ top: '70%', left: '20%' }}></div>
              {active && (
                <div className="absolute w-2 h-2 bg-white rounded-full animate-shooting-star" style={{ top: '10%', left: '80%' }}></div>
              )}
            </div>
            <Stars 
              size={18} 
              className={`absolute top-4 right-4 opacity-40 animate-twinkle ${active ? 'text-' + accent : ''}`} 
              aria-hidden="true"
            />
          </>
        ) : (
          <>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse-slow"></div>
            <Cloud 
              size={20} 
              className={`absolute bottom-4 right-6 opacity-30 animate-cloud-slow ${active ? 'text-' + accent : ''}`} 
              aria-hidden="true"
            />
          </>
        )}
      </div>
    );
  };

  // Active card decoration
  const getActiveDecoration = () => {
    if (!active) return null;
    
    return (
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-r from-${accent}/30 to-transparent opacity-80 animate-glow-pulse`}></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
      </div>
    );
  };

  // Render Fajr times
  const renderFajrTimes = () => {
    if (name !== 'fajr' || !secondTime) return null;
    
    const timeStyle = active 
      ? `bg-black/50 border-${accent}/30 text-${accent} font-semibold shadow-sm`
      : 'bg-black/30 text-white/90';
    
    return (
      <div className="flex flex-col gap-2 mt-3 w-full animate-slide-in">
        <div className={`text-sm sm:text-base ${timeStyle} px-4 py-2.5 rounded-lg border border-white/10 flex justify-between items-center`}>
          <span className="font-bold">الأول:</span>
          <span>{formatTimeToArabic(time)}</span>
        </div>
        <div className={`text-sm sm:text-base ${timeStyle} px-4 py-2.5 rounded-lg border border-white/10 flex justify-between items-center`}>
          <span className="font-bold">الثاني:</span>
          <span>{formatTimeToArabic(secondTime)}</span>
        </div>
      </div>
    );
  };

  // Render regular prayer time
  const renderRegularTime = () => {
    if (name === 'fajr') return null;
    
    const timeStyle = active 
      ? `bg-black/50 border-${accent}/30 text-${accent} font-semibold shadow-sm`
      : 'bg-black/30 text-white/90';

// Prayer time rendering
    return (
      <div className={`text-sm sm:text-base ${timeStyle} px-4 py-2.5 rounded-lg border border-white/10 mt-3 text-center animate-slide-in`}>
        {formatTimeToArabic(time)}
      </div>
    );
  };

  return (
    <article 
      className={getCardClasses()} 
      data-prayer={name}
      role="region"
      aria-label={`Prayer time for ${getPrayerName()}`}
      style={{ animationDelay: `${index * 0.1}s` }} // Staggered entry
      tabIndex={0} // Keyboard navigable
    >
      {getBackgroundElements()}
      {getActiveDecoration()}
      
      <div className="flex flex-row-reverse items-center justify-between gap-3 sm:gap-4 relative z-10 flex-grow">
        <div className={getIconContainerClasses()}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {active && (
            <div className={`inline-flex items-center text-xs sm:text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full border border-${accent}/30 text-${accent} mb-2 w-fit animate-scale-in`}>
              <span className={`h-1.5 w-1.5 rounded-full bg-${accent} animate-glow-pulse mr-2`}></span>
              <span>الصلاة القادمة</span>
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className={`font-bold text-lg sm:text-xl md:text-2xl ${active ? `text-${accent}` : 'text-white'}`}>
              {getPrayerName()}
            </h3>
            {isNextDay && (
              <span className="text-xs bg-black/40 px-2 py-0.5 rounded-md border border-white/10 animate-scale-in">غداً</span>
            )}
          </div>
          
          {renderFajrTimes()}
          {renderRegularTime()}
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"></div>
    </article>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(PrayerCard); // Get the direction-aware row class for RTL layout - optimized for mobile
  