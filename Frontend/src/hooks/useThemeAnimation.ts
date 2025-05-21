import { useState, useEffect } from 'react';

type PrayerPeriod = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

interface ThemeAnimation {
  primary: string;
  secondary?: string;
  className: string;
}

/**
 * Hook that provides the appropriate animations based on the current prayer period
 */
export const useThemeAnimation = (currentPeriod: PrayerPeriod): ThemeAnimation => {
  const [animation, setAnimation] = useState<ThemeAnimation>({
    primary: '',
    secondary: '',
    className: ''
  });

  useEffect(() => {
    switch (currentPeriod) {
      case 'Fajr':
        setAnimation({
          primary: 'starsShimmer',
          secondary: 'fajrGlow',
          className: 'theme-decoration-fajr'
        });
        break;
      case 'Sunrise':
        setAnimation({
          primary: 'morningMist',
          secondary: 'horizonGlow',
          className: 'theme-decoration-sunrise'
        });
        break;
      case 'Dhuhr':
        setAnimation({
          primary: 'cloudsDrift',
          secondary: 'skyGlow',
          className: 'theme-decoration-dhuhr'
        });
        break;
      case 'Asr':
        setAnimation({
          primary: 'afternoonBreeze',
          className: 'theme-decoration-asr'
        });
        break;
      case 'Maghrib':
        setAnimation({
          primary: 'eveningGlow',
          className: 'theme-decoration-maghrib'
        });
        break;
      case 'Isha':
        setAnimation({
          primary: 'starsShimmer',
          className: 'theme-decoration-isha'
        });
        break;
      default:
        setAnimation({
          primary: 'starsShimmer',
          className: 'theme-decoration-isha'
        });
    }
  }, [currentPeriod]);

  return animation;
}; 