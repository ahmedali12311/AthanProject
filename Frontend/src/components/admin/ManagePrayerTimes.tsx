import React, { useState, useEffect } from 'react';
import PrayerTimeForm from './PrayerTimeForm';
import Pagination from './Pagination';

// API URL
const API_URL = 'https://islambackend.fly.dev';

// Type definitions
interface PrayerTime {
  id: number;
  day: number;
  month: number;
  section: string;
  fajr_first_time: string;
  fajr_second_time: string;
  sunrise_time: string;
  dhuhr_time: string;
  asr_time: string;
  maghrib_time: string;
  isha_time: string;
  created_at: string;
  updated_at: string;
}

interface Section {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface TokenResponse {
  expires: string;
  token: string;
}

interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  first_page: number;
  last_page: number;
  from: number;
  to: number;
}

interface ManagePrayerTimesProps {
  token?: string;
  onTokenUpdate?: (newToken: string) => void;
}

const ManagePrayerTimes: React.FC<ManagePrayerTimesProps> = ({ token, onTokenUpdate }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPrayerTime, setEditingPrayerTime] = useState<{
    day: number;
    month: number;
    fajr_first_time: string;
    fajr_second_time: string;
    sunrise_time: string;
    dhuhr_time: string;
    asr_time: string;
    maghrib_time: string;
    isha_time: string;
  } | null>(null);
  const [searchDay, setSearchDay] = useState<string>('');
  const [searchMonth, setSearchMonth] = useState<string>('');
  const [searchSection, setSearchSection] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    per_page: 10,
    current_page: 1,
    first_page: 1,
    last_page: 1,
    from: 0,
    to: 0
  });

  // Add auth headers to fetch requests
  const getAuthHeaders = (): Record<string, string> => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Save selected section to localStorage
  const saveSelectedSection = (section: string) => {
    localStorage.setItem('selectedSection', section);
  };

  // Fetch sections for dropdown
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch(`${API_URL}/sections/list`, {
          headers: getAuthHeaders()
        });
        if (!response.ok) {
          throw new Error('فشل تحميل الأقسام');
        }
        const data = await response.json();
        setSections(data.sections);
        
        // Try to get saved section from localStorage
        const savedSection = localStorage.getItem('selectedSection');
        
        if (savedSection && data.sections.some((s: Section) => s.name === savedSection)) {
          // If saved section exists and is in the returned sections, use it
          setSelectedSection(savedSection);
          setSearchSection(savedSection);
        } else if (data.sections.length > 0) {
          // Otherwise use the first section
          setSelectedSection(data.sections[0].name);
          setSearchSection(data.sections[0].name);
          // Save this selection
          saveSelectedSection(data.sections[0].name);
        } else {
          setError('لا توجد أقسام متاحة. يرجى إضافة قسم جديد أولاً.');
        }
      } catch (err) {
        setError('فشل تحميل الأقسام. يرجى المحاولة مرة أخرى في وقت لاحق.');
        console.error(err);
      }
    };

    fetchSections();
  }, [token]);

  // Fetch prayer times when section changes or page changes or search is triggered
  useEffect(() => {
    if (!selectedSection) return;
    
    const fetchPrayerTimes = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let url;
        
        // Use search endpoint if searching, otherwise use list endpoint
        if (isSearching) {
          url = `${API_URL}/prayer-times/search?`;
          if (searchDay) url += `day=${searchDay}`;
          if (searchMonth) url += `${searchDay ? '&' : ''}month=${searchMonth}`;
          if (searchSection) url += `${(searchDay || searchMonth) ? '&' : ''}section=${encodeURIComponent(searchSection)}`;
          // No pagination for search endpoint
        } else {
          url = `${API_URL}/prayer-times/list?q=${encodeURIComponent(selectedSection)}&page=${meta.current_page}&per_page=${meta.per_page}`;
        }
        
        const response = await fetch(url, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error('فشل تحميل مواقيت الصلاة');
        }
        
        const data = await response.json();
        
        // Safe check for data structure
        if (!data) {
          console.error('لم يتم استلام بيانات من الخادم');
          setPrayerTimes([]);
          return;
        }
        
        // Handle potentially null prayer_times array
        setPrayerTimes(Array.isArray(data.prayer_times) ? data.prayer_times : []);
        
        // Only update pagination meta if not in search mode
        if (!isSearching) {
          if (data.meta) {
            setMeta(data.meta);
          }
        } else {
          // Reset pagination meta for search results
          const prayerTimesLength = Array.isArray(data.prayer_times) ? data.prayer_times.length : 0;
          setMeta({
            ...meta,
            current_page: 1,
            last_page: 1,
            total: prayerTimesLength,
            from: prayerTimesLength > 0 ? 1 : 0,
            to: prayerTimesLength
          });
        }
      } catch (err) {
        setError('فشل تحميل مواقيت الصلاة. يرجى المحاولة مرة أخرى في وقت لاحق.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [selectedSection, meta.current_page, isSearching, token]);

  const handlePageChange = (page: number) => {
    setMeta((prev: any) => ({ ...prev, current_page: page }));
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSection = e.target.value;
    setSelectedSection(newSection);
    saveSelectedSection(newSection);
    setMeta((prev: any) => ({ ...prev, current_page: 1 })); // Reset to first page when section changes
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // First set to false to ensure the useEffect will trigger even if already searching
    setIsSearching(false);
    // Use setTimeout to ensure the state update cycle completes
    setTimeout(() => {
      setIsSearching(true);
      setMeta((prev: any) => ({ ...prev, current_page: 1 }));
    }, 0);
  };

  const clearSearch = () => {
    setSearchDay('');
    setSearchMonth('');
    setSearchSection(selectedSection);
    setIsSearching(false);
    setMeta((prev: any) => ({ ...prev, current_page: 1 }));
  };

  const handleAddPrayerTime = async (prayerTime: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('day', prayerTime.day.toString());
      formData.append('month', prayerTime.month.toString());
      formData.append('section', selectedSection);
      formData.append('fajr_first_time', prayerTime.fajr_first_time);
      formData.append('fajr_second_time', prayerTime.fajr_second_time);
      formData.append('sunrise_time', prayerTime.sunrise_time);
      formData.append('dhuhr_time', prayerTime.dhuhr_time);
      formData.append('asr_time', prayerTime.asr_time);
      formData.append('maghrib_time', prayerTime.maghrib_time);
      formData.append('isha_time', prayerTime.isha_time);
      
      const response = await fetch(`${API_URL}/prayer-times`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      
      // Parse the response as JSON
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في إضافة موعد الصلاة');
      }
      
      // Check for a new token in the response
      console.log('Add prayer time response:', responseData);
      
      // If the response includes a new token, save it
      if (responseData.token) {
        console.log('New token received, updating localStorage');
        localStorage.setItem('authToken', responseData.token);
        
        // Notify parent component about the new token
        if (onTokenUpdate) {
          onTokenUpdate(responseData.token);
        }
      }
      
      // Refresh data
      await refreshPrayerTimesList();
      
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'فشل في إضافة موعد الصلاة. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPrayerTime = async (prayerTime: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('fajr_first_time', prayerTime.fajr_first_time);
      formData.append('fajr_second_time', prayerTime.fajr_second_time);
      formData.append('sunrise_time', prayerTime.sunrise_time);
      formData.append('dhuhr_time', prayerTime.dhuhr_time);
      formData.append('asr_time', prayerTime.asr_time);
      formData.append('maghrib_time', prayerTime.maghrib_time);
      formData.append('isha_time', prayerTime.isha_time);
      
      const response = await fetch(
        `${API_URL}/prayer-times?day=${prayerTime.day}&month=${prayerTime.month}&section=${encodeURIComponent(selectedSection)}`, 
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: formData
        }
      );
      
      // Parse the response as JSON
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في تحديث موعد الصلاة');
      }
      
      // Check for a new token in the response
      console.log('Edit prayer time response:', responseData);
      
      // If the response includes a new token, save it
      if (responseData.token) {
        console.log('New token received, updating localStorage');
        localStorage.setItem('authToken', responseData.token);
        
        // Notify parent component about the new token
        if (onTokenUpdate) {
          onTokenUpdate(responseData.token);
        }
      }
      
      // Refresh data
      await refreshPrayerTimesList();
      
      setShowEditForm(false);
      setEditingPrayerTime(null);
    } catch (err: any) {
      setError(err.message || 'فشل في تحديث موعد الصلاة. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (prayer: PrayerTime) => {
    setEditingPrayerTime({
      day: prayer.day,
      month: prayer.month,
      fajr_first_time: prayer.fajr_first_time,
      fajr_second_time: prayer.fajr_second_time,
      sunrise_time: prayer.sunrise_time,
      dhuhr_time: prayer.dhuhr_time,
      asr_time: prayer.asr_time,
      maghrib_time: prayer.maghrib_time,
      isha_time: prayer.isha_time
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleDeletePrayerTime = async (day: number, month: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/prayer-times?day=${day}&month=${month}&section=${encodeURIComponent(selectedSection)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );
      
      // Parse the response as JSON
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في حذف موعد الصلاة');
      }
      
      // Check for a new token in the response
      console.log('Delete prayer time response:', responseData);
      
      // If the response includes a new token, save it
      if (responseData.token) {
        console.log('New token received, updating localStorage');
        localStorage.setItem('authToken', responseData.token);
        
        // Notify parent component about the new token
        if (onTokenUpdate) {
          onTokenUpdate(responseData.token);
        }
      }
      
      // Refresh data
      await refreshPrayerTimesList();
    } catch (err: any) {
      setError(err.message || 'فشل في حذف موعد الصلاة. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPrayerTimesList = async () => {
    try {
      let url;
      
      // Use search endpoint if searching, otherwise use list endpoint
      if (isSearching) {
        url = `${API_URL}/prayer-times/search?`;
        if (searchDay) url += `day=${searchDay}`;
        if (searchMonth) url += `${searchDay ? '&' : ''}month=${searchMonth}`;
        if (searchSection) url += `${(searchDay || searchMonth) ? '&' : ''}section=${encodeURIComponent(searchSection)}`;
        // No pagination for search endpoint
      } else {
        url = `${API_URL}/prayer-times/list?q=${encodeURIComponent(selectedSection)}&page=${meta.current_page}&per_page=${meta.per_page}`;
      }
      
      const refreshResponse = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        
        // Safe check for data structure
        if (!data) {
          console.error('لم يتم استلام بيانات من الخادم أثناء التحديث');
          setPrayerTimes([]);
          return;
        }
        
        // Handle potentially null prayer_times array
        setPrayerTimes(Array.isArray(data.prayer_times) ? data.prayer_times : []);
        
        // Only update pagination meta if not in search mode
        if (!isSearching) {
          if (data.meta) {
            setMeta(data.meta);
          }
        } else {
          // Reset pagination meta for search results
          const prayerTimesLength = Array.isArray(data.prayer_times) ? data.prayer_times.length : 0;
          setMeta({
            ...meta,
            current_page: 1,
            last_page: 1,
            total: prayerTimesLength,
            from: prayerTimesLength > 0 ? 1 : 0,
            to: prayerTimesLength
          });
        }
      }
    } catch (err) {
      console.error('Error refreshing prayer times list:', err);
    }
  };

  return (
    <div className="text-white">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-xl font-semibold">إدارة مواقيت الصلاة</h2>
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg sm:hidden"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowEditForm(false);
              setEditingPrayerTime(null);
            }}
          >
            {showAddForm ? 'إلغاء' : 'إضافة'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/30 border border-red-500/50 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="bg-white/5 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-4">إضافة موعد جديد</h3>
          <PrayerTimeForm 
            onSubmit={handleAddPrayerTime} 
            isLoading={isLoading} 
            selectedSection={selectedSection}
          />
        </div>
      )}

      {showEditForm && editingPrayerTime && (
        <div className="bg-white/5 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-4">تعديل موعد الصلاة</h3>
          <PrayerTimeForm 
            onSubmit={handleEditPrayerTime} 
            isLoading={isLoading} 
            selectedSection={selectedSection}
            initialValues={editingPrayerTime}
            isEditing={true}
          />
          <button
            className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-lg"
            onClick={() => {
              setShowEditForm(false);
              setEditingPrayerTime(null);
            }}
            disabled={isLoading}
          >
            إلغاء التعديل
          </button>
        </div>
      )}

      <div className="mb-6 bg-white/5 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">بحث عن مواقيت الصلاة</h3>
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block mb-2 text-white/80">اليوم:</label>
            <input
              type="number"
              value={searchDay}
              onChange={(e) => setSearchDay(e.target.value)}
              placeholder="كل الأيام"
              min="1"
              max="31"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          
          <div>
            <label className="block mb-2 text-white/80">الشهر:</label>
            <input
              type="number"
              value={searchMonth}
              onChange={(e) => setSearchMonth(e.target.value)}
              placeholder="كل الشهور"
              min="1"
              max="12"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          
          <div>
            <label className="block mb-2 text-white/80">القسم:</label>
            <select
              value={searchSection}
              onChange={(e) => setSearchSection(e.target.value)}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
              style={{ backgroundColor: '#1f2937' }}
            >
              {sections.map(section => (
                <option key={section.id} value={section.name} className="bg-gray-800 text-white">
                  {section.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="px-4 py-3 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg flex-1"
              disabled={isLoading}
            >
              بحث
            </button>
            
            <button
              type="button"
              onClick={clearSearch}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-lg flex-1"
              disabled={isLoading}
            >
              إعادة تعيين
            </button>
          </div>
        </form>
        
        {isSearching && (
          <div className="mt-4 text-sm text-white/70 p-3 bg-white/5 rounded-lg">
            البحث عن: {searchDay ? `اليوم: ${searchDay}` : ''} 
            {searchMonth ? ` الشهر: ${searchMonth}` : ''} 
            {searchSection ? ` القسم: ${searchSection}` : ''}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <div className="w-full sm:w-auto flex-grow">
            <label className="block mb-2 text-white/80">اختر القسم:</label>
            <select
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
              value={selectedSection}
              onChange={handleSectionChange}
              disabled={isLoading || sections.length === 0}
              style={{ backgroundColor: '#1f2937' }}
            >
              {sections.length === 0 ? (
                <option value="" className="bg-gray-800 text-white">لا توجد أقسام</option>
              ) : (
                sections.map(section => (
                  <option key={section.id} value={section.name} className="bg-gray-800 text-white">
                    {section.name}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="mt-2 sm:mt-8">
            <button
              className="w-full sm:w-auto px-4 py-3 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowEditForm(false);
                setEditingPrayerTime(null);
              }}
            >
              {showAddForm ? 'إلغاء' : 'إضافة موعد جديد'}
            </button>
          </div>
        </div>
      </div>

      {isLoading && !showAddForm && !showEditForm ? (
        <div className="flex justify-center p-8">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center p-8 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
          <p className="text-white text-lg font-medium mb-2">لا توجد أقسام متاحة</p>
          <p className="text-white/80">يرجى إضافة قسم جديد أولاً قبل إدارة مواقيت الصلاة</p>
        </div>
      ) : prayerTimes.length === 0 ? (
        <div className="text-center p-8 bg-blue-500/20 rounded-lg border border-blue-500/30">
          {isSearching ? (
            <>
              <p className="text-white text-lg font-medium mb-2">لا توجد نتائج للبحث</p>
              <p className="text-white/80">لم يتم العثور على مواقيت صلاة تطابق معايير البحث</p>
            </>
          ) : (
            <>
              <p className="text-white text-lg font-medium mb-2">لا توجد مواقيت صلاة في هذا القسم</p>
              <p className="text-white/80">يرجى إضافة مواقيت جديدة باستخدام زر "إضافة موعد جديد"</p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/10 text-right">
                  <th className="p-3 text-white/80 font-medium border-b border-white/10">اليوم/الشهر</th>
                  <th className="p-3 text-white/80 font-medium border-b border-white/10">الفجر (أذان)</th>
                  <th className="p-3 text-white/80 font-medium border-b border-white/10">الفجر (إقامة)</th>
                  <th className="p-3 text-white/80 font-medium border-b border-white/10">الشروق</th>
                  <th className="p-3 text-white/80 font-medium border-b border-white/10">الظهر</th>
                  <th className="p-3 text-white/80 font-medium border-b border-white/10">العصر</th>
                  <th className="p-3 text-white/80 font-medium border-b border-white/10">المغرب</th>
                  <th className="p-3 text-white/80 font-medium border-b border-white/10">العشاء</th>
                  <th className="p-3 text-white/80 font-medium border-b border-white/10">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {prayerTimes.map(prayer => (
                  <tr key={prayer.id} className="hover:bg-white/5 text-right">
                    <td className="p-3 border-b border-white/10">{prayer.day}/{prayer.month}</td>
                    <td className="p-3 border-b border-white/10">{prayer.fajr_first_time}</td>
                    <td className="p-3 border-b border-white/10">{prayer.fajr_second_time}</td>
                    <td className="p-3 border-b border-white/10">{prayer.sunrise_time}</td>
                    <td className="p-3 border-b border-white/10">{prayer.dhuhr_time}</td>
                    <td className="p-3 border-b border-white/10">{prayer.asr_time}</td>
                    <td className="p-3 border-b border-white/10">{prayer.maghrib_time}</td>
                    <td className="p-3 border-b border-white/10">{prayer.isha_time}</td>
                    <td className="p-3 border-b border-white/10">
                      <div className="flex gap-2 justify-end">
                        <button
                          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors text-sm"
                          onClick={() => startEditing(prayer)}
                          disabled={isLoading}
                        >
                          تعديل
                        </button>
                        <button
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors text-sm"
                          onClick={() => handleDeletePrayerTime(prayer.day, prayer.month)}
                          disabled={isLoading}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card view for mobile */}
          <div className="md:hidden space-y-4">
            {prayerTimes.map(prayer => (
              <div key={prayer.id} className="bg-white/5 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-lg">{prayer.day}/{prayer.month}</h4>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors text-sm"
                      onClick={() => startEditing(prayer)}
                      disabled={isLoading}
                    >
                      تعديل
                    </button>
                    <button
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors text-sm"
                      onClick={() => handleDeletePrayerTime(prayer.day, prayer.month)}
                      disabled={isLoading}
                    >
                      حذف
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/10 p-3 rounded">
                    <span className="block opacity-70 mb-1">الفجر (أذان)</span>
                    <span className="text-base">{prayer.fajr_first_time}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded">
                    <span className="block opacity-70 mb-1">الفجر (الثاني)</span>
                    <span className="text-base">{prayer.fajr_second_time}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded">
                    <span className="block opacity-70 mb-1">الشروق</span>
                    <span className="text-base">{prayer.sunrise_time}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded">
                    <span className="block opacity-70 mb-1">الظهر</span>
                    <span className="text-base">{prayer.dhuhr_time}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded">
                    <span className="block opacity-70 mb-1">العصر</span>
                    <span className="text-base">{prayer.asr_time}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded">
                    <span className="block opacity-70 mb-1">المغرب</span>
                    <span className="text-base">{prayer.maghrib_time}</span>
                  </div>
                  <div className="col-span-2 bg-white/10 p-3 rounded">
                    <span className="block opacity-70 mb-1">العشاء</span>
                    <span className="text-base">{prayer.isha_time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={meta.current_page}
                  lastPage={meta.last_page}
                  onPageChange={handlePageChange}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ManagePrayerTimes; 