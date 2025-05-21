import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiSun, FiMoon, FiSearch, FiCopy } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Hadith {
  id: number;
  text: string;
  source?: string;
  topic?: string;
  created_at?: string;
  updated_at?: string;
}

interface Adhkar {
  id: number;
  text: string;
  source?: string;
  repeat?: number;
  category_id?: number;
  category_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface SpecialTopic {
  id: number;
  topic: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

interface AdhkarCategory {
  id: number;
  name: string;
  description?: string;
}

const SpecialTopics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hadiths' | 'adhkar' | 'special-topics'>('hadiths');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver>();

  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [adhkar, setAdhkar] = useState<Adhkar[]>([]);
  const [specialTopics, setSpecialTopics] = useState<SpecialTopic[]>([]);
  const [adhkarCategories, setAdhkarCategories] = useState<AdhkarCategory[]>([]);
  const [selectedAdhkarCategory, setSelectedAdhkarCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchError, setSearchError] = useState('');

  const API_BASE_URL = 'https://islambackend.fly.dev';
  const PER_PAGE = 12;

  // Space-themed stars for dark mode
  const StarBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => {
        const size = Math.random() * 0.2 + 0.1;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const opacity = Math.random() * 0.5 + 0.5;
        const animationDelay = Math.random() * 5;
        const animationDuration = Math.random() * 10 + 5;
        
        return (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${size}rem`,
              height: `${size}rem`,
              left: `${left}%`,
              top: `${top}%`,
              opacity: opacity,
              animation: `twinkle ${animationDuration}s infinite ${animationDelay}s`
            }}
          />
        );
      })}
    </div>
  );

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Fetch adhkar categories on mount
  useEffect(() => {
    const fetchAdhkarCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/adhkar-categories/list`);
        setAdhkarCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error fetching adhkar categories:', error);
        toast.error('فشل تحميل تصنيفات الأذكار', {
          position: 'top-right',
          rtl: true,
        });
      }
    };
    fetchAdhkarCategories();
  }, []);

  const fetchData = useCallback(async (page: number, reset = false) => {
    setLoading(true);
    setSearchError('');
    try {
      // Initialize url with a default value to ensure it's always a string
      let url = `${API_BASE_URL}/${activeTab}/list?page=${page}&per_page=${PER_PAGE}`;
      if (activeTab === 'adhkar' && selectedAdhkarCategory) {
        url = `${API_BASE_URL}/adhkar/category?category_id=${selectedAdhkarCategory}&page=${page}&per_page=${PER_PAGE}`;
      }
      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }

      const response = await axios.get(url);
      
      const processData = <T extends Record<string, any>>(data: T[]): T[] => {
        return data.map(item => {
          const processedItem: Record<string, any> = {};
          for (const key in item) {
            processedItem[key] = item[key] === null ? 'غير متوفر' : item[key];
          }
          return processedItem as T;
        });
      };

      switch (activeTab) {
        case 'hadiths':
          const processedHadiths = processData<Hadith>(response.data.hadiths || []);
          setHadiths(prev => reset ? processedHadiths : [...prev, ...processedHadiths]);
          setHasMore((response.data.hadiths || []).length === PER_PAGE);
          break;
        case 'adhkar':
          const processedAdhkar = processData<Adhkar>(response.data.adhkar || []);
          setAdhkar(prev => reset ? processedAdhkar : [...prev, ...processedAdhkar]);
          setHasMore((response.data.adhkar || []).length === PER_PAGE);
          break;
        case 'special-topics':
          const processedTopics = processData<SpecialTopic>(response.data.specialTopics || []);
          setSpecialTopics(prev => reset ? processedTopics : [...prev, ...processedTopics]);
          setHasMore((response.data.specialTopics || []).length === PER_PAGE);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setSearchError('حدث خطأ أثناء جلب البيانات');
      toast.error('حدث خطأ أثناء جلب البيانات', {
        position: 'top-right',
        rtl: true,
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedAdhkarCategory]);

  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === 'hadiths') setHadiths([]);
    if (activeTab === 'adhkar') setAdhkar([]);
    if (activeTab === 'special-topics') setSpecialTopics([]);
    fetchData(1, true);
  }, [activeTab, searchQuery, selectedAdhkarCategory, fetchData]);

  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setCurrentPage(prev => {
          const nextPage = prev + 1;
          fetchData(nextPage);
          return nextPage;
        });
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    if (activeTab === 'hadiths') setHadiths([]);
    if (activeTab === 'adhkar') setAdhkar([]);
    if (activeTab === 'special-topics') setSpecialTopics([]);
    fetchData(1, true);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ النص', {
      position: 'top-right',
      rtl: true,
    });
  };

  const renderContent = () => {
    if (loading && currentPage === 1) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      );
    }

    const getActiveData = () => {
      switch (activeTab) {
        case 'hadiths': return hadiths;
        case 'adhkar': return adhkar;
        case 'special-topics': return specialTopics;
        default: return [];
      }
    };

    if (searchError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400">
            {searchError}
          </h3>
        </motion.div>
      );
    }

    if (getActiveData().length === 0 && !loading) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400">
            لا توجد نتائج
          </h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            {searchQuery
              ? 'حاول البحث باستخدام كلمات أخرى'
              : activeTab === 'adhkar' && selectedAdhkarCategory
              ? 'لا توجد أذكار في هذا التصنيف'
              : 'سيتم إضافة المزيد من المحتوى قريباً'}
          </p>
        </motion.div>
      );
    }

    switch (activeTab) {
      case 'hadiths':
        return (
          <div className="space-y-4">
            {hadiths.map((hadith, index) => (
              <motion.div
                key={hadith.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                ref={index === hadiths.length - 1 ? lastItemRef : null}
                className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border shadow-sm`}
              >
                <div className="flex justify-between items-start mb-2">
                  <button
                    onClick={() => copyToClipboard(hadith.text)}
                    className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'}`}
                  >
                    <FiCopy size={16} />
                  </button>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {hadith.created_at ? new Date(hadith.created_at).toLocaleDateString() : 'غير معروف'}
                  </div>
                </div>
                <p className="text-right text-lg mb-3 dark:text-gray-100 text-gray-700">
                  {hadith.text}
                </p>
                <div className="flex justify-end items-center space-x-3 text-sm">
                  <span className={`px-2 py-1 rounded ${darkMode ? 'bg-emerald-900/30 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                    {hadith.source || 'غير متوفر'}
                  </span>
                  <span className={`px-2 py-1 rounded ${darkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
                    {hadith.topic || 'غير محدد'}
                  </span>
                </div>
              </motion.div>
            ))}
            {loading && currentPage > 1 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            )}
          </div>
        );
      case 'adhkar':
        return (
          <div className="space-y-4">
            {adhkar.map((dhikr, index) => (
              <motion.div
                key={dhikr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                ref={index === adhkar.length - 1 ? lastItemRef : null}
                className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border shadow-sm`}
              >
                <div className="flex justify-between items-start mb-2">
                  <button
                    onClick={() => copyToClipboard(dhikr.text)}
                    className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'}`}
                  >
                    <FiCopy size={16} />
                  </button>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {dhikr.created_at ? new Date(dhikr.created_at).toLocaleDateString() : 'غير معروف'}
                  </div>
                </div>
                <p className="text-right text-lg mb-3 dark:text-gray-100 text-gray-700">
                  {dhikr.text}
                </p>
                <div className="flex justify-end items-center space-x-3 text-sm">
                  <span className={`px-2 py-1 rounded ${darkMode ? 'bg-purple-900/30 text-purple-200' : 'bg-purple-50 text-purple-700'}`}>
                    التكرار: {dhikr.repeat || 1} مرة
                  </span>
                  <span className={`px-2 py-1 rounded ${darkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
                    {dhikr.category_name || 'غير محدد'}
                  </span>
                  <span className={`px-2 py-1 rounded ${darkMode ? 'bg-emerald-900/30 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                    {dhikr.source || 'غير متوفر'}
                  </span>
                </div>
              </motion.div>
            ))}
            {loading && currentPage > 1 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            )}
          </div>
        );
      case 'special-topics':
        return (
          <div className="space-y-4">
            {specialTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                ref={index === specialTopics.length - 1 ? lastItemRef : null}
                className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border shadow-sm`}
              >
                <div className="flex justify-between items-start mb-2">
                  <button
                    onClick={() => copyToClipboard(`${topic.topic}\n\n${topic.content}`)}
                    className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'}`}
                  >
                    <FiCopy size={16} />
                  </button>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {topic.created_at ? new Date(topic.created_at).toLocaleDateString() : 'غير معروف'}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-right dark:text-gray-100 text-gray-800">
                  {topic.topic}
                </h3>
                <p className="text-right dark:text-gray-300 text-gray-600 whitespace-pre-line">
                  {topic.content}
                </p>
              </motion.div>
            ))}
            {loading && currentPage > 1 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen py-4 px-4 sm:px-6 transition-colors duration-300 ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
      {darkMode && <StarBackground />}
      <div className="max-w-2xl mx-auto relative">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? 'dark' : 'light'}
        />
        
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`flex justify-between items-center mb-6 sticky top-0 z-10 py-4 ${darkMode ? 'bg-gray-900/90' : 'bg-gray-100/90'} backdrop-blur-sm`}
        >
    
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent">
           مواضيع هامة
          </h1>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${darkMode ? 'text-amber-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          <button
  className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 bg-gradient-to-b from-gray-900 to-gray-800 border border-blue-500/30 hover:bg-gradient-to-b hover:from-blue-900/50 hover:to-gray-900 shadow-lg hover:shadow-blue-500/20 text-blue-100 hover:text-white capitalize relative overflow-hidden group"
>
  <a href='/'>
    <span className="relative z-10">الصفحة الرئيسية</span>
  </a>
  {/* Space-themed effects */}
  <span className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
  <span className="absolute w-1 h-1 bg-blue-400 rounded-full top-1 right-2 opacity-50 animate-pulse"></span>
  <span className="absolute w-2 h-2 bg-blue-300 rounded-full bottom-1 left-2 opacity-30 animate-pulse delay-500"></span>
</button>
        </motion.header>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`flex overflow-x-auto scrollbar-hide border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} mb-6`}
        >
          {(['hadiths', 'adhkar', 'special-topics'] as const).map((tab) => (
            <button
              key={tab}
              className={`py-3 px-6 font-medium transition-colors whitespace-nowrap ${activeTab === tab 
                ? darkMode 
                  ? 'text-emerald-400 border-b-2 border-emerald-400' 
                  : 'text-emerald-600 border-b-2 border-emerald-600' 
                : darkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'hadiths' && 'الأحاديث'}
              {tab === 'adhkar' && 'الأذكار'}
              {tab === 'special-topics' && 'المواضيع'}
            </button>
          ))}
        </motion.div>
        
        {activeTab === 'adhkar' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <label className="block mb-2 text-sm font-medium">
              تصفية حسب التصنيف
            </label>
            <div className="relative">
              <select
                value={selectedAdhkarCategory ?? ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : null;
                  setSelectedAdhkarCategory(value);
                  setCurrentPage(1);
                  setAdhkar([]); // Clear adhkar on category change
                }}
                className={`block w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  darkMode
                    ? 'bg-gray-800 text-white border-gray-700'
                    : 'bg-gray-50 text-gray-800 border-gray-300 shadow-sm'
                }`}
              >
                <option value="">جميع التصنيفات</option>
                {adhkarCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
        
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSearch}
          className="mb-6"
        >
          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${searchFocused ? 'text-emerald-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <FiSearch size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={`ابحث في ${activeTab === 'hadiths' ? 'الأحاديث...' : activeTab === 'adhkar' ? 'الأذكار...' : 'المواضيع...'}`}
              className={`block w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                darkMode
                  ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700'
                  : 'bg-gray-50 text-gray-800 placeholder-gray-500 border-gray-300 shadow-sm'
              }`}
            />
          </div>
        </motion.form>
        
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pb-16"
        >
          {renderContent()}
        </motion.main>
        
        
      </div>
    </div>
  );
};

export default SpecialTopics;