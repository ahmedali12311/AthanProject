import React from 'react';
import { MapPin, Loader2, Clock, Calendar, RefreshCw, Moon, Sun, MoonStar, AlertCircle } from 'lucide-react';
import ProgressBar from './ProgressBar';
import PrayerCard from './PrayerCard';
import HijriDate from './HijriDate';
import { PrayerTime, PrayerName } from '../types';
import { 
  formatTimeRemainingInArabic, 
  convertToDate, 
  getPrayerNameInArabic,
  formatTimeToArabic
} from '../utils/timeUtils';
import { useTimeTheme } from '../contexts/TimeThemeContext';
import { isLeapYear } from '../utils/timeUtils';

interface PrayerTimesDisplayProps {
  prayerTime: PrayerTime | null;
  nextPrayer: any;
  lastPrayer: any;
  timeRemaining: any;
  progress: number;
  loading: boolean;
  error: string | null;
  onChangeCity: () => void;
  cityName: string;
}

const PrayerTimesDisplay: React.FC<PrayerTimesDisplayProps> = ({
  prayerTime,
  nextPrayer,
  lastPrayer,
  timeRemaining,
  progress,
  loading,
  error,
  onChangeCity,
  cityName
}) => {
  const { theme } = useTimeTheme();

  // Define prayer-time-specific background styles
  const getThemeBackground = () => {
    switch (theme) {
      case 'fajr':
        return 'bg-gradient-to-b from-indigo-950/90 via-blue-950/85 to-blue-900/80';
      case 'sunrise':
        return 'bg-gradient-to-b from-rose-600/75 via-orange-500/70 to-yellow-400/70';
      case 'dhuhr':
        return 'bg-gradient-to-b from-sky-500/80 via-sky-600/85 to-blue-500/80';
      case 'asr':
        return 'bg-gradient-to-b from-cyan-400/80 via-cyan-500/85 to-amber-300/75';
      case 'maghrib':
        return 'bg-gradient-to-b from-indigo-950/90 via-purple-800/80 to-red-700/75';
      case 'isha':
        return 'bg-gradient-to-b from-gray-950/90 via-indigo-950/85 to-indigo-900/80';
      default:
        return 'bg-gradient-to-b from-gray-900/85 via-gray-800/80 to-gray-700/75';
    }
  };
  const getIslamicPattern = () => (
    <div className="absolute inset-0 opacity-5 pointer-events-none">
      <svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <pattern id="islamic-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M50 10 L90 90 H10 Z" stroke="white" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="20" stroke="white" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
      </svg>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 mb-4 text-gold-400" />
          <div className="absolute inset-0 rounded-full blur-xl bg-gold-400/20 animate-pulse"></div>
        </div>
        <p className="text-lg font-medium text-white font-amiri">جاري تحميل مواقيت الصلاة...</p>
      </div>
    );
  }

  if (error || !prayerTime) {
    const isNotFoundError = error && (
      error.includes('لم يتم العثور على مواقيت الصلاة لهذه المدينة') || 
      error.includes('فشل في تحميل مواقيت الصلاة')
    );

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/10 max-w-md w-full shadow-xl">
          {isNotFoundError ? (
            <>
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-gold-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-amiri">مواقيت الصلاة غير متوفرة</h2>
              <p className="text-white/90 mb-6 font-amiri">
                لم يتم العثور على مواقيت الصلاة لمدينة "{cityName}". يرجى اختيار مدينة أخرى.
              </p>
              <button 
                className="w-full px-4 py-3 bg-gold-400/20 hover:bg-gold-400/30 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm shadow-lg border border-gold-400/20 hover:scale-105"
                onClick={onChangeCity}
              >
                <MapPin className="h-5 w-5" />
                <span className="font-medium font-amiri">اختيار مدينة أخرى</span>
              </button>
            </>
          ) : (
            <>
              <p className="text-red-400 mb-6 font-medium text-lg font-amiri">{error || 'حدث خطأ غير متوقع'}</p>
              <button 
                className="px-4 py-2 bg-red-400/20 hover:bg-red-400/30 backdrop-blur-lg text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 w-full hover:scale-105"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-5 w-5" />
                <span className="font-amiri">إعادة المحاولة</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!nextPrayer || !lastPrayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 mb-4 text-gold-400" />
          <div className="absolute inset-0 rounded-full blur-xl bg-gold-400/20 animate-pulse"></div>
        </div>
        <p className="text-lg font-medium text-white font-amiri">جاري حساب مواقيت الصلاة...</p>
      </div>
    );
  }

  const currentTime = new Date();
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isFeb28 = tomorrow.getMonth() === 1 && tomorrow.getDate() === 28;
  const isNotLeapYear = !isLeapYear(tomorrow.getFullYear());
  
  if (isFeb28 && isNotLeapYear) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  
  const tomorrowPrayerTime: PrayerTime = {
    ...prayerTime,
    id: prayerTime.id + 1,
    day: tomorrow.getDate(),
    month: tomorrow.getMonth() + 1,
    fajr_first_time: adjustTimeString(prayerTime.fajr_first_time, -1),
    fajr_second_time: adjustTimeString(prayerTime.fajr_second_time, -1),
    sunrise_time: adjustTimeString(prayerTime.sunrise_time, -1),
    dhuhr_time: adjustTimeString(prayerTime.dhuhr_time, 0),
    asr_time: adjustTimeString(prayerTime.asr_time, 0),
    maghrib_time: adjustTimeString(prayerTime.maghrib_time, 1),
    isha_time: adjustTimeString(prayerTime.isha_time, 1),
  };
   
  const prayerOrder: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const nextPrayerIndex = prayerOrder.indexOf(nextPrayer.name);
  let orderedPrayers: {name: PrayerName, time: Date, isNextDay?: boolean}[] = [];
   
  for (let i = nextPrayerIndex; i < prayerOrder.length; i++) {
    const name = prayerOrder[i];
    let time: Date;
     
    switch (name) {
      case 'fajr': time = convertToDate(prayerTime.fajr_first_time); break;
      case 'sunrise': time = convertToDate(prayerTime.sunrise_time); break;
      case 'dhuhr':       time = convertToDate(prayerTime.dhuhr_time); break;
      case 'asr': time = convertToDate(prayerTime.asr_time); break;
      case 'maghrib': time = convertToDate(prayerTime.maghrib_time); break;
      case 'isha': time = convertToDate(prayerTime.isha_time); break;
      default: time = new Date();
    }
     
    orderedPrayers.push({ name, time });
  }
   
  for (let i = 0; i < nextPrayerIndex; i++) {
    const name = prayerOrder[i];
    let time: Date;
     
    switch (name) {
      case 'fajr': time = convertToDate(tomorrowPrayerTime.fajr_first_time); break;
      case 'sunrise': time = convertToDate(tomorrowPrayerTime.sunrise_time); break;
      case 'dhuhr': time = convertToDate(tomorrowPrayerTime.dhuhr_time); break;
      case 'asr': time = convertToDate(tomorrowPrayerTime.asr_time); break;
      case 'maghrib': time = convertToDate(tomorrowPrayerTime.maghrib_time); break;
      case 'isha': time = convertToDate(tomorrowPrayerTime.isha_time); break;
      default: time = new Date();
    }
     
    const nextDayTime = new Date(time);
    nextDayTime.setDate(nextDayTime.getDate() + 1);
    orderedPrayers.push({ name, time: nextDayTime, isNextDay: true });
  }

  const getThemeIcon = () => {
    const size = 24;
    switch (theme) {
      case 'fajr': return <MoonStar size={size} className="text-teal-400 animate-pulse" />;
      case 'sunrise': return <Sun size={size} className="text-gold-400 animate-pulse" />;
      case 'dhuhr': return <Sun size={size} className="text-ivory-400 animate-pulse" />;
      case 'asr': return <Sun size={size} className="text-amber-400 animate-pulse" />;
      case 'maghrib': return <Sun size={size} className="text-purple-400 animate-pulse" />;
      case 'isha': return <Moon size={size} className="text-navy-400 animate-pulse" />;
      default: return <Sun size={size} className="text-white animate-pulse" />;
    }
  };

  return (
    <div className={`relative flex flex-col h-full p-6 overflow-y-auto max-w-full ${getThemeBackground()} rounded-2xl font-amiri`}>
      {getIslamicPattern()}
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap">
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
          {getThemeIcon()}
          <h1 className="text-3xl font-bold text-white">مواقيت الصلاة</h1>
        </div>
        <button
          className="flex items-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/10 hover:scale-105"
          onClick={onChangeCity}
        >
          <MapPin className="h-5 w-5 ml-2" />
          <span className="text-base font-medium">{cityName}</span>
        </button>
      </div>

      {/* Hijri Date */}
      <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
        <HijriDate />
      </div>

      {/* Next Prayer Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 text-center shadow-xl border border-white/10 relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-50"></div>
        <div className="flex justify-center items-center gap-3 mb-3">
          <Clock className="h-6 w-6 text-gold-400 animate-pulse" />
          <p className="text-2xl font-medium text-white">
            الصلاة القادمة: <span className="font-bold">{getPrayerNameInArabic(nextPrayer.name)}</span>
          </p>
        </div>
        
        <div className="flex justify-center items-center gap-3 mb-4">
          <p className="text-xl text-white/90">
            في تمام <span className="font-bold">{formatTimeToArabic(nextPrayer.time)}</span>
          </p>
        </div>
        
        <h2 className="text-4xl font-bold mb-4 bg-gold-400/20 py-3 px-6 rounded-xl inline-block animate-pulse">
          {formatTimeRemainingInArabic(
            timeRemaining.hours * 3600000 + 
            timeRemaining.minutes * 60000 + 
            timeRemaining.seconds * 1000
          )}
        </h2>
        
        <div className="mb-3">
          <ProgressBar progress={progress} />
        </div>
        
        <div className="flex justify-between text-sm text-white/80">
          <span>{getPrayerNameInArabic(lastPrayer.name)}</span>
          <span>{getPrayerNameInArabic(nextPrayer.name)}</span>
        </div>
      </div>

      {/* Prayer Cards List */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 relative auto-rows-fr">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent -z-10"></div>
        
        {orderedPrayers.map((prayer, index) => {
          const isFirstNextDayPrayer = prayer.isNextDay && (!orderedPrayers[index-1]?.isNextDay);
          
          const divider = isFirstNextDayPrayer ? (
            <div 
              className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center justify-center animate-fade-in" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-px bg-white/20 flex-grow"></div>
              <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium flex items-center border border-white/10 whitespace-nowrap">
                <Calendar className="h-4 w-4 mr-1" />
                <span>مواقيت الغد ({tomorrowPrayerTime.day}/{tomorrowPrayerTime.month})</span>
              </div>
              <div className="h-px bg-white/20 flex-grow"></div>
            </div>
          ) : null;
          const prayerCard = prayer.name === 'fajr' ? (
            <PrayerCard
              name={prayer.name}
              time={prayer.time}
              secondTime={prayer.isNextDay ? 
                new Date(convertToDate(tomorrowPrayerTime.fajr_second_time).setDate(currentTime.getDate() + 1)) : 
                convertToDate(prayerTime.fajr_second_time)}
              active={nextPrayer.name === prayer.name && !prayer.isNextDay}
              isNextDay={prayer.isNextDay}
            />
          ) : (
            <PrayerCard
              name={prayer.name}
              time={prayer.time}
              active={nextPrayer.name === prayer.name && !prayer.isNextDay}
              isNextDay={prayer.isNextDay}
            />
          );

          return (
            <React.Fragment key={`${prayer.name}-${prayer.isNextDay ? 'next' : 'current'}`}>
              {divider}
              <div 
                className="animate-fade-in hover:scale-105 transition-transform duration-300" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {prayerCard}
              </div>
            </React.Fragment>
          );
        })}
      </div>

{/* Prayer Times Section */}
<div className="mt-8 bg-black/20 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-xl border border-red-500/30">
  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center font-amiri">
    مواقيت الصلاة اليوم في {cityName}
  </h2>

  {/* Mobile Layout (Cards) */}
  <div className="block sm:hidden space-y-3">
    {[
      { name: "الفجر", time: prayerTime.fajr_first_time },
      { name: "الشروق", time: prayerTime.sunrise_time },
      { name: "الظهر", time: prayerTime.dhuhr_time },
      { name: "العصر", time: prayerTime.asr_time },
      { name: "المغرب", time: prayerTime.maghrib_time },
      { name: "العشاء", time: prayerTime.isha_time },
    ].map((prayer) => (
      <div
        key={prayer.name}
        className="flex justify-between items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors duration-200"
      >
        <span className="text-white font-amiri text-base">{prayer.name}</span>
        <span className="text-white font-amiri text-base">{prayer.time}</span>
      </div>
    ))}
  </div>

  {/* Desktop Layout (Table) */}
  <div className="hidden sm:block overflow-x-auto">
    <table className="w-full text-center text-white font-amiri text-base">
      <thead>
        <tr className="bg-white/10">
          <th className="px-4 py-3 border border-white/10">الفجر</th>
          <th className="px-4 py-3 border border-white/10">الشروق</th>
          <th className="px-4 py-3 border border-white/10">الظهر</th>
          <th className="px-4 py-3 border border-white/10">العصر</th>
          <th className="px-4 py-3 border border-white/10">المغرب</th>
          <th className="px-4 py-3 border border-white/10">العشاء</th>
        </tr>
      </thead>
      <tbody>
        <tr className="hover:bg-white/10 transition-colors duration-200">
          <td className="px-4 py-3 border border-white/10">{prayerTime.fajr_first_time}</td>
          <td className="px-4 py-3 border border-white/10">{prayerTime.sunrise_time}</td>
          <td className="px-4 py-3 border border-white/10">{prayerTime.dhuhr_time}</td>
          <td className="px-4 py-3 border border-white/10">{prayerTime.asr_time}</td>
          <td className="px-4 py-3 border border-white/10">{prayerTime.maghrib_time}</td>
          <td className="px-4 py-3 border border-white/10">{prayerTime.isha_time}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
    </div>
  );
};

function adjustTimeString(timeStr: string, minuteChange: number): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minuteChange, 0, 0);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default PrayerTimesDisplay;