import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTimeTheme } from '../contexts/TimeThemeContext';
import ManagePrayerTimes from '../components/admin/ManagePrayerTimes';
import ManageSections from '../components/admin/ManageSections';
import ManageAdhkar from '../components/admin/ManageAdhkar';
import ManageHadiths from '../components/admin/ManageHadiths';
import ManageSpecialTopics from '../components/admin/ManageSpecialTopics';
import Login from '../components/admin/Login';
import UpdateAccount from '../components/admin/UpdateAccount';

const ManagePage: React.FC = () => {
  const { theme } = useTimeTheme();
  const [activeTab, setActiveTab] = useState<'prayerTimes' | 'sections' | 'account' | 'adhkar' | 'hadiths' | 'specialTopics'>('prayerTimes');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  
  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);
  
  const handleLoginSuccess = (token: string, user: any) => {
    setToken(token);
    setUser(user);
    setIsAuthenticated(true);
  };
  
  const handleTokenUpdate = (newToken: string) => {
    console.log('Token updated in ManagePage:', newToken);
    setToken(newToken);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken('');
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return (
    <div className={`min-h-screen theme-${theme}`}>
      <div className="theme-decoration"></div>
      
      <div className="relative z-20 min-h-screen pt-4 pb-8 px-4">
        <div className="glass-card container max-w-6xl mx-auto px-0 rounded-2xl backdrop-blur-md backdrop-saturate-150 border border-white/10 overflow-hidden">
          <div className="w-full bg-white/10 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">منصة الإدارة</h1>
            <div className="flex space-x-2 rtl:space-x-reverse">
              {isAuthenticated && (
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 transition-all duration-300 text-white rounded-lg ml-2"
                >
                  تسجيل الخروج
                </button>
              )}
              <Link 
                to="/" 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 text-white rounded-lg"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
          
          {!isAuthenticated ? (
            <div className="p-6">
              <Login onLoginSuccess={handleLoginSuccess} />
            </div>
          ) : (
            <div className="p-6">
              <div className="flex flex-wrap border-b border-white/20 mb-6">
                <button
                  className={`px-6 py-3 text-white font-medium ${activeTab === 'prayerTimes' ? 'border-b-2 border-white' : 'opacity-70 hover:opacity-100'}`}
                  onClick={() => setActiveTab('prayerTimes')}
                >
                  مواقيت الصلاة
                </button>
                <button
                  className={`px-6 py-3 text-white font-medium ${activeTab === 'sections' ? 'border-b-2 border-white' : 'opacity-70 hover:opacity-100'}`}
                  onClick={() => setActiveTab('sections')}
                >
                  الأقسام
                </button>
                <button
                  className={`px-6 py-3 text-white font-medium ${activeTab === 'adhkar' ? 'border-b-2 border-white' : 'opacity-70 hover:opacity-100'}`}
                  onClick={() => setActiveTab('adhkar')}
                >
                  الأذكار
                </button>
                <button
                  className={`px-6 py-3 text-white font-medium ${activeTab === 'hadiths' ? 'border-b-2 border-white' : 'opacity-70 hover:opacity-100'}`}
                  onClick={() => setActiveTab('hadiths')}
                >
                  الأحاديث
                </button>
                <button
                  className={`px-6 py-3 text-white font-medium ${activeTab === 'specialTopics' ? 'border-b-2 border-white' : 'opacity-70 hover:opacity-100'}`}
                  onClick={() => setActiveTab('specialTopics')}
                >
                  الموضوعات الخاصة
                </button>
                <button
                  className={`px-6 py-3 text-white font-medium ${activeTab === 'account' ? 'border-b-2 border-white' : 'opacity-70 hover:opacity-100'}`}
                  onClick={() => setActiveTab('account')}
                >
                  الحساب
                </button>
              </div>
              
              {activeTab === 'prayerTimes' && <ManagePrayerTimes token={token} onTokenUpdate={handleTokenUpdate} />}
              {activeTab === 'sections' && <ManageSections token={token} onTokenUpdate={handleTokenUpdate} />}
              {activeTab === 'adhkar' && <ManageAdhkar token={token} onTokenUpdate={handleTokenUpdate} />}
              {activeTab === 'hadiths' && <ManageHadiths token={token} onTokenUpdate={handleTokenUpdate} />}
              {activeTab === 'specialTopics' && <ManageSpecialTopics token={token} onTokenUpdate={handleTokenUpdate} />}
              {activeTab === 'account' && <UpdateAccount token={token} onLogout={handleLogout} onTokenUpdate={handleTokenUpdate} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePage; 