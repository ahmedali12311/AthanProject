import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import CitySelection from './components/CitySelection';
import PrayerTimesDisplay from './components/PrayerTimesDisplay';
import AdhkarDisplay from './components/AdhkarDisplay';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useTimeTheme } from './contexts/TimeThemeContext';
import { getPrayerNameInArabic, formatTimeToArabic } from './utils/timeUtils';
import { PrayerName } from './types';
import CelestialObjectsComponent from './components/CelestialObjectsComponent';
import QiblaDirection from './components/QiblaDirection';
import ManagePage from './pages/ManagePage';
import SpecialTopics from './components/SpecialTopicsPage';
import { 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset, 
  Cloud, 
  Stars, 
  Wind 
} from 'lucide-react';

// Theme Selector Component for Testing
interface ThemeSelectorProps {
  onSelectTheme: (theme: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onSelectTheme }) => {
  const themes = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha', 'default'];
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 shadow-lg">
      <div className="flex flex-wrap gap-2 justify-center">
        {themes.map(theme => (
          <button
            key={theme}
            onClick={() => onSelectTheme(theme)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:bg-white/20 text-white/90 hover:text-white capitalize"
          >
            {theme}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main HomePage Component
const HomePage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showCitySelection, setShowCitySelection] = useState(false);
  const { theme } = useTimeTheme();
  const [testMode, setTestMode] = useState(false);
  const [manualTheme, setManualTheme] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  
  const { 
    prayerTime, 
    loading, 
    error, 
    nextPrayer, 
    lastPrayer,
    timeRemaining, 
    progress 
  } = usePrayerTimes(selectedCity);

  // Check if there's a selected city in localStorage on mount
  useEffect(() => {
    const savedCity = localStorage.getItem('selectedCity');
    if (savedCity) {
      setSelectedCity(savedCity);
    } else {
      setShowCitySelection(true);
    }
  }, []);

  // Enable test mode with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Press T to toggle test mode
      if (e.key === 't' || e.key === 'T') {
        const newTestMode = !testMode;
        setTestMode(newTestMode);
        
        // Show notification
        if (newTestMode) {
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [testMode]);

  const handleCitySelected = (cityName: string) => {
    setSelectedCity(cityName);
    setShowCitySelection(false);
  };

  const handleChangeCity = () => {
    setShowCitySelection(true);
  };

  // Manually set theme for testing
  const handleSelectTheme = (newTheme: string) => {
    setManualTheme(newTheme);
  };

  // Apply manual theme override when in test mode
  useEffect(() => {
    if (testMode && manualTheme) {
      // This is a workaround since we don't want to modify the context
      // We're using a data attribute on the root element to override styles
      document.documentElement.setAttribute('data-theme-override', manualTheme);
    } else {
      document.documentElement.removeAttribute('data-theme-override');
    }
  }, [testMode, manualTheme]);

  // Render theme-specific background elements based on prayer time
  const renderThemeElements = () => {
    // Use the manual theme when in test mode
    const currentTheme = testMode && manualTheme ? manualTheme : theme;
    
    switch (currentTheme) {
      case 'fajr':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {/* Pre-dawn sky gradient: deep blue to lighter blue */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-900 to-indigo-900"></div>
            
            {/* Coming sunrise glow on the horizon */}
            <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-indigo-600/20 via-pink-400/10 to-transparent"></div>
            
            {/* Removed star rendering - now handled by CelestialObjectsComponent */}
            
            {/* Horizon glow */}
            <div className="absolute bottom-[-5%] left-0 right-0">
              <div className="relative h-20 w-full">
                <div className="absolute bottom-0 left-1/4 right-1/4 h-20 bg-gradient-radial from-orange-300/10 via-pink-300/5 to-transparent rounded-full transform scale-[2.0] blur-lg"></div>
              </div>
            </div>
            
            {/* Early morning mist/fog */}
            <div className="absolute bottom-0 left-0 right-0 h-1/6 bg-gradient-to-t from-gray-800/30 to-transparent backdrop-blur-[1px]"></div>
            
            {/* Early morning clouds */}
            <div className="absolute bottom-[15%] left-[-10%] text-gray-700/30">
              <Cloud size={120} strokeWidth={1} />
            </div>

            <div className="absolute bottom-[20%] right-[5%] text-gray-700/20">
              <Cloud size={90} strokeWidth={1} />
            </div>
          </div>
        );
        
      case 'sunrise':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Sunrise sky gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-400/80 via-orange-300/70 to-blue-400/90"></div>
            
            {/* Horizon glow */}
            <div className="absolute bottom-0 left-0 right-0" style={{
              height: '30%',
              background: 'linear-gradient(to top, rgba(255, 180, 150, 0.3) 0%, rgba(200, 220, 255, 0.2) 60%, transparent 100%)',
              filter: 'blur(10px)'
            }}></div>
            
            {/* Morning mist */}
            <div className="absolute bottom-0 left-0 right-0 h-1/5">
              <div className="w-full h-full bg-gradient-to-t from-white/10 to-transparent backdrop-blur-[1px]"></div>
            </div>
            
            {/* Morning clouds */}
            <div className="absolute top-[15%] right-[10%] text-white/40 transform scale-75">
              <Cloud size={120} />
            </div>
            
            <div className="absolute top-[25%] left-[5%] text-white/30 transform scale-90">
              <Cloud size={150} />
            </div>
            
            <div className="absolute top-[30%] right-[25%] text-white/50 transform scale-50">
              <Cloud size={100} />
            </div>
            
            {/* Birds flying in the distance */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={`bird-${i}`}
                className="absolute text-black/20"
                style={{
                  top: `${10 + Math.random() * 20}%`,
                  left: `${Math.random() * 90}%`,
                  transform: `scale(${Math.random() * 0.3 + 0.2}) rotate(${Math.random() * 10 - 5}deg)`
                }}
              >
                <svg width="20" height="8" viewBox="0 0 20 8" fill="currentColor">
                  <path d="M0,4 C5,0 5,8 10,4 C15,8 15,0 20,4" />
                </svg>
              </div>
            ))}
          </div>
        );
        
      case 'dhuhr':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Midday bright sky - more vibrant blue with smoother gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-500/95"></div>
            
            {/* Uniform sky brightness with radial gradient for more natural look */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-300/30 via-blue-400/15 to-transparent"></div>
            
            {/* Soft atmospheric glow */}
            <div className="absolute inset-0 opacity-40">
              <div className="w-full h-full bg-gradient-radial from-white/25 via-blue-300/15 to-transparent"></div>
            </div>
            
            {/* Scattered puffy clouds with improved animations */}
            <div className="absolute top-[20%] left-[10%] text-white/70 animate-float-slow">
              <Cloud size={90} />
            </div>
            
            <div className="absolute top-[15%] right-[30%] text-white/80 animate-float">
              <Cloud size={70} />
            </div>
            
            <div className="absolute top-[25%] right-[5%] text-white/60 animate-float-reverse">
              <Cloud size={110} />
            </div>
            
            <div className="absolute top-[30%] left-[30%] text-white/50 animate-float-slow">
              <Cloud size={80} />
            </div>
            
            {/* Enhanced atmospheric effect for the whole screen */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/10 to-blue-500/20"></div>
          </div>
        );
        
      case 'asr':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Late afternoon sky gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-amber-200/70"></div>
            
            {/* Golden hour light effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-200/10 to-transparent mix-blend-overlay"></div>
            
            {/* Light rays through clouds effect */}
            <div className="absolute top-[15%] right-[20%] w-full h-[30%] opacity-30">
              <div className="w-full h-full bg-gradient-to-b from-white/20 via-white/10 to-transparent transform rotate-[15deg] skew-x-12"></div>
            </div>
            
            {/* Elongated shadows suggestion */}
            <div className="absolute bottom-0 left-0 right-0 h-1/6 bg-gradient-to-t from-amber-700/20 to-transparent"></div>
            
            {/* Late afternoon clouds */}
            <div className="absolute top-[40%] left-[5%] text-white/80">
              <Cloud size={100} />
            </div>
            
            <div className="absolute top-[30%] right-[25%] text-white/70">
              <Cloud size={80} />
            </div>
            
            <div className="absolute top-[15%] left-[30%] text-white/60">
              <Cloud size={60} />
            </div>
            
            {/* Distant landscape silhouette */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg width="100%" height="70" viewBox="0 0 1600 70" fill="none" preserveAspectRatio="none">
                <path d="M0,70 C100,50 200,60 300,45 C400,30 500,50 600,40 C700,30 800,50 900,40 C1000,30 1100,50 1200,40 C1300,30 1400,50 1500,40 C1600,30 1600,70 1600,70 L0,70 Z" fill="rgba(30, 30, 30, 0.3)"/>
              </svg>
            </div>
          </div>
        );
        
      case 'maghrib':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {/* Dramatic sunset sky with rich colors */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-purple-700 to-red-500/90"></div>
            
            {/* Evening color glow */}
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-amber-500/10 to-transparent" style={{transformOrigin: 'center bottom', transform: 'scale(1.5)'}}></div>
            
            {/* Removed star rendering - now handled by CelestialObjectsComponent */}
            
            {/* Deep colored clouds */}
            <div className="absolute bottom-[40%] left-[10%] text-purple-300/30">
              <Cloud size={120} />
            </div>
            
            <div className="absolute top-[60%] right-[5%] text-purple-300/40">
              <Cloud size={90} />
            </div>
            
            <div className="absolute top-[50%] right-[20%] text-pink-300/30">
              <Cloud size={70} />
            </div>
            
            {/* Add dusk landscape silhouette */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg width="100%" height="80" viewBox="0 0 1600 80" fill="none" preserveAspectRatio="none">
                <path d="M0,80 C200,40 400,60 600,30 C800,10 1000,40 1200,20 C1400,5 1600,30 1600,80 L0,80 Z" fill="rgba(0, 0, 0, 0.8)"/>
              </svg>
            </div>
          </div>
        );
        
      case 'isha':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {/* Night sky gradient - deep blue/purple */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950 to-indigo-950"></div>
            
            {/* Deep night atmosphere */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-950/20 to-transparent transform scale-150"></div>
            
            {/* Star shimmer effect */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-gradient-to-b from-white/5 via-transparent to-white/5"></div>
            </div>
            
            {/* Removed star rendering - now handled by CelestialObjectsComponent */}
          </div>
        );
    }
  };
  
  return (
    <div className={`theme-${testMode && manualTheme ? manualTheme : theme} min-h-screen relative overflow-hidden`}>
      {/* Test mode notification */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 shadow-lg text-white text-sm">
          Test mode {testMode ? 'enabled' : 'disabled'} - Press T to toggle
        </div>
      )}
      
      {/* Theme decorations */}
      <div className="theme-decoration"></div>
      
      {/* Background elements specific to prayer time theme */}
      {renderThemeElements()}
      
      <div className="app-container relative z-20 min-h-screen py-4 md:py-8 px-4 flex flex-col items-center">
        <div className="glass-card container max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl px-0 rounded-2xl backdrop-blur-sm backdrop-saturate-150 border border-white/10">
          {showCitySelection ? (
            <CitySelection onCitySelected={handleCitySelected} />
          ) : (
            <div className="flex flex-col w-full">
              <div className="w-full">
                <PrayerTimesDisplay 
                  prayerTime={prayerTime}
                  nextPrayer={nextPrayer}
                  lastPrayer={lastPrayer}
                  timeRemaining={timeRemaining}
                  progress={progress}
                  loading={loading}
                  error={error}
                  onChangeCity={handleChangeCity}
                  cityName={selectedCity || ''}
                />
              </div>
              
              {/* Display the Adhkar and Hadiths section below on all screen sizes */}
              <div className="w-full mt-4 border-t border-white/10 pt-4">
                <AdhkarDisplay className="pb-4" />
              </div>
              
              {/* Qibla Direction for Libyan Cities */}
              <div className="w-full mt-4 border-t border-white/10 pt-4">
                <QiblaDirection />
              </div>

              {/* Special Topics Button */}
              <div className="w-full flex justify-center mt-4 mb-5 mt-5">
  <a
    href="/special-topics"
    className="
      px-7 py-2
      bg-white
      rounded-full
      shadow-md
      font-semibold text-base text-black
      border border-black/10
      hover:bg-black hover:text-white
      hover:shadow-lg
      transition-all duration-200
      flex items-center gap-2
      focus:outline-none focus:ring-2 focus:ring-black/40
    "
    style={{
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)'
      
    }}
  >
    <span
      role="img"
      aria-label="Special Topics"
      className="text-black animate-bounce"
      style={{ fontSize: '1.3em', display: 'inline-block' }}
    >⭐</span>
    <span className="tracking-wide">مواضيع هامة</span>
  </a>
</div>
            </div>
          )}
        </div>

        {/* Theme Selector for Testing */}
        {testMode && <ThemeSelector onSelectTheme={handleSelectTheme} />}
        
        {/* Hidden management link */}
        <div className="fixed bottom-2 right-2 opacity-0 hover:opacity-20 transition-opacity">
          <Link to="/manage" className="text-white text-xs">Manage</Link>
        </div>
      </div>
      
      {/* Add the optimized celestial objects */}
      <CelestialObjectsComponent theme={testMode && manualTheme ? manualTheme : theme} />
    </div>
  );
};

// Main App Component with Routes
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/manage" element={<ManagePage />} />
      <Route path="/special-topics" element={<SpecialTopics />} />
    </Routes>
  );
}

export default App;
