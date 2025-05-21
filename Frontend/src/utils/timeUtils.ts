import { PrayerTime, TimeRemainingFormat, PrayerName } from '../types';

// Helper function to check if a year is a leap year
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

// Convert prayer time string to Date object
export const convertToDate = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Check if a time is between two other times
export const isTimeBetween = (
  time: Date,
  startTime: Date,
  endTime: Date
): boolean => {
  return time >= startTime && time <= endTime;
};

// Calculate time remaining to next prayer in milliseconds
export const getTimeRemainingToNext = (
  currentTime: Date,
  nextPrayerTime: Date
): number => {
  let timeRemaining = nextPrayerTime.getTime() - currentTime.getTime();
  
  // If next prayer is tomorrow (negative time difference)
  if (timeRemaining < 0) {
    // Add 24 hours to get correct time
    timeRemaining += 24 * 60 * 60 * 1000;
  }
  
  return timeRemaining;
};

// Format time remaining to Arabic format (e.g., "ساعتين و٥ دقائق")
export const formatTimeRemainingInArabic = (
  timeRemaining: number
): string => {
  const format = msToTimeFormat(timeRemaining);
  
  let result = '';
  
  // Handle hours
  if (format.hours > 0) {
    result += format.hours === 1 
      ? 'ساعة واحدة' 
      : (format.hours === 2 
        ? 'ساعتين' 
        : `${format.hours} ساعات`);
  }
  
  // Handle minutes
  if (format.minutes > 0) {
    if (result) {
      result += ' و';
    }
    result += format.minutes === 1 
      ? 'دقيقة واحدة' 
      : (format.minutes === 2 
        ? 'دقيقتين' 
        : `${convertToArabicNumbers(format.minutes)} دقائق`);
  }
  
  // Handle seconds only if hours and minutes are 0
  if (format.hours === 0 && format.minutes === 0 && format.seconds > 0) {
    result = format.seconds === 1 
      ? 'ثانية واحدة' 
      : (format.seconds === 2 
        ? 'ثانيتين' 
        : `${convertToArabicNumbers(format.seconds)} ثوان`);
  }
  
  return result || 'الآن';
};

// Convert milliseconds to hours, minutes, seconds
export const msToTimeFormat = (
  milliseconds: number
): TimeRemainingFormat => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds };
};

// Convert Western Arabic numerals to Eastern Arabic numerals
export const convertToArabicNumbers = (num: number): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/[0-9]/g, (m) => arabicNumbers[parseInt(m)]);
};

// Get prayer time and name for the next prayer
export const getNextPrayer = (
  prayerTime: PrayerTime,
  currentTime: Date
): { name: PrayerName; time: Date } => {
  const prayerTimes = [
    { name: 'fajr' as PrayerName, time: convertToDate(prayerTime.fajr_first_time) },
    { name: 'sunrise' as PrayerName, time: convertToDate(prayerTime.sunrise_time) },
    { name: 'dhuhr' as PrayerName, time: convertToDate(prayerTime.dhuhr_time) },
    { name: 'asr' as PrayerName, time: convertToDate(prayerTime.asr_time) },
    { name: 'maghrib' as PrayerName, time: convertToDate(prayerTime.maghrib_time) },
    { name: 'isha' as PrayerName, time: convertToDate(prayerTime.isha_time) }
  ];

  // Find next prayer for today
  for (const prayer of prayerTimes) {
    if (prayer.time > currentTime) {
      return prayer;
    }
  }
  
  // If no prayer is found for today, return the first prayer of tomorrow (fajr)
  const tomorrowFajr = {
    name: 'fajr' as PrayerName,
    time: new Date(convertToDate(prayerTime.fajr_first_time))
  };
  
  // Set to tomorrow, using a new Date to ensure proper date rollover
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // If tomorrow would be Feb 29 in a non-leap year, skip to March 1
  if (tomorrow.getMonth() === 1 && tomorrow.getDate() === 29 && !isLeapYear(tomorrow.getFullYear())) {
    tomorrow.setDate(1); // Set to the 1st day
    tomorrow.setMonth(2);  // Set to March (0-indexed months)
  }
  
  tomorrowFajr.time.setFullYear(
    tomorrow.getFullYear(),
    tomorrow.getMonth(),
    tomorrow.getDate()
  );
  
  return tomorrowFajr;
};

// Get the current prayer time period
export const getCurrentPrayerPeriod = (
  prayerTime: PrayerTime,
  currentTime: Date
): PrayerName => {
  const fajrTime = convertToDate(prayerTime.fajr_first_time);
  const sunriseTime = convertToDate(prayerTime.sunrise_time);
  const dhuhrTime = convertToDate(prayerTime.dhuhr_time);
  const asrTime = convertToDate(prayerTime.asr_time);
  const maghribTime = convertToDate(prayerTime.maghrib_time);
  const ishaTime = convertToDate(prayerTime.isha_time);
  
  // Add a day to make comparisons easier for night prayers
  const nextDayFajr = new Date(fajrTime);
  nextDayFajr.setDate(nextDayFajr.getDate() + 1);
  
  if (currentTime >= ishaTime || currentTime < fajrTime) {
    return 'isha';
  } else if (currentTime >= maghribTime) {
    return 'maghrib';
  } else if (currentTime >= asrTime) {
    return 'asr';
  } else if (currentTime >= dhuhrTime) {
    return 'dhuhr';
  } else if (currentTime >= sunriseTime) {
    return 'sunrise';
  } else {
    return 'fajr';
  }
};

// Calculate progress between current prayer and next prayer
export const calculatePrayerProgress = (
  currentTime: Date,
  lastPrayerTime: Date,
  nextPrayerTime: Date
): number => {
  // Create copies of the dates to avoid modifying the originals
  const currentTimeMs = currentTime.getTime();
  let lastPrayerTimeMs = lastPrayerTime.getTime();
  let nextPrayerTimeMs = nextPrayerTime.getTime();
  
  // If next prayer is tomorrow (time is less than last), add 24 hours
  if (nextPrayerTimeMs < lastPrayerTimeMs) {
    nextPrayerTimeMs += 24 * 60 * 60 * 1000;
  }
  
  // If current time is before last prayer (i.e., we crossed midnight)
  if (currentTimeMs < lastPrayerTimeMs) {
    lastPrayerTimeMs -= 24 * 60 * 60 * 1000;
  }
  
  const totalDuration = nextPrayerTimeMs - lastPrayerTimeMs;
  const elapsed = currentTimeMs - lastPrayerTimeMs;
  
  return Math.min(Math.max(0, (elapsed / totalDuration) * 100), 100);
};

// Get the last prayer before the current time
export const getLastPrayer = (
  prayerTime: PrayerTime,
  currentTime: Date
): { name: PrayerName; time: Date } => {
  const prayerTimes = [
    { name: 'fajr' as PrayerName, time: convertToDate(prayerTime.fajr_first_time) },
    { name: 'sunrise' as PrayerName, time: convertToDate(prayerTime.sunrise_time) },
    { name: 'dhuhr' as PrayerName, time: convertToDate(prayerTime.dhuhr_time) },
    { name: 'asr' as PrayerName, time: convertToDate(prayerTime.asr_time) },
    { name: 'maghrib' as PrayerName, time: convertToDate(prayerTime.maghrib_time) },
    { name: 'isha' as PrayerName, time: convertToDate(prayerTime.isha_time) }
  ];

  // Sort prayer times chronologically
  prayerTimes.sort((a, b) => a.time.getTime() - b.time.getTime());
  
  // Find the last prayer before current time
  let lastPrayer = null;
  
  for (const prayer of prayerTimes) {
    if (prayer.time <= currentTime) {
      lastPrayer = prayer;
    } else {
      break; // Stop once we find a prayer time after current time
    }
  }
  
  // If no prayer is found for today, return the last prayer (isha) of previous day
  if (!lastPrayer) {
    lastPrayer = { ...prayerTimes[prayerTimes.length - 1] };
    
    // Adjust time to previous day using proper date handling
    const yesterday = new Date(currentTime);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If yesterday would be Feb 29 in a non-leap year, adjust to Feb 28
    if (yesterday.getMonth() === 1 && yesterday.getDate() === 29 && 
        !isLeapYear(yesterday.getFullYear())) {
      yesterday.setDate(28); // Set to February 28
    }
    
    lastPrayer.time.setFullYear(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );
  }
  
  return lastPrayer;
};

// Get prayer name in Arabic
export const getPrayerNameInArabic = (name: PrayerName): string => {
  const prayerNames: Record<PrayerName, string> = {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء'
  };
  
  return prayerNames[name];
};

// Format time to display in Arabic
export const formatTimeToArabic = (time: Date): string => {
  let hours = time.getHours();
  const minutes = time.getMinutes();
  const ampm = hours >= 12 ? 'م' : 'ص';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  const hoursStr = convertToArabicNumbers(hours);
  const minutesStr = convertToArabicNumbers(minutes);
  
  return `${hoursStr}:${minutes < 10 ? '٠' + minutesStr : minutesStr} ${ampm}`;
};

/**
 * Extracts the time portion from a datetime string (if it's in ISO format)
 * Otherwise returns the string as is
 */
export const extractTimeFromDateTime = (datetimeStr: string): string => {
  // Check if the string is in ISO format
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(datetimeStr)) {
    const date = new Date(datetimeStr);
    return date.toTimeString().slice(0, 5); // Get HH:MM format
  }
  
  // If it's already just a time or other format, return as is
  return datetimeStr;
};