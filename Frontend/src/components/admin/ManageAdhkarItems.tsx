import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';

// API URL
const API_URL = 'https://islambackend.fly.dev';

// Type definitions
interface Adhkar {
  id: number;
  text: string;
  source: string;
  repeat: number;
  category_id: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdhkarCategory {
  id: number;
  name: string;
  description: string;
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

interface ManageAdhkarItemsProps {
  token?: string;
  onTokenUpdate?: (newToken: string) => void;
  refreshTrigger?: number;
  hideTitle?: boolean;
}

const ManageAdhkarItems: React.FC<ManageAdhkarItemsProps> = ({ 
  token, 
  onTokenUpdate,
  refreshTrigger = 0,
  hideTitle = false
}) => {
  const [adhkarItems, setAdhkarItems] = useState<Adhkar[]>([]);
  const [categories, setCategories] = useState<AdhkarCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Add search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [newAdhkar, setNewAdhkar] = useState({
    text: '',
    source: '',
    repeat: 1,
    category_id: 0,
    active: true
  });

  const [editingAdhkar, setEditingAdhkar] = useState<{
    id: number;
    text: string;
    source: string;
    repeat: number;
    category_id: number;
    active: boolean;
  } | null>(null);

  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    per_page: 10,
    current_page: 1,
    first_page: 1,
    last_page: 1,
    from: 0,
    to: 0
  });

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);

  // Add auth headers to fetch requests
  const getAuthHeaders = (): Record<string, string> => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/adhkar-categories/list`, {
          headers: {
            ...getAuthHeaders()
          }
        });
        
        if (!response.ok) {
          throw new Error('فشل تحميل تصنيفات الأذكار');
        }
        
        const data = await response.json();
        const categoriesList = Array.isArray(data.categories) ? data.categories : [];
        setCategories(categoriesList);
        
        // Set default category if available
        if (categoriesList.length > 0 && newAdhkar.category_id === 0) {
          setNewAdhkar(prev => ({
            ...prev,
            category_id: categoriesList[0].id
          }));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('فشل تحميل تصنيفات الأذكار.');
      }
    };

    fetchCategories();
  }, [token, refreshTrigger]);

  // Fetch adhkar items
  useEffect(() => {
    const fetchAdhkar = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let url;
        
        if (selectedCategoryFilter) {
          url = `${API_URL}/adhkar/category?category_id=${selectedCategoryFilter}&page=${meta.current_page}&per_page=${meta.per_page}`;
        } else {
          url = `${API_URL}/adhkar/list?page=${meta.current_page}&per_page=${meta.per_page}`;
          
          // Add search parameter if searching
          if (isSearching && searchQuery) {
            url += `&q=${encodeURIComponent(searchQuery)}`;
          }
        }
        
        const response = await fetch(url, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error('فشل تحميل الأذكار');
        }
        
        const data = await response.json();
        
        if (!data) {
          console.error('لم يتم استلام بيانات من الخادم');
          setAdhkarItems([]);
          return;
        }
        
        setAdhkarItems(Array.isArray(data.adhkar) ? data.adhkar : []);
        
        if (data.meta) {
          setMeta(data.meta);
        }
      } catch (err) {
        setError('فشل تحميل الأذكار. يرجى المحاولة مرة أخرى في وقت لاحق.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdhkar();
  }, [meta.current_page, token, refreshTrigger, selectedCategoryFilter, isSearching, searchQuery]);

  const handlePageChange = (page: number) => {
    setMeta((prev) => ({ ...prev, current_page: page }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewAdhkar(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'repeat' || name === 'category_id') {
      const numValue = parseInt(value, 10);
      setNewAdhkar(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? (name === 'repeat' ? 1 : 0) : numValue
      }));
    } else {
      setNewAdhkar(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingAdhkar) return;
    
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditingAdhkar(prev => ({
        ...prev!,
        [name]: checked
      }));
    } else if (name === 'repeat' || name === 'category_id') {
      const numValue = parseInt(value, 10);
      setEditingAdhkar(prev => ({
        ...prev!,
        [name]: isNaN(numValue) ? (name === 'repeat' ? 1 : 0) : numValue
      }));
    } else {
      setEditingAdhkar(prev => ({
        ...prev!,
        [name]: value
      }));
    }
  };

  const handleAddAdhkar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('text', newAdhkar.text);
      formData.append('source', newAdhkar.source);
      formData.append('repeat', newAdhkar.repeat.toString());
      formData.append('category_id', newAdhkar.category_id.toString());
      formData.append('active', newAdhkar.active.toString());
      
      const response = await fetch(`${API_URL}/adhkar`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });
      
      // Parse the response
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في إضافة الذكر');
      }
      
      // Check for a new token in the response
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      // Refresh data
      const refreshResponse = await fetch(`${API_URL}/adhkar/list?page=${meta.current_page}&per_page=${meta.per_page}`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setAdhkarItems(Array.isArray(refreshData.adhkar) ? refreshData.adhkar : []);
        
        if (refreshData.meta) {
          setMeta(refreshData.meta);
        }
      }
      
      setSuccess('تم إضافة الذكر بنجاح');
      
      // Reset form
      setNewAdhkar({
        text: '',
        source: '',
        repeat: 1,
        category_id: categories.length > 0 ? categories[0].id : 0,
        active: true
      });
      
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'فشل في إضافة الذكر. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (item: Adhkar) => {
    setEditingAdhkar({
      id: item.id,
      text: item.text,
      source: item.source,
      repeat: item.repeat,
      category_id: item.category_id,
      active: item.active
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleEditAdhkar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdhkar) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('id', editingAdhkar.id.toString());
      formData.append('text', editingAdhkar.text);
      formData.append('source', editingAdhkar.source);
      formData.append('repeat', editingAdhkar.repeat.toString());
      formData.append('category_id', editingAdhkar.category_id.toString());
      
      const response = await fetch(`${API_URL}/adhkar`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });
      
      // Parse the response
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في تحديث الذكر');
      }
      
      // Check for a new token in the response
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      // Refresh data
      const refreshResponse = await fetch(`${API_URL}/adhkar/list?page=${meta.current_page}&per_page=${meta.per_page}`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setAdhkarItems(Array.isArray(refreshData.adhkar) ? refreshData.adhkar : []);
        
        if (refreshData.meta) {
          setMeta(refreshData.meta);
        }
      }
      
      setSuccess('تم تحديث الذكر بنجاح');
      setShowEditForm(false);
      setEditingAdhkar(null);
    } catch (err: any) {
      setError(err.message || 'فشل في تحديث الذكر. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdhkar = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الذكر؟')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/adhkar?id=${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });
      
      // Parse the response
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في حذف الذكر');
      }
      
      // Check for a new token in the response
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      // Refresh data
      const refreshResponse = await fetch(`${API_URL}/adhkar/list?page=${meta.current_page}&per_page=${meta.per_page}`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setAdhkarItems(Array.isArray(refreshData.adhkar) ? refreshData.adhkar : []);
        
        if (refreshData.meta) {
          setMeta(refreshData.meta);
        }
      }
      
      setSuccess('تم حذف الذكر بنجاح');
    } catch (err: any) {
      setError(err.message || 'فشل في حذف الذكر. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActiveStatus = async (id: number, active: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('id', id.toString());
      formData.append('active', (!active).toString());
      
      const response = await fetch(`${API_URL}/adhkar/toggle`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });
      
      // Parse the response
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في تغيير حالة الذكر');
      }
      
      // Check for a new token in the response
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      // Refresh data
      const refreshResponse = await fetch(`${API_URL}/adhkar/list?page=${meta.current_page}&per_page=${meta.per_page}`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setAdhkarItems(Array.isArray(refreshData.adhkar) ? refreshData.adhkar : []);
        
        if (refreshData.meta) {
          setMeta(refreshData.meta);
        }
      }
      
      setSuccess(active ? 'تم تعطيل الذكر بنجاح' : 'تم تفعيل الذكر بنجاح');
    } catch (err: any) {
      setError(err.message || 'فشل في تغيير حالة الذكر. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetCategoryFilter = () => {
    setSelectedCategoryFilter(null);
    setIsSearching(false);
    setSearchQuery('');
    setMeta((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSelectedCategoryFilter(null);
    setMeta((prev) => ({ ...prev, current_page: 1 }));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setMeta((prev) => ({ ...prev, current_page: 1 }));
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'تصنيف غير معروف';
  };

  return (
    <div className="text-white">
      {!hideTitle ? (
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <h2 className="text-xl font-semibold">إدارة الأذكار</h2>
          <div>
            <button
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/40 transition-all duration-300 rounded-lg"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowEditForm(false);
                setNewAdhkar({
                  text: '',
                  source: '',
                  repeat: 1,
                  category_id: categories.length > 0 ? categories[0].id : 0,
                  active: true
                });
              }}
            >
              {showAddForm ? 'إلغاء' : 'إضافة ذكر جديد'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end mb-6">
          <button
            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/40 transition-all duration-300 rounded-lg"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowEditForm(false);
              setNewAdhkar({
                text: '',
                source: '',
                repeat: 1,
                category_id: categories.length > 0 ? categories[0].id : 0,
                active: true
              });
            }}
          >
            {showAddForm ? 'إلغاء' : 'إضافة ذكر جديد'}
          </button>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-white">
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-white">
          {error}
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1">
            <label className="block mb-1">تصفية حسب التصنيف</label>
            <select
              value={selectedCategoryFilter || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : null;
                setSelectedCategoryFilter(value);
                setIsSearching(false);
                setSearchQuery('');
                setMeta((prev) => ({ ...prev, current_page: 1 }));
              }}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {selectedCategoryFilter && (
            <button
              type="button"
              onClick={resetCategoryFilter}
              className="self-end px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg"
            >
              إلغاء التصفية
            </button>
          )}
        </div>
      </div>

      {/* Search Box */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <div className="flex-1">
            <label className="block mb-1">البحث في الأذكار</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن نص أو مصدر..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
              disabled={!!selectedCategoryFilter}
            />
          </div>
          <div className="flex gap-2 self-end">
            <button
              type="submit"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg"
              disabled={!searchQuery || !!selectedCategoryFilter}
            >
              بحث
            </button>
            {isSearching && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg"
              >
                إلغاء البحث
              </button>
            )}
          </div>
        </form>
      </div>

      {showAddForm && (
        <div className="bg-white/5 p-4 rounded-lg mb-6">
          <h4 className="text-md font-medium mb-4">إضافة ذكر جديد</h4>
          <form onSubmit={handleAddAdhkar} className="space-y-4">
            <div>
              <label className="block mb-2 text-white/80">النص:</label>
              <textarea
                name="text"
                value={newAdhkar.text}
                onChange={handleInputChange}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white min-h-[100px]"
                required
              />
            </div>
            
            <div>
              <label className="block mb-2 text-white/80">المصدر:</label>
              <input
                type="text"
                name="source"
                value={newAdhkar.source}
                onChange={handleInputChange}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-white/80">التكرار:</label>
                <input
                  type="number"
                  name="repeat"
                  value={newAdhkar.repeat}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-1">التصنيف *</label>
                <select
                  name="category_id"
                  value={newAdhkar.category_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  required
                >
                  <option value="" disabled>اختر التصنيف</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
          
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? 'جاري الإضافة...' : 'إضافة الذكر'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditForm && editingAdhkar && (
        <div className="bg-white/5 p-4 rounded-lg mb-6">
          <h4 className="text-md font-medium mb-4">تعديل الذكر</h4>
          <form onSubmit={handleEditAdhkar} className="space-y-4">
            <div>
              <label className="block mb-2 text-white/80">النص:</label>
              <textarea
                name="text"
                value={editingAdhkar.text}
                onChange={handleEditInputChange}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white min-h-[100px]"
                required
              />
            </div>
            
            <div>
              <label className="block mb-2 text-white/80">المصدر:</label>
              <input
                type="text"
                name="source"
                value={editingAdhkar.source}
                onChange={handleEditInputChange}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-white/80">التكرار:</label>
                <input
                  type="number"
                  name="repeat"
                  value={editingAdhkar.repeat}
                  onChange={handleEditInputChange}
                  min="1"
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-1">التصنيف *</label>
                <select
                  name="category_id"
                  value={editingAdhkar.category_id}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  required
                >
                  <option value="" disabled>اختر التصنيف</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
         
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? 'جاري التحديث...' : 'تحديث الذكر'}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-lg"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingAdhkar(null);
                }}
              >
                إلغاء التعديل
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && !showAddForm && !showEditForm ? (
        <div className="flex justify-center p-8">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center p-8 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
          <p className="text-white text-lg font-medium mb-2">لا توجد تصنيفات للأذكار</p>
          <p className="text-white/80">يرجى إضافة تصنيف جديد أولاً قبل إدارة الأذكار</p>
        </div>
      ) : adhkarItems.length === 0 ? (
        <div className="text-center p-8 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <p className="text-white text-lg font-medium mb-2">لا توجد أذكار</p>
          <p className="text-white/80">يرجى إضافة ذكر جديد</p>
        </div>
      ) : (
        <>
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto bg-white/5 rounded-lg">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white/10 text-right">
                  <th className="p-3">المعرف</th>
                  <th className="p-3">النص</th>
                  <th className="p-3">المصدر</th>
                  <th className="p-3">التكرار</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {adhkarItems.map(item => (
                  <tr key={item.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="p-3">{item.id}</td>
                    <td className="p-3">
                      <div>
                        {item.text}
                      </div>
                    </td>
                    <td className="p-3">{item.source}</td>
                    <td className="p-3">{item.repeat}</td>
                    <td className="p-3">{getCategoryName(item.category_id)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors"
                          disabled={isLoading}
                          onClick={() => startEditing(item)}
                        >
                          تعديل
                        </button>
                        <button
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors"
                          disabled={isLoading}
                          onClick={() => handleDeleteAdhkar(item.id)}
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

          {/* Mobile view */}
          <div className="md:hidden space-y-4">
            {adhkarItems.map(item => (
              <div key={item.id} className="bg-white/5 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold">#{item.id}</h4>
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors text-xs"
                      disabled={isLoading}
                      onClick={() => startEditing(item)}
                    >
                      تعديل
                    </button>
                    <button
                      className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors text-xs"
                      disabled={isLoading}
                      onClick={() => handleDeleteAdhkar(item.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="bg-white/10 p-2 rounded">
                    <span className="block opacity-70 mb-1">النص:</span>
                    <div>{item.text}</div>
                  </div>
                  <div className="bg-white/10 p-2 rounded">
                    <span className="block opacity-70">المصدر:</span>
                    <span>{item.source}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/10 p-2 rounded">
                      <span className="block opacity-70">التكرار:</span>
                      <span>{item.repeat}</span>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <span className="block opacity-70">التصنيف:</span>
                      <span>{getCategoryName(item.category_id)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              onPageChange={handlePageChange}
              disabled={isLoading}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ManageAdhkarItems; 