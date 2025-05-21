import React from 'react';
import { useThemeAnimation } from '../hooks/useThemeAnimation';

interface ThemeDecorationsProps {
  currentPrayer: string;
}

/**
 * Component that renders decorative elements with animations based on the current prayer time
 */
const ThemeDecorations: React.FC<ThemeDecorationsProps> = ({ currentPrayer }) => {
  // Convert string to PrayerPeriod type
  const prayerPeriod = currentPrayer as 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  
  // Get the appropriate animations for the current prayer
  const { primary, secondary, className } = useThemeAnimation(prayerPeriod);

  return (
    <div className={`theme-decoration ${className}`} aria-hidden="true">
      {/* Primary decoration element */}
      <div 
        className="decoration-element primary"
        style={{ animation: primary ? `${primary} 8s ease-in-out infinite` : 'none' }}
      />
      
      {/* Secondary decoration element (if available) */}
      {secondary && (
        <div 
          className="decoration-element secondary"
          style={{ animation: `${secondary} 10s ease-in-out infinite` }}
        />
      )}
    </div>
  );
};

export default ThemeDecorations; 