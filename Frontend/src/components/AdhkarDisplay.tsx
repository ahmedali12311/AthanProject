import React, { useState, useEffect } from 'react';
import { Book, Sun, Moon, RefreshCw, Bookmark, MessageSquareText, MoreHorizontal, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getRandomDhikr, getRandomHadith, getCurrentAdhkarType, morningAdhkar, eveningAdhkar, prayerAdhkar, prayerHadiths } from '../utils/adhkarData';
import { useTimeTheme } from '../contexts/TimeThemeContext';

type AdhkarSection = 'random' | 'morning' | 'evening' | 'prayer' | 'hadith' | 'all';

interface AdhkarDisplayProps {
  className?: string;
}

// Helper function to check if an item is a Dhikr
const isDhikr = (item: any): item is { 
  id: number;
  text: string;
  translation?: string;
  source?: string;
  repeat?: number;
} => {
  return item && 'text' in item && !('topic' in item);
};

// Helper function to check if an item is a Hadith
const isHadith = (item: any): item is {
  id: number;
  text: string;
  source: string;
  topic: string;
} => {
  return item && 'text' in item && 'topic' in item;
};

const AdhkarDisplay: React.FC<AdhkarDisplayProps> = ({ className = '' }) => {
  const [section, setSection] = useState<AdhkarSection>('random');
  const [randomDhikr, setRandomDhikr] = useState(getRandomDhikr(getCurrentAdhkarType()));
  const [randomHadith, setRandomHadith] = useState(getRandomHadith());
  const [adhkarIndex, setAdhkarIndex] = useState(0);
  const [hadithIndex, setHadithIndex] = useState(0);
  const { theme } = useTimeTheme();
  
  // When the section changes to random, generate a new random dhikr/hadith and reset count
  useEffect(() => {
    if (section === 'random') {
      setRandomDhikr(getRandomDhikr(getCurrentAdhkarType()));
      setRandomHadith(getRandomHadith());
    }
  }, [section]);
  
  const getCurrentCollection = () => {
    switch (section) {
      case 'morning': return morningAdhkar;
      case 'evening': return eveningAdhkar;
      case 'prayer': return prayerAdhkar;
      case 'hadith': return prayerHadiths;
      default: return [];
    }
  };
  
  const currentCollection = getCurrentCollection();
  const currentItem = section === 'hadith' 
    ? prayerHadiths[hadithIndex]
    : currentCollection[adhkarIndex];
  
  const refreshRandom = () => {
    if (section === 'random') {
      const type = getCurrentAdhkarType();
      setRandomDhikr(getRandomDhikr(type));
      setRandomHadith(getRandomHadith());
    }
  };
  
  const goToNext = () => {
    if (section === 'hadith') {
      setHadithIndex((prevIndex) => (prevIndex + 1) % prayerHadiths.length);
    } else if (section !== 'random') {
      setAdhkarIndex((prevIndex) => (prevIndex + 1) % currentCollection.length);
    }
  };
  
  const goToPrevious = () => {
    if (section === 'hadith') {
      setHadithIndex((prevIndex) => (prevIndex - 1 + prayerHadiths.length) % prayerHadiths.length);
    } else if (section !== 'random') {
      setAdhkarIndex((prevIndex) => (prevIndex - 1 + currentCollection.length) % currentCollection.length);
    }
  };
  
  // Get theme-specific colors
  const getThemeColors = () => {
    switch (theme) {
      case 'fajr': return {
        accent: 'from-blue-500/30 to-blue-600/10',
        border: 'border-blue-500/30',
        highlight: 'text-blue-200',
        button: 'bg-blue-500/30 hover:bg-blue-500/40',
        active: 'bg-blue-500/40'
      };
      case 'sunrise': return {
        accent: 'from-yellow-500/30 to-yellow-600/10',
        border: 'border-yellow-500/30',
        highlight: 'text-black',
        button: 'bg-yellow-500/40 hover:bg-yellow-500/50 text-black',
        active: 'bg-yellow-500/50 text-black'
      };
      case 'dhuhr': return {
        accent: 'from-blue-500/30 to-blue-600/10',
        border: 'border-blue-500/30',
        highlight: 'text-white',
        button: 'bg-blue-500/30 hover:bg-blue-500/40',
        active: 'bg-blue-500/40'
      };
      case 'asr': return {
        accent: 'from-orange-500/30 to-yellow-600/10',
        border: 'border-orange-500/30',
        highlight: 'text-white',
        button: 'bg-orange-500/30 hover:bg-orange-500/40',
        active: 'bg-orange-500/40'
      };
      case 'maghrib': return {
        accent: 'from-purple-500/30 to-purple-600/10',
        border: 'border-purple-500/30',
        highlight: 'text-white',
        button: 'bg-purple-500/30 hover:bg-purple-500/40',
        active: 'bg-purple-500/40'
      };
      case 'isha': return {
        accent: 'from-indigo-500/30 to-indigo-600/10',
        border: 'border-indigo-500/30',
        highlight: 'text-white',
        button: 'bg-indigo-500/30 hover:bg-indigo-500/40',
        active: 'bg-indigo-500/40'
      };
      default: return {
        accent: 'from-white/20 to-white/10',
        border: 'border-white/30',
        highlight: 'text-white',
        button: 'bg-white/20 hover:bg-white/30',
        active: 'bg-white/30'
      };
    }
  };
  
  const themeColors = getThemeColors();
  
  // Get section-specific colors
  const getSectionColor = () => {
    switch (section) {
      case 'morning': return 'bg-yellow-500/20';
      case 'evening': return 'bg-indigo-500/20';
      case 'prayer': return 'bg-sky-500/20';
      case 'hadith': return 'bg-emerald-500/20';
      default: return themeColors.active;
    }
  };

  const renderSectionIcon = (sectionType: string) => {
    const selected = section === sectionType;
    const baseClass = "mb-0.5 " + (selected ? "text-white" : "text-white/80");
    const size = 18;
    
    switch (sectionType) {
      case 'random': return <MoreHorizontal className={baseClass} size={size} />;
      case 'morning': return <Sun className={baseClass} size={size} />;
      case 'evening': return <Moon className={baseClass} size={size} />;
      case 'prayer': return <Bookmark className={baseClass} size={size} />;
      case 'hadith': return <MessageSquareText className={baseClass} size={size} />;
      case 'all': return <Book className={baseClass} size={size} />;
      default: return null;
    }
  };
  
  const renderRecitationCounter = (dhikr: any) => {
    if (!isDhikr(dhikr) || !dhikr.repeat || dhikr.repeat <= 1) return null;
    
    return (
      <div className="mt-3 flex justify-center">
        <span className="text-sm bg-black/20 px-3 py-1 rounded-full">
          عدد التكرارات: {dhikr.repeat}
        </span>
      </div>
    );
  };
  
  const renderContent = () => {
    if (section === 'random') {
      return (
        <div className="flex flex-col">
          <div>
            <div className="mb-6">
              <h3 className={`text-sm font-semibold mb-1 flex items-center ${themeColors.highlight}`}>
                <Sun size={14} className="ml-1" />
                {getCurrentAdhkarType() === 'morning' ? 'أذكار الصباح' : 'أذكار المساء'}
              </h3>
              <div className={`p-4 bg-gradient-to-br ${themeColors.accent} rounded-lg shadow-inner backdrop-blur-sm ${themeColors.border} border-2`}>
                <p className="text-lg font-medium text-right leading-relaxed mb-3">{randomDhikr.text}</p>
                {randomDhikr.translation && (
                  <p className="text-sm opacity-90 mb-2 text-right">{randomDhikr.translation}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-90 font-medium">{randomDhikr.source}</span>
                  {randomDhikr.repeat && randomDhikr.repeat > 1 && (
                    <span className="bg-black/40 px-2 py-0.5 rounded-full text-xs text-white">
                      التكرار: {randomDhikr.repeat} مرات
                    </span>
                  )}
                </div>
                
                {renderRecitationCounter(randomDhikr)}
              </div>
            </div>
            
            <div>
              <h3 className={`text-sm font-semibold mb-1 flex items-center ${themeColors.highlight}`}>
                <MessageSquareText size={14} className="ml-1" />
                حديث عن الصلاة
              </h3>
              <div className={`p-4 bg-gradient-to-br ${themeColors.accent} rounded-lg shadow-inner backdrop-blur-sm ${themeColors.border} border-2`}>
                <p className="text-lg font-medium text-right leading-relaxed mb-2">{randomHadith.text}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-90 font-medium">{randomHadith.source}</span>
                  <span className="bg-black/40 px-2 py-0.5 rounded-full text-xs text-white">
                    {randomHadith.topic}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            className={`mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${themeColors.button} font-medium`}
            onClick={refreshRandom}
          >
            <RefreshCw size={16} />
            <span>تحديث</span>
          </button>
        </div>
      );
    } else if (section === 'hadith') {
      const hadith = prayerHadiths[hadithIndex];
      
      return (
        <div className="flex flex-col">
          <div>
            <div className={`mb-4 p-4 bg-gradient-to-br ${themeColors.accent} rounded-lg shadow-inner backdrop-blur-sm ${themeColors.border}`}>
              <p className="text-lg text-right leading-relaxed mb-3">{hadith.text}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-75">{hadith.source}</span>
                <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs">
                  {hadith.topic}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="opacity-75">الحديث {hadithIndex + 1} من {prayerHadiths.length}</span>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <button 
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${themeColors.button}`}
              onClick={goToPrevious}
            >
              <ArrowRight size={16} />
              <span>السابق</span>
            </button>
            
            <button 
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${themeColors.button}`}
              onClick={goToNext}
            >
              <span>التالي</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      );
    } else {
      // Safe assertion since we know the section is not 'hadith' or 'random'
      const dhikr = currentCollection[adhkarIndex];
      
      if (!dhikr) return <div>لا توجد أذكار</div>;
      
      return (
        <div className="flex flex-col">
          <div>
            <div className={`mb-4 p-4 bg-gradient-to-br ${themeColors.accent} rounded-lg shadow-inner backdrop-blur-sm ${themeColors.border}`}>
              <p className="text-lg text-right leading-relaxed mb-3">{dhikr.text}</p>
              {isDhikr(dhikr) && dhikr.translation && (
                <p className="text-sm opacity-75 mb-2 text-right">{dhikr.translation}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-75">{dhikr.source}</span>
                {isDhikr(dhikr) && dhikr.repeat && dhikr.repeat > 1 && (
                  <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs">
                    التكرار: {dhikr.repeat} مرات
                  </span>
                )}
              </div>
              
              {renderRecitationCounter(dhikr)}
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="opacity-75">الذكر {adhkarIndex + 1} من {currentCollection.length}</span>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <button 
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${themeColors.button}`}
              onClick={goToPrevious}
            >
              <ArrowRight size={16} />
              <span>السابق</span>
            </button>
            
            <button 
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${themeColors.button}`}
              onClick={goToNext}
            >
              <span>التالي</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`${className} p-4 md:p-6 bg-black/30 backdrop-blur-md rounded-xl border border-white/20 shadow-lg`}>
      <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 text-white drop-shadow-md border-b border-white/20 pb-2 glow-sm`}>
        <Book className="h-6 w-6" />
        الأذكار و الأحاديث
      </h2>
      
      <div className="flex justify-between gap-2 mb-6 bg-black/40 p-1.5 rounded-xl">
        {['random', 'morning', 'evening', 'prayer', 'hadith'].map((sectionType) => (
          <button
            key={sectionType}
            className={`py-2 px-1 rounded-md text-center transition-all flex flex-col items-center justify-center ${
              section === sectionType 
                ? `${getSectionColor()} shadow-md font-medium text-white` 
                : 'hover:bg-white/10 text-white/90'
            }`}
            onClick={() => {
              setSection(sectionType as AdhkarSection);
              setAdhkarIndex(0);
              setHadithIndex(0);
            }}
          >
            {renderSectionIcon(sectionType)}
            <span className={`text-xs ${section === sectionType ? 'font-bold' : ''}`}>
              {sectionType === 'random' ? 'عشوائي' : 
                sectionType === 'morning' ? 'الصباح' : 
                sectionType === 'evening' ? 'المساء' : 
                sectionType === 'prayer' ? 'الصلاة' : 
                sectionType === 'hadith' ? 'أحاديث' : ''}
            </span>
          </button>
        ))}
      </div>
      
      {renderContent()}
    </div>
  );
};

export default AdhkarDisplay; 