import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeType, PrayerTime } from '../types';
import { getCurrentPrayerPeriod, convertToDate } from '../utils/timeUtils';

interface TimeThemeContextType {
  theme: ThemeType;
  updateTheme: (prayerTime: PrayerTime | null) => void;
}

const TimeThemeContext = createContext<TimeThemeContextType>({
  theme: 'dhuhr',
  updateTheme: () => {}
});

export const useTimeTheme = () => useContext(TimeThemeContext);

export const TimeThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('dhuhr');

  const updateTheme = (prayerTime: PrayerTime | null) => {
    if (!prayerTime) return;
    
    const currentTime = new Date();
    const currentPeriod = getCurrentPrayerPeriod(prayerTime, currentTime);
    setTheme(currentPeriod);
  };

  // Set initial theme based on time of day
  useEffect(() => {
    // TEMPORARY: Force Isha theme to see our changes
    setTheme('isha');
    
    /* Original code - commented for testing
    const now = new Date();
    const hour = now.getHours();
    
    // Default theme mapping based on time of day
    if (hour >= 4 && hour < 6) {
      setTheme('fajr');
    } else if (hour >= 6 && hour < 12) {
      setTheme('sunrise');
    } else if (hour >= 12 && hour < 15) {
      setTheme('dhuhr');
    } else if (hour >= 15 && hour < 18) {
      setTheme('asr');
    } else if (hour >= 18 && hour < 20) {
      setTheme('maghrib');
    } else {
      setTheme('isha');
    }
    */
  }, []);

  return (
    <TimeThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </TimeThemeContext.Provider>
  );
};