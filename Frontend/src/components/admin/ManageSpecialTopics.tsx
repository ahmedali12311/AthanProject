import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';

// API URL
const API_URL = 'https://islambackend.fly.dev';

// Type definitions
interface SpecialTopic {
  id: number;
  topic: string;
  content: string;
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

interface ManageSpecialTopicsProps {
  token?: string;
  onTokenUpdate?: (newToken: string) => void;
}

const ManageSpecialTopics: React.FC<ManageSpecialTopicsProps> = ({ token, onTokenUpdate }) => {
  const [specialTopics, setSpecialTopics] = useState<SpecialTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const [newSpecialTopic, setNewSpecialTopic] = useState({
    topic: '',
    content: ''
  });
  
  const [editingSpecialTopic, setEditingSpecialTopic] = useState<{
    id: number;
    topic: string;
    content: string;
  } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  // Fetch special topics when page changes or search is triggered
  useEffect(() => {
    const fetchSpecialTopics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let url = `${API_URL}/special-topics/list?page=${meta.current_page}&per_page=${meta.per_page}`;
        if (isSearching && searchQuery) {
          url += `&q=${encodeURIComponent(searchQuery)}`;
        }
        
        const response = await fetch(url, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error('فشل تحميل المواضيع الخاصة');
        }
        
        const data = await response.json();
        setSpecialTopics(Array.isArray(data.specialTopics) ? data.specialTopics : []);
        if (data.metadata) {
          setMeta(data.metadata);
        }
      } catch (err) {
        setError('فشل تحميل المواضيع الخاصة. يرجى المحاولة مرة أخرى في وقت لاحق.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpecialTopics();
  }, [meta.current_page, isSearching, searchQuery, token]);

  const handlePageChange = (page: number) => {
    setMeta((prev) => ({ ...prev, current_page: page }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setMeta((prev) => ({ ...prev, current_page: 1 }));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setMeta((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSpecialTopic(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingSpecialTopic) return;
    const { name, value } = e.target;
    setEditingSpecialTopic(prev => ({
      ...prev!,
      [name]: value
    }));
  };

  const handleAddSpecialTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData = new FormData();
      formData.append('topic', newSpecialTopic.topic);
      formData.append('content', newSpecialTopic.content);
      
      const response = await fetch(`${API_URL}/special-topics`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في إضافة الموضوع الخاص');
      }
      
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      await refreshSpecialTopicsList();
      setSuccess('تم إضافة الموضوع الخاص بنجاح');
      setNewSpecialTopic({ topic: '', content: '' });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'فشل في إضافة الموضوع الخاص. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSpecialTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecialTopic) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData = new FormData();
      formData.append('id', editingSpecialTopic.id.toString());
      formData.append('topic', editingSpecialTopic.topic);
      formData.append('content', editingSpecialTopic.content);
      
      const response = await fetch(`${API_URL}/special-topics`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: formData
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في تحديث الموضوع الخاص');
      }
      
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      await refreshSpecialTopicsList();
      setSuccess('تم تحديث الموضوع الخاص بنجاح');
      setEditingSpecialTopic(null);
      setShowEditForm(false);
    } catch (err: any) {
      setError(err.message || 'فشل في تحديث الموضوع الخاص. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (topic: SpecialTopic) => {
    setEditingSpecialTopic({
      id: topic.id,
      topic: topic.topic,
      content: topic.content
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleDeleteSpecialTopic = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموضوع الخاص؟')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/special-topics?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في حذف الموضوع الخاص');
      }
      
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      await refreshSpecialTopicsList();
      setSuccess('تم حذف الموضوع الخاص بنجاح');
    } catch (err: any) {
      setError(err.message || 'فشل في حذف الموضوع الخاص. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSpecialTopicsList = async () => {
    try {
      setIsLoading(true);
      let url = `${API_URL}/special-topics/list?page=${meta.current_page}&per_page=${meta.per_page}`;
      if (isSearching && searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث قائمة المواضيع الخاصة');
      }
      
      const data = await response.json();
      setSpecialTopics(Array.isArray(data.specialTopics) ? data.specialTopics : []);
      if (data.metadata) {
        setMeta(data.metadata);
      }
    } catch (err) {
      console.error('فشل في تحديث قائمة المواضيع الخاصة:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-white max-w-full">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold">إدارة المواضيع الخاصة</h2>
        <button
          className="px-4 py-2 bg-gradient-to-r from-green-500/70 to-emerald-600/70 hover:from-green-500/90 hover:to-emerald-600/90 text-white rounded-lg transition-all duration-300 shadow-md"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowEditForm(false);
            setEditingSpecialTopic(null);
          }}
        >
          {showAddForm ? 'إلغاء' : 'إضافة موضوع خاص جديد'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/30 border border-red-500/50 text-white p-4 rounded-lg mb-6 animate-fade-in">
          <div className="flex items-center">
            <span className="text-red-200 mr-2">⚠</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/30 border border-green-500/50 text-white p-4 rounded-lg mb-6 animate-fade-in">
          <div className="flex items-center">
            <span className="text-green-200 mr-2">✔</span>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Search Box */}
      <div className="mb-6 bg-white/5 p-4 rounded-lg shadow-md border border-white/10 backdrop-blur-sm">
        <h3 className="text-lg font-medium mb-4 text-white/90">بحث عن المواضيع الخاصة</h3>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="أدخل كلمات للبحث في الموضوع أو المحتوى..."
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2 sm:self-start">
            <button
              type="submit"
              className="px-4 py-3 bg-blue-500/70 hover:bg-blue-500/90 text-white rounded-lg transition-all duration-300 flex-1 sm:flex-initial"
              disabled={isLoading || !searchQuery.trim()}
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
        {isSearching && searchQuery && (
          <div className="mt-4 text-sm text-white/70 p-3 bg-white/10 rounded-lg border border-white/10">
            <div className="flex items-center">
              <span className="text-blue-300 mr-2">🔍</span>
              <p>نتائج البحث عن: <span className="font-bold">{searchQuery}</span></p>
            </div>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white/5 p-5 rounded-lg mb-6 border border-white/10 shadow-lg backdrop-blur-sm animate-fade-in">
          <h3 className="text-xl font-medium mb-5 text-white/90 border-b border-white/10 pb-2">إضافة موضوع خاص جديد</h3>
          <form onSubmit={handleAddSpecialTopic} className="space-y-5">
            <div>
              <label className="block mb-2 text-white/90 font-medium">الموضوع:</label>
              <input
                type="text"
                name="topic"
                value={newSpecialTopic.topic}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                required
                placeholder="أدخل موضوع الموضوع الخاص..."
              />
            </div>
            <div>
              <label className="block mb-2 text-white/90 font-medium">المحتوى:</label>
              <textarea
                name="content"
                value={newSpecialTopic.content}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white min-h-[120px] focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                required
                placeholder="أدخل محتوى الموضوع الخاص..."
              />
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
                  'إضافة الموضوع الخاص'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditForm && editingSpecialTopic && (
        <div className="bg-white/5 p-5 rounded-lg mb-6 border border-white/10 shadow-lg backdrop-blur-sm animate-fade-in">
          <h3 className="text-xl font-medium mb-5 text-white/90 border-b border-white/10 pb-2">تعديل الموضوع الخاص</h3>
          <form onSubmit={handleEditSpecialTopic} className="space-y-5">
            <div>
              <label className="block mb-2 text-white/90 font-medium">الموضوع:</label>
              <input
                type="text"
                name="topic"
                value={editingSpecialTopic.topic}
                onChange={handleEditInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-white/90 font-medium">المحتوى:</label>
              <textarea
                name="content"
                value={editingSpecialTopic.content}
                onChange={handleEditInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white min-h-[120px] focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                required
              />
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
                  'تحديث الموضوع الخاص'
                )}
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 flex-1"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingSpecialTopic(null);
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
          <p className="text-white/70">جاري تحميل المواضيع الخاصة...</p>
        </div>
      ) : specialTopics.length === 0 ? (
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
                <p className="text-white/80">لم يتم العثور على مواضيع خاصة تطابق معايير البحث</p>
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
                <p className="text-white text-xl font-semibold mb-2">لا توجد مواضيع خاصة</p>
                <p className="text-white/80">يرجى إضافة مواضيع خاصة جديدة باستخدام زر "إضافة موضوع خاص جديد"</p>
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
                  <th className="p-4 font-semibold text-white/80">الموضوع</th>
                  <th className="p-4 font-semibold text-white/80">المحتوى</th>
                  <th className="p-4 font-semibold text-white/80">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {specialTopics.map(topic => (
                  <tr key={topic.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-center">{topic.id}</td>
                    <td className="p-4">{topic.topic}</td>
                    <td className="p-4">
                      <div className="line-clamp-3">{topic.content}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors flex items-center"
                          onClick={() => startEditing(topic)}
                          disabled={isLoading}
                        >
                          <span className="mr-1">✎</span>
                          تعديل
                        </button>
                        <button
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors flex items-center"
                          onClick={() => handleDeleteSpecialTopic(topic.id)}
                          disabled={isLoading}
                        >
                          <span className="mr-1">✖</span>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-4">
            {specialTopics.map(topic => (
              <div key={topic.id} className="bg-white/5 p-4 rounded-lg shadow-md border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                  <div className="flex items-center">
                    <span className="bg-white/10 px-2 py-1 rounded-full text-sm font-medium">#{topic.id}</span>
                    <span className="mx-2 text-white/50">|</span>
                    <span className="text-white/80 text-sm">{new Date(topic.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors text-xs"
                      onClick={() => startEditing(topic)}
                      disabled={isLoading}
                      aria-label="تعديل"
                    >
                      ✎
                    </button>
                    <button
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors text-xs"
                      onClick={() => handleDeleteSpecialTopic(topic.id)}
                      disabled={isLoading}
                      aria-label="حذف"
                    >
                      ✖
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <span className="block text-white/70 mb-1 text-sm font-medium">الموضوع:</span>
                    <div className="text-white">{topic.topic}</div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <span className="block text-white/70 mb-1 text-sm font-medium">المحتوى:</span>
                    <div className="text-white">{topic.content}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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

export default ManageSpecialTopics;