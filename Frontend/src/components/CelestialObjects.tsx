import React, { useMemo } from 'react';
import { Moon } from 'lucide-react';

interface CelestialObjectsProps {
  theme: string;
}

// Define keyframe animations globally
const starAnimations = `
  @keyframes twinkle {
    0%, 100% { opacity: var(--base-opacity); }
    50% { opacity: var(--min-opacity); }
  }
  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(-2px, 3px) rotate(0.5deg); }
    50% { transform: translate(0, 5px) rotate(0deg); }
    75% { transform: translate(2px, 3px) rotate(-0.5deg); }
  }
`;

const CelestialObjects: React.FC<CelestialObjectsProps> = ({ theme }) => {
  // Only render for night-themed prayers
  if (!['fajr', 'maghrib', 'isha'].includes(theme)) {
    return null;
  }
  
  // Configure stars density and size based on prayer time
  let starCount = 0;
  let starSize = [1, 3];
  let hasMoon = false;
  let animationIntensity = 0;
  
  switch (theme) {
    case 'fajr':
      starCount = 30; // More stars but subtle
      starSize = [0.5, 2];
      hasMoon = true;
      animationIntensity = 0.3;
      break;
    case 'maghrib':
      starCount = 50; 
      starSize = [0.8, 2.5];
      hasMoon = false;
      animationIntensity = 0.5;
      break;
    case 'isha':
      starCount = 80; // More stars for night
      starSize = [1, 3];
      // Remove the small crescent moon from isha prayer
      hasMoon = false; // Changed from true to false
      animationIntensity = 0.7;
      break;
  }
  
  // Generate stars with different properties
  const stars = useMemo(() => {
    return Array.from({ length: starCount }).map((_, i) => {
      const size = Math.random() * (starSize[1] - starSize[0]) + starSize[0];
      const opacity = Math.random() * 0.7 + 0.3;
      const glow = Math.random() * 4 + 1;
      const duration = Math.random() * 10 + 10; // Longer, slower animation
      const delay = Math.random() * 20; // Positive delay
      const twinkleIntensity = Math.random() * 0.3 * animationIntensity;
      
      // Some stars will be blueish for chilly effect
      const isBlueStar = Math.random() > 0.7;
      const color = isBlueStar ? 'hsl(210, 80%, 90%)' : 'white';
      
      return {
        key: `sky-star-${i}`,
        size,
        top: Math.random() * 100,
        left: Math.random() * 100,
        opacity,
        minOpacity: Math.max(0.1, opacity - twinkleIntensity), // Calculate min opacity
        glow,
        duration,
        delay,
        color
      };
    });
  }, [starCount, starSize[0], starSize[1], animationIntensity]);
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 9999 }}>
      {/* Add global CSS animations */}
      <style>{starAnimations}</style>
      
      {/* Stars with subtle twinkling animation */}
      {stars.map(star => (
        <div 
          key={star.key}
          className="absolute rounded-full"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            backgroundColor: star.color,
            opacity: star.opacity,
            boxShadow: `0 0 ${star.glow}px ${Math.ceil(star.glow/2)}px ${star.color}`,
            animation: `twinkle ${star.duration}s ${star.delay}s infinite ease-in-out`,
            '--base-opacity': star.opacity.toString(),
            '--min-opacity': star.minOpacity.toString(),
            transform: 'translateZ(0)', // For hardware acceleration
          } as React.CSSProperties}
        />
      ))}
      
      {/* Moon with subtle glow and animation - only for Fajr now */}
      {hasMoon && (
        <div 
          className="absolute"
          style={{
            top: `${theme === 'fajr' ? '10%' : '15%'}`,
            right: `${theme === 'fajr' ? '10%' : '15%'}`,
            filter: 'drop-shadow(0 0 12px rgba(180, 200, 255, 0.4))',
            animation: 'float 30s infinite ease-in-out',
            transform: 'translateZ(0)',
          }}
        >
          <Moon 
            size={theme === 'isha' ? 50 : 40} 
            className="text-gray-100" 
            style={{
              opacity: theme === 'fajr' ? 0.7 : 1,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CelestialObjects;