import { useState, useEffect } from 'react';
import { PrayerTime, TimeRemainingFormat, PrayerName } from '../../types';
import { fetchPrayerTimes } from '../../utils/api';
import { 
  getNextPrayer, 
  getLastPrayer,
  getTimeRemainingToNext, 
  calculatePrayerProgress,
  convertToDate
} from '../../utils/timeUtils';
import { useTimeTheme } from '../../contexts/TimeThemeContext';

export const usePrayerTimes = (cityName: string | null) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prayerTime, setPrayerTime] = useState<PrayerTime | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: PrayerName; time: Date } | null>(null);
  const [lastPrayer, setLastPrayer] = useState<{ name: PrayerName; time: Date } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemainingFormat>({ hours: 0, minutes: 0, seconds: 0 });
  const [progress, setProgress] = useState(0);
  const { updateTheme } = useTimeTheme();

  // Fetch prayer times when city changes
  useEffect(() => {
    if (!cityName) return;

    const getPrayerTimes = async () => {
      try {
        setLoading(true);
        setError(null);
        setNextPrayer(null);
        setLastPrayer(null);
        
        const response = await fetchPrayerTimes(cityName);
        const todayPrayerTime = response.prayer_times[0];
        
        if (!todayPrayerTime) {
          throw new Error('لم يتم العثور على مواقيت الصلاة لهذا اليوم');
        }
        
        setPrayerTime(todayPrayerTime);
        updateTheme(todayPrayerTime);
        
        // Initialize next and last prayer
        const currentTime = new Date();
        const next = getNextPrayer(todayPrayerTime, currentTime);
        const last = getLastPrayer(todayPrayerTime, currentTime);
        
        setNextPrayer(next);
        setLastPrayer(last);
        
        // Calculate initial time remaining
        const timeRemainingMs = getTimeRemainingToNext(currentTime, next.time);
        const remaining = {
          hours: Math.floor(timeRemainingMs / (1000 * 60 * 60)),
          minutes: Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((timeRemainingMs % (1000 * 60)) / 1000)
        };
        
        setTimeRemaining(remaining);
        
        // Calculate initial progress
        const progressPercent = calculatePrayerProgress(currentTime, last.time, next.time);
        setProgress(progressPercent);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error in getPrayerTimes:', err);
        setError(err.message || 'حدث خطأ أثناء تحميل مواقيت الصلاة');
        setLoading(false);
      }
    };

    getPrayerTimes();
  }, [cityName, updateTheme]);

  // Update time-related info periodically
  useEffect(() => {
    if (!prayerTime) return;

    const updateTimeInfo = () => {
      try {
        const currentTime = new Date();
        
        // Get next and last prayer
        const next = getNextPrayer(prayerTime, currentTime);
        const last = getLastPrayer(prayerTime, currentTime);
        
        // Only update if next or last prayer has changed
        setNextPrayer(prev => {
          if (!prev || prev.name !== next.name || prev.time.getTime() !== next.time.getTime()) {
            return next;
          }
          return prev;
        });
        
        setLastPrayer(prev => {
          if (!prev || prev.name !== last.name || prev.time.getTime() !== last.time.getTime()) {
            return last;
          }
          return prev;
        });
        
        // Calculate time remaining
        const timeRemainingMs = getTimeRemainingToNext(currentTime, next.time);
        const remaining = {
          hours: Math.floor(timeRemainingMs / (1000 * 60 * 60)),
          minutes: Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((timeRemainingMs % (1000 * 60)) / 1000)
        };
        
        // Only update time remaining if it has changed
        setTimeRemaining(prev => {
          if (
            prev.hours !== remaining.hours ||
            prev.minutes !== remaining.minutes ||
            prev.seconds !== remaining.seconds
          ) {
            return remaining;
          }
          return prev;
        });
        
        // Calculate progress
        const progressPercent = calculatePrayerProgress(currentTime, last.time, next.time);
        
        // Only update progress if it has changed significantly
        setProgress(prev => {
          if (Math.abs(prev - progressPercent) > 0.01) {
            return progressPercent;
          }
          return prev;
        });
      } catch (err) {
        console.error('Error in updateTimeInfo:', err);
      }
    };

    // Update immediately and then every minute
    updateTimeInfo();
    const intervalId = setInterval(updateTimeInfo, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [prayerTime]); // Only depend on prayerTime

  return { 
    prayerTime, 
    loading, 
    error, 
    nextPrayer, 
    lastPrayer,
    timeRemaining, 
    progress 
  };
};