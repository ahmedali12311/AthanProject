import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';

// API URL
const API_URL = 'https://islambackend.fly.dev';

// Type definitions
interface Hadith {
  id: number;
  text: string;
  source: string;
  topic: string;
  created_at: string;
  updated_at: string;
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

interface ManageHadithsProps {
  token?: string;
  onTokenUpdate?: (newToken: string) => void;
}

const ManageHadiths: React.FC<ManageHadithsProps> = ({ token, onTokenUpdate }) => {
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const [newHadith, setNewHadith] = useState({
    text: '',
    source: '',
    topic: ''
  });
  
  const [editingHadith, setEditingHadith] = useState<{
    id: number;
    text: string;
    source: string;
    topic: string;
  } | null>(null);
  
  const [searchTopic, setSearchTopic] = useState<string>('');
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

  // Fetch hadiths when page changes or search is triggered
  useEffect(() => {
    const fetchHadiths = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let url = `${API_URL}/hadiths/list?page=${meta.current_page}&per_page=${meta.per_page}`;
        
        // Add search query parameter if searching
        if (isSearching && searchTopic) {
          url += `&q=${encodeURIComponent(searchTopic)}`;
        }
        
        const response = await fetch(url, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error('فشل تحميل الأحاديث');
        }
        
        const data = await response.json();
        
        // Safe check for data structure
        if (!data) {
          console.error('لم يتم استلام بيانات من الخادم');
          setHadiths([]);
          return;
        }
        
        // Handle hadiths array
        setHadiths(Array.isArray(data.hadiths) ? data.hadiths : []);
        
        // Update pagination meta
        if (data.meta) {
          setMeta(data.meta);
        }
      } catch (err) {
        setError('فشل تحميل الأحاديث. يرجى المحاولة مرة أخرى في وقت لاحق.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHadiths();
  }, [meta.current_page, isSearching, searchTopic, token]);

  const handlePageChange = (page: number) => {
    setMeta((prev) => ({ ...prev, current_page: page }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setMeta((prev) => ({ ...prev, current_page: 1 }));
  };

  const clearSearch = () => {
    setSearchTopic('');
    setIsSearching(false);
    setMeta((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewHadith(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingHadith) return;
    
    const { name, value } = e.target;
    setEditingHadith(prev => ({
      ...prev!,
      [name]: value
    }));
  };

  const handleAddHadith = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('text', newHadith.text);
      formData.append('source', newHadith.source);
      formData.append('topic', newHadith.topic);
      
      const response = await fetch(`${API_URL}/hadiths`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });
      
      // Parse the response
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في إضافة الحديث');
      }
      
      // Check for a new token in the response
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      // Refresh data
      await refreshHadithsList();
      
      setSuccess('تم إضافة الحديث بنجاح');
      setNewHadith({ text: '', source: '', topic: '' });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'فشل في إضافة الحديث. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditHadith = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHadith) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('id', editingHadith.id.toString());
      formData.append('text', editingHadith.text);
      formData.append('source', editingHadith.source);
      formData.append('topic', editingHadith.topic);
      
      const response = await fetch(`${API_URL}/hadiths`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });
      
      // Parse the response
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في تحديث الحديث');
      }
      
      // Check for a new token in the response
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      // Refresh data
      await refreshHadithsList();
      
      setSuccess('تم تحديث الحديث بنجاح');
      setEditingHadith(null);
      setShowEditForm(false);
    } catch (err: any) {
      setError(err.message || 'فشل في تحديث الحديث. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (hadith: Hadith) => {
    setEditingHadith({
      id: hadith.id,
      text: hadith.text,
      source: hadith.source,
      topic: hadith.topic
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleDeleteHadith = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحديث؟')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/hadiths?id=${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });
      
      // Parse the response
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في حذف الحديث');
      }
      
      // Check for a new token in the response
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      // Refresh data
      await refreshHadithsList();
      
      setSuccess('تم حذف الحديث بنجاح');
    } catch (err: any) {
      setError(err.message || 'فشل في حذف الحديث. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHadithsList = async () => {
    try {
      setIsLoading(true);
      
      let url = `${API_URL}/hadiths/list?page=${meta.current_page}&per_page=${meta.per_page}`;
      
      // Add search query parameter if searching
      if (isSearching && searchTopic) {
        url += `&q=${encodeURIComponent(searchTopic)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث قائمة الأحاديث');
      }
      
      const data = await response.json();
      
      setHadiths(Array.isArray(data.hadiths) ? data.hadiths : []);
      
      if (data.meta) {
        setMeta(data.meta);
      }
    } catch (err) {
      console.error('فشل في تحديث قائمة الأحاديث:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-white max-w-full">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold">إدارة الأحاديث</h2>
        <button
          className="px-4 py-2 bg-gradient-to-r from-green-500/70 to-emerald-600/70 hover:from-green-500/90 hover:to-emerald-600/90 text-white rounded-lg transition-all duration-300 shadow-md"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowEditForm(false);
            setEditingHadith(null);
          }}
        >
          {showAddForm ? 'إلغاء' : 'إضافة حديث جديد'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/30 border border-red-500/50 text-white p-4 rounded-lg mb-6 animate-fade-in">
          <div className="flex items-center">
            <span className="text-red-200 mr-2">&#9888;</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/30 border border-green-500/50 text-white p-4 rounded-lg mb-6 animate-fade-in">
          <div className="flex items-center">
            <span className="text-green-200 mr-2">&#10004;</span>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Search Box - Always visible */}
      <div className="mb-6 bg-white/5 p-4 rounded-lg shadow-md border border-white/10 backdrop-blur-sm">
        <h3 className="text-lg font-medium mb-4 text-white/90">بحث عن الأحاديث</h3>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1">
            <input
              type="text"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              placeholder="أدخل كلمات للبحث في النص، المصدر، الموضوع..."
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex gap-2 sm:self-start">
            <button
              type="submit"
              className="px-4 py-3 bg-blue-500/70 hover:bg-blue-500/90 text-white rounded-lg transition-all duration-300 flex-1 sm:flex-initial"
              disabled={isLoading || !searchTopic.trim()}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                  جاري البحث...
                </span>
              ) : (
                'بحث'
              )}
            </button>
            
            {isSearching && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-4 py-3 bg-gray-500/50 hover:bg-gray-500/70 text-white rounded-lg transition-all duration-300 flex-1 sm:flex-initial"
                disabled={isLoading}
              >
                إلغاء البحث
              </button>
            )}
          </div>
        </form>
        
        {isSearching && searchTopic && (
          <div className="mt-4 text-sm text-white/70 p-3 bg-white/10 rounded-lg border border-white/10">
            <div className="flex items-center">
              <span className="text-blue-300 mr-2">&#128269;</span>
              <p>نتائج البحث عن: <span className="font-bold">{searchTopic}</span></p>
            </div>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white/5 p-5 rounded-lg mb-6 border border-white/10 shadow-lg backdrop-blur-sm animate-fade-in">
          <h3 className="text-xl font-medium mb-5 text-white/90 border-b border-white/10 pb-2">إضافة حديث جديد</h3>
          <form onSubmit={handleAddHadith} className="space-y-5">
            <div>
              <label className="block mb-2 text-white/90 font-medium">نص الحديث:</label>
              <textarea
                name="text"
                value={newHadith.text}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white min-h-[120px] focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                required
                placeholder="أدخل نص الحديث هنا..."
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-white/90 font-medium">المصدر:</label>
                <input
                  type="text"
                  name="source"
                  value={newHadith.source}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                  required
                  placeholder="أدخل مصدر الحديث..."
                />
              </div>
              
              <div>
                <label className="block mb-2 text-white/90 font-medium">الموضوع:</label>
                <input
                  type="text"
                  name="topic"
                  value={newHadith.topic}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                  required
                  placeholder="أدخل موضوع الحديث..."
                />
              </div>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-green-500/70 to-emerald-600/70 hover:from-green-500/90 hover:to-emerald-600/90 text-white rounded-lg transition-all duration-300 shadow-md w-full sm:w-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                    جاري الإضافة...
                  </span>
                ) : (
                  'إضافة الحديث'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditForm && editingHadith && (
        <div className="bg-white/5 p-5 rounded-lg mb-6 border border-white/10 shadow-lg backdrop-blur-sm animate-fade-in">
          <h3 className="text-xl font-medium mb-5 text-white/90 border-b border-white/10 pb-2">تعديل الحديث</h3>
          <form onSubmit={handleEditHadith} className="space-y-5">
            <div>
              <label className="block mb-2 text-white/90 font-medium">نص الحديث:</label>
              <textarea
                name="text"
                value={editingHadith.text}
                onChange={handleEditInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white min-h-[120px] focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-white/90 font-medium">المصدر:</label>
                <input
                  type="text"
                  name="source"
                  value={editingHadith.source}
                  onChange={handleEditInputChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 text-white/90 font-medium">الموضوع:</label>
                <input
                  type="text"
                  name="topic"
                  value={editingHadith.topic}
                  onChange={handleEditInputChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-500/70 to-blue-600/70 hover:from-blue-500/90 hover:to-blue-600/90 text-white rounded-lg transition-all duration-300 shadow-md flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                    جاري التحديث...
                  </span>
                ) : (
                  'تحديث الحديث'
                )}
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 flex-1"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingHadith(null);
                }}
              >
                إلغاء التعديل
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && !showAddForm && !showEditForm ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white/70">جاري تحميل الأحاديث...</p>
        </div>
      ) : hadiths.length === 0 ? (
        <div className="text-center p-8 bg-blue-500/20 rounded-lg border border-blue-500/30 shadow-md">
          {isSearching ? (
            <>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 text-blue-300 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-white text-xl font-semibold mb-2">لا توجد نتائج للبحث</p>
                <p className="text-white/80">لم يتم العثور على أحاديث تطابق معايير البحث</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 text-blue-300 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-white text-xl font-semibold mb-2">لا توجد أحاديث</p>
                <p className="text-white/80">يرجى إضافة أحاديث جديدة باستخدام زر "إضافة حديث جديد"</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto bg-white/5 rounded-lg shadow-md border border-white/10 backdrop-blur-sm">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white/10 text-right border-b border-white/10">
                  <th className="p-4 font-semibold text-white/80">المعرف</th>
                  <th className="p-4 font-semibold text-white/80">نص الحديث</th>
                  <th className="p-4 font-semibold text-white/80">المصدر</th>
                  <th className="p-4 font-semibold text-white/80">الموضوع</th>
                  <th className="p-4 font-semibold text-white/80">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {hadiths.map(hadith => (
                  <tr key={hadith.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-center">{hadith.id}</td>
                    <td className="p-4">
                      <div className="line-clamp-3">{hadith.text}</div>
                    </td>
                    <td className="p-4">{hadith.source}</td>
                    <td className="p-4">{hadith.topic}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors flex items-center"
                          onClick={() => startEditing(hadith)}
                          disabled={isLoading}
                        >
                          <span className="mr-1">&#9998;</span>
                          تعديل
                        </button>
                        <button
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors flex items-center"
                          onClick={() => handleDeleteHadith(hadith.id)}
                          disabled={isLoading}
                        >
                          <span className="mr-1">&#10006;</span>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view - Enhanced card design */}
          <div className="md:hidden space-y-4">
            {hadiths.map(hadith => (
              <div key={hadith.id} className="bg-white/5 p-4 rounded-lg shadow-md border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                  <div className="flex items-center">
                    <span className="bg-white/10 px-2 py-1 rounded-full text-sm font-medium">#{hadith.id}</span>
                    <span className="mx-2 text-white/50">|</span>
                    <span className="text-white/80 text-sm">{new Date(hadith.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors text-xs"
                      onClick={() => startEditing(hadith)}
                      disabled={isLoading}
                      aria-label="تعديل"
                    >
                      &#9998;
                    </button>
                    <button
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors text-xs"
                      onClick={() => handleDeleteHadith(hadith.id)}
                      disabled={isLoading}
                      aria-label="حذف"
                    >
                      &#10006;
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <span className="block text-white/70 mb-1 text-sm font-medium">نص الحديث:</span>
                    <div className="text-white">{hadith.text}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 p-3 rounded-lg">
                      <span className="block text-white/70 mb-1 text-sm font-medium">المصدر:</span>
                      <span className="text-white">{hadith.source}</span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg">
                      <span className="block text-white/70 mb-1 text-sm font-medium">الموضوع:</span>
                      <span className="text-white">{hadith.topic}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Improved Pagination */}
          <div className="mt-8 flex justify-center">
            <div className="bg-white/5 rounded-lg p-1 shadow-md border border-white/10 backdrop-blur-sm">
              <Pagination
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                onPageChange={handlePageChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-center text-white/60 text-sm">
            إجمالي النتائج: {meta.total} | عرض {meta.from} - {meta.to}
          </div>
        </>
      )}
    </div>
  );
};

export default ManageHadiths; 