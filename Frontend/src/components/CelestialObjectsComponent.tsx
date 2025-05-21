import React, { useMemo } from 'react';

interface CelestialObjectsProps {
  theme: string;
}

// Define a type for the sun position
type SunPosition = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
};

const CelestialObjectsComponent: React.FC<CelestialObjectsProps> = ({ theme }) => {
  // Configure stars and celestial objects based on prayer time
  let starCount = 0;
  let showFullMoon = false;
  let showCrescentMoon = false;
  let showSun = false;
  let sunPosition: SunPosition = { top: '20%', right: '20%' };
  let sunSize = 60;
  let sunColor = 'yellow';
  let sunOpacity = 1;
  
  switch (theme) {
    case 'fajr':
      starCount = 25; // Fewer stars for pre-dawn
      showCrescentMoon = true; // Crescent moon (هلال) for Fajr
      break;
    case 'sunrise':
      starCount = 10; // Very few stars for sunrise
      showSun = true;
      sunPosition = { bottom: '2%', right: '15%' }; // Sun rising just above horizon
      sunColor = 'orange';
      sunSize = 100; // Larger sunrise sun
      break;
    case 'dhuhr':
      starCount = 0; // No stars during midday
      showSun = true;
      sunPosition = { top: '15%', right: '25%' }; // Sun on right side
      sunColor = 'yellow';
      sunSize = 80;
      sunOpacity = 0.85; // Slightly reduce opacity for smoother rendering
      break;
    case 'asr':
      starCount = 0; // No stars during afternoon
      showSun = true;
      sunPosition = { top: '25%', right: '15%' }; // Sun setting on right
      sunColor = 'orange';
      sunOpacity = 0.9;
      sunSize = 70;
      break;
    case 'maghrib':
      starCount = 40; // Medium stars for sunset
      showSun = true;
      sunPosition = { bottom: '3%', right: '20%' }; // Sun almost set on right
      sunColor = 'orangered';
      sunOpacity = 0.7;
      sunSize = 60;
      break;
    case 'isha':
      starCount = 60; // Most stars for night
      showFullMoon = true; // Full moon (بدر) for Isha
      break;
    default:
      return null;
  }
  
  // Disable all suns in design
  showSun = false;
  
  // Generate stars with different properties - using useMemo to prevent regeneration
  const stars = useMemo(() => {
    return Array.from({ length: starCount }).map((_, i) => {
      // Create larger, more visible stars
      const size = Math.random() * 3 + 2; // 2-5px size
      const top = Math.random() * 90 + 5; // Keep away from edges
      const left = Math.random() * 90 + 5; // Keep away from edges
      const brightness = Math.random() * 70 + 30; // 30-100% brightness
      
      // Determine if star will twinkle (50% chance)
      const willTwinkle = Math.random() > 0.5;
      
      return {
        key: `sky-star-${i}`,
        size,
        top,
        left,
        brightness,
        willTwinkle,
      };
    });
  }, [starCount, theme]);
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 9999 }}>
      {/* Special sunrise enhancement - atmospheric effects only */}
      {theme === 'sunrise' && (
        <>
          {/* Dawn sky glow */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at bottom, rgba(200, 220, 255, 0.3) 0%, rgba(180, 200, 240, 0.2) 40%, transparent 70%)',
            zIndex: 9990
          }}></div>
          
          {/* Horizon glow */}
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: '20%',
            background: 'linear-gradient(to top, rgba(200, 200, 220, 0.3) 0%, rgba(180, 200, 240, 0.2) 60%, transparent 100%)',
            zIndex: 9991
          }}></div>
          
          {/* Soft clouds near horizon */}
          <div className="absolute animate-float-slow" style={{
            bottom: '4%',
            right: '25%',
            width: '300px',
            height: '30px',
            background: 'linear-gradient(to bottom, rgba(200, 210, 240, 0.6), rgba(200, 210, 240, 0.2))',
            borderRadius: '100%',
            filter: 'blur(8px)',
            opacity: 0.6,
            zIndex: 9994
          }}></div>
          
          <div className="absolute animate-float" style={{
            bottom: '3%',
            right: '5%',
            width: '200px',
            height: '25px',
            background: 'linear-gradient(to bottom, rgba(200, 210, 240, 0.6), rgba(200, 210, 240, 0.2))',
            borderRadius: '100%',
            filter: 'blur(6px)',
            opacity: 0.5,
            zIndex: 9994
          }}></div>
        </>
      )}
      
      {/* Stars */}
      {stars.map(star => (
        <div 
          key={star.key}
          className={`absolute rounded-full ${star.willTwinkle ? 'animate-twinkle-star' : ''}`}
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            backgroundColor: 'white',
            boxShadow: `0 0 ${star.size}px rgba(255, 255, 255, ${star.brightness / 100})`,
          }}
        />
      ))}
      
      {/* Enhanced sun for daytime prayers */}
      {showSun && (
        <div 
          className={theme === 'sunrise' ? 'absolute animate-sunrise-pulse' : 'absolute animate-sun-pulse'}
          style={{
            ...sunPosition,
            filter: `drop-shadow(0 0 ${theme === 'sunrise' ? '30px' : '20px'} rgba(255, ${sunColor === 'yellow' ? '255' : '140'}, ${sunColor === 'yellow' ? '180' : '0'}, ${theme === 'sunrise' ? '0.8' : '0.6'}))`,
            zIndex: 9995
          }}
        >
          {/* Main sun circle with beautiful gradient */}
          <div style={{ 
            width: sunSize, 
            height: sunSize, 
            borderRadius: '50%',
            background: theme === 'sunrise' 
              ? 'radial-gradient(circle at 30% 30%, rgba(255,240,200,1) 0%, rgba(255,180,60,1) 50%, rgba(255,100,0,1) 100%)' 
              : sunColor === 'yellow' 
                ? 'radial-gradient(circle at 30% 30%, rgba(255,250,240,1) 0%, rgba(255,222,89,1) 50%, rgba(255,180,0,1) 100%)' 
                : sunColor === 'orange' 
                  ? 'radial-gradient(circle at 30% 30%, rgba(255,240,220,1) 0%, rgba(255,180,90,1) 50%, rgba(255,120,0,1) 100%)' 
                  : 'radial-gradient(circle at 30% 30%, rgba(255,220,180,1) 0%, rgba(255,140,50,1) 60%, rgba(220,80,0,1) 100%)',
            opacity: sunOpacity,
            boxShadow: theme === 'sunrise'
              ? '0 0 60px 20px rgba(255, 160, 60, 0.7), 0 0 120px 30px rgba(255, 140, 40, 0.5)'
              : `0 0 40px 10px rgba(255, ${sunColor === 'yellow' ? '230' : '160'}, ${sunColor === 'yellow' ? '140' : '0'}, 0.5)`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Sun inner highlight for 3D effect */}
            <div style={{
              position: 'absolute',
              width: '60%',
              height: '60%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
              top: '15%',
              left: '15%'
            }}></div>
            
            {/* Additional inner details for sunrise */}
            {theme === 'sunrise' && (
              <>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 70% 70%, rgba(255,100,0,0.4) 0%, rgba(255,100,0,0) 60%)',
                  filter: 'blur(8px)'
                }}></div>
                <div className="animate-pulse-slower" style={{
                  position: 'absolute',
                  width: '110%',
                  height: '110%',
                  top: '-5%',
                  left: '-5%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at center, rgba(255,200,100,0.4) 0%, rgba(255,200,100,0) 70%)',
                  filter: 'blur(10px)'
                }}></div>
              </>
            )}
          </div>

          {/* Outer glow rays in a staggered pattern */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: theme === 'sunrise' ? sunSize * 2.5 : sunSize * 1.8,
            height: theme === 'sunrise' ? sunSize * 2.5 : sunSize * 1.8,
            transform: 'translate(-50%, -50%)',
            zIndex: -1
          }}>
            {Array.from({ length: theme === 'sunrise' ? 24 : 12 }).map((_, i) => (
              <div 
                key={`outer-ray-${i}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: theme === 'sunrise' 
                    ? (i % 3 === 0 ? sunSize * 1.2 : i % 3 === 1 ? sunSize : sunSize * 0.8)
                    : (i % 2 === 0 ? sunSize * 0.9 : sunSize * 0.7),
                  height: theme === 'sunrise' ? 3 : 2,
                  background: theme === 'sunrise'
                    ? 'linear-gradient(90deg, rgba(255,180,60,0.9) 0%, rgba(255,150,50,0.1) 100%)'
                    : sunColor === 'yellow'
                      ? 'linear-gradient(90deg, rgba(255,255,220,0.9) 0%, rgba(255,255,180,0.1) 100%)'
                      : 'linear-gradient(90deg, rgba(255,200,150,0.9) 0%, rgba(255,150,100,0.1) 100%)',
                  transform: `rotate(${i * (theme === 'sunrise' ? 15 : 30)}deg)`,
                  transformOrigin: '0 50%',
                  borderRadius: '50%',
                  animation: theme === 'sunrise' 
                    ? `sunrise-ray-pulse ${3 + i % 4}s infinite ease-in-out alternate` 
                    : `ray-pulse ${3 + i % 3}s infinite ease-in-out alternate`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Custom Full Moon for Isha (بدر) */}
      {showFullMoon && (
        <div 
          className="absolute animate-float"
          style={{
            top: '15%',
            right: '20%',
          }}
        >
          <div 
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, rgb(255, 255, 255) 0%, rgb(220, 220, 255) 70%, rgb(180, 180, 220) 100%)',
              boxShadow: '0 0 20px 5px rgba(255, 255, 255, 0.5)',
              position: 'relative',
            }}
          >
            {/* Moon craters for realism */}
            <div style={{ 
              position: 'absolute', 
              width: '15px', 
              height: '15px', 
              borderRadius: '50%',
              background: 'rgba(210, 210, 240, 0.8)',
              top: '20px',
              left: '25px'
            }}></div>
            <div style={{ 
              position: 'absolute', 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%',
              background: 'rgba(210, 210, 240, 0.8)',
              top: '40px',
              left: '15px'
            }}></div>
            <div style={{ 
              position: 'absolute', 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%',
              background: 'rgba(210, 210, 240, 0.8)',
              top: '15px',
              left: '45px'
            }}></div>
          </div>
        </div>
      )}
      
      {/* Custom Crescent Moon for Fajr (هلال) */}
      {showCrescentMoon && (
        <div 
          className="absolute animate-float"
          style={{
            top: '12%',
            right: '15%',
          }}
        >
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'transparent',
            boxShadow: 'inset -10px 0 0 0 #fff',
            transform: 'rotate(120deg)',
            filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))'
          }}></div>
        </div>
      )}
      
      {/* Add CSS for animations */}
      <style>{`
        @keyframes twinkle-star {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .animate-twinkle-star {
          animation: twinkle-star 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float 12s ease-in-out infinite;
        }
        
        .animate-float-reverse {
          animation: float 10s ease-in-out infinite reverse;
        }

        @keyframes dust-float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-30px) translateX(-10px); }
          75% { transform: translateY(-10px) translateX(-5px); }
        }
        
        .animate-pulse-slower {
          animation: pulse-slower 15s ease-in-out infinite;
        }
        
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.1); }
        }
        
        @keyframes sun-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        
        .animate-sun-pulse {
          animation: sun-pulse 5s ease-in-out infinite;
        }
        
        @keyframes sunrise-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .animate-sunrise-pulse {
          animation: sunrise-pulse 8s ease-in-out infinite;
        }
        
        @keyframes ray-pulse {
          0%, 100% { opacity: 0.7; width: 100%; }
          50% { opacity: 0.3; width: 80%; }
        }
        
        @keyframes sunrise-ray-pulse {
          0%, 100% { opacity: 0.8; width: 100%; }
          50% { opacity: 0.4; width: 85%; }
        }
      `}</style>
    </div>
  );
};

export default CelestialObjectsComponent;