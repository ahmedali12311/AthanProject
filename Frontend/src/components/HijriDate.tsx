import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/ar';
import momentHijri from 'moment-hijri';
import { useTimeTheme } from '../contexts/TimeThemeContext';

// Define Arabic month names
const hijriMonths = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

// Define Arabic day names
const arabicWeekDays = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

const HijriDate: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hijriDate, setHijriDate] = useState({
    day: 0,
    month: 0,
    year: 0,
    monthName: '',
    dayName: ''
  });
  const { theme } = useTimeTheme();

  // Update time and date every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Convert to Hijri using moment-hijri
      const hijri = momentHijri(now);
      setHijriDate({
        day: parseInt(hijri.format('iD')),
        month: parseInt(hijri.format('iM')),
        year: parseInt(hijri.format('iYYYY')),
        monthName: hijriMonths[parseInt(hijri.format('iM')) - 1],
        dayName: arabicWeekDays[now.getDay()]
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format the time in Arabic numerals
  const formatTimeInArabic = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    
    // Arabic digits
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    
    // Convert to 12-hour format
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'م' : 'ص';
    
    // Convert to Arabic numerals
    const hourStr = hour12.toString().split('').map(digit => arabicDigits[parseInt(digit)]).join('');
    const minuteStr = minutes.toString().padStart(2, '0').split('').map(digit => arabicDigits[parseInt(digit)]).join('');
    const secondStr = seconds.toString().padStart(2, '0').split('').map(digit => arabicDigits[parseInt(digit)]).join('');
    
    return `${hourStr}:${minuteStr}:${secondStr} ${ampm}`;
  };

  // Format Hijri date in Arabic
  const formatHijriDateInArabic = () => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const dayStr = hijriDate.day.toString().split('').map(digit => arabicDigits[parseInt(digit)]).join('');
    const yearStr = hijriDate.year.toString().split('').map(digit => arabicDigits[parseInt(digit)]).join('');
    
    return `${dayStr} ${hijriDate.monthName} ${yearStr} هجري`;
  };

  // Format Gregorian date in Arabic
  const formatGregorianDateInArabic = () => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    
    // Use moment with Arabic locale
    moment.locale('ar');
    const gregorianDate = moment(currentTime);
    
    // Get day, month name, and year
    const day = gregorianDate.format('D');
    const monthName = gregorianDate.format('MMMM');
    const year = gregorianDate.format('YYYY');
    
    // Convert to Arabic numerals
    const dayStr = day.toString().split('').map(digit => 
      isNaN(parseInt(digit)) ? digit : arabicDigits[parseInt(digit)]
    ).join('');
    
    const yearStr = year.toString().split('').map(digit => 
      arabicDigits[parseInt(digit)]
    ).join('');
    
    return `${dayStr} ${monthName} ${yearStr} ميلادي`;
  };

  // Get theme-specific accent colors
  const getThemeAccentClass = () => {
    switch (theme) {
      case 'fajr': return 'text-blue-300';
      case 'sunrise': return 'text-yellow-300';
      case 'dhuhr': return 'text-sky-300';
      case 'asr': return 'text-orange-400';
      case 'maghrib': return 'text-purple-300';
      case 'isha': return 'text-indigo-300';
      default: return 'text-white';
    }
  };

  return (
    <div className="hijri-date-container bg-white/10 backdrop-blur-sm rounded-xl p-5 mb-6 text-center border border-white/20 shadow-lg">
      <div className="mb-4">
        <div className="clock text-4xl font-bold tracking-wider">{formatTimeInArabic()}</div>
      </div>
      
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="date-row w-full flex items-center justify-center gap-2 bg-white/5 rounded-lg py-2 px-3">
          <Calendar className={`h-5 w-5 ${getThemeAccentClass()}`} />
          <div className="date text-sm font-medium">
            <span className="day-name ml-1">{hijriDate.dayName}</span>
            {' - '}
            <span className="hijri-date">{formatHijriDateInArabic()}</span>
          </div>
        </div>
        
        <div className="date-row w-full flex items-center justify-center gap-2 bg-white/5 rounded-lg py-2 px-3">
          <Calendar className={`h-5 w-5 ${getThemeAccentClass()}`} />
          <div className="date text-sm font-medium">
            <span className="gregorian-date">{formatGregorianDateInArabic()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HijriDate;
