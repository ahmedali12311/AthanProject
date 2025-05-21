import React, { useRef, useEffect } from 'react';
import { useTimeTheme } from '../contexts/TimeThemeContext';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const { theme } = useTimeTheme();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef<number>(progress);
  
  // Smoothly update the progress bar
  useEffect(() => {
    if (progressBarRef.current) {
      // Store last progress value
      lastProgressRef.current = progress;
      
      // Apply the style directly instead of relying only on CSS transitions
      progressBarRef.current.style.width = `${progress}%`;
    }
  }, [progress]);
  
  const getProgressColors = () => {
    switch (theme) {
      case 'fajr': return 'from-blue-400 to-blue-600';
      case 'sunrise': return 'from-yellow-400 to-yellow-600';
      case 'dhuhr': return 'from-sky-400 to-sky-600';
      case 'asr': return 'from-orange-400 to-orange-600';
      case 'maghrib': return 'from-purple-400 to-purple-600';
      case 'isha': return 'from-indigo-400 to-indigo-600';
      default: return 'from-white/40 to-white/60';
    }
  };
  
  const getGlowColor = () => {
    switch (theme) {
      case 'fajr': return 'shadow-blue-500/50';
      case 'sunrise': return 'shadow-yellow-500/50';
      case 'dhuhr': return 'shadow-sky-500/50';
      case 'asr': return 'shadow-orange-500/50';
      case 'maghrib': return 'shadow-purple-500/50';
      case 'isha': return 'shadow-indigo-500/50';
      default: return 'shadow-white/50';
    }
  };
  
  return (
    <div className="progress-container relative h-2.5 md:h-3.5 rounded-full overflow-hidden bg-black/30 backdrop-blur-sm border border-white/10 shadow-inner">
      <div 
        ref={progressBarRef}
        className={`progress-bar h-full relative overflow-hidden rounded-full bg-gradient-to-r ${getProgressColors()} shadow-md ${getGlowColor()}`}
        style={{ 
          width: `${progress}%`,
          transitionProperty: 'width',
          transitionDuration: '1s',
          transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          willChange: 'width'
        }}
      >
        {/* Multiple shimmer layers with improved performance */}
        <div className="absolute inset-0 w-full h-full shimmer-effect opacity-70"></div>
        <div className="absolute inset-0 w-full h-full shimmer-effect-slow opacity-40" style={{ animationDelay: '-1.5s' }}></div>
        
        {/* Subtle gradient overlay for smoother appearance */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
        
        {/* Edge highlight */}
        <div className="absolute inset-0 border-t border-white/20 border-r-0 border-b-0 border-l-0 rounded-full"></div>
      </div>
    </div>
  );
};

export default ProgressBar;