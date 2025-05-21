import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';

// API URL
const API_URL = 'https://islambackend.fly.dev';

// Type definitions
interface AdhkarCategory {
  id: number;
  name: string;
  description: string;
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

interface ManageAdhkarCategoriesProps {
  token?: string;
  onTokenUpdate?: (newToken: string) => void;
  onCategoryChange?: () => void;
  hideTitle?: boolean;
}

const ManageAdhkarCategories: React.FC<ManageAdhkarCategoriesProps> = ({ 
  token, 
  onTokenUpdate, 
  onCategoryChange,
  hideTitle = false
}) => {
  const [categories, setCategories] = useState<AdhkarCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Add search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  
  const [editingCategory, setEditingCategory] = useState<{
    id: number;
    name: string;
    description: string;
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

  // Add auth headers to fetch requests
  const getAuthHeaders = (): Record<string, string> => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Fetch categories when page changes or search is performed
  useEffect(() => {
    fetchCategories();
  }, [meta.current_page, token, isSearching, searchQuery]);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = `${API_URL}/adhkar-categories/list?page=${meta.current_page}&per_page=${meta.per_page}`;
      
      // Add search parameter if searching
      if (isSearching && searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل تحميل تصنيفات الأذكار');
      }
      
      const data = await response.json();
      
      // Safe check for data structure
      if (!data) {
        console.error('لم يتم استلام بيانات من الخادم');
        setCategories([]);
        return;
      }
      
      // Handle categories array
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      
      // Update pagination meta
      if (data.meta) {
        setMeta(data.meta);
      }
    } catch (err) {
      setError('فشل تحميل تصنيفات الأذكار. يرجى المحاولة مرة أخرى في وقت لاحق.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
    setNewCategory(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingCategory) return;
    
    const { name, value } = e.target;
    setEditingCategory(prev => ({
      ...prev!,
      [name]: value
    }));
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('name', newCategory.name);
      formData.append('description', newCategory.description || '');
      
      const response = await fetch(`${API_URL}/adhkar-categories`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });
      
      // Parse the response
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في إضافة تصنيف الأذكار');
      }
      
      // Check for a new token in the response
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      // Refresh data
      await fetchCategories();
      if (onCategoryChange) onCategoryChange();
      
      setSuccess('تم إضافة تصنيف الأذكار بنجاح');
      setNewCategory({ name: '', description: '' });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'فشل في إضافة تصنيف الأذكار. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('id', editingCategory.id.toString());
      formData.append('name', editingCategory.name);
      formData.append('description', editingCategory.description || '');
      
      const response = await fetch(`${API_URL}/adhkar-categories`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });
      
      // Parse the response
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في تحديث تصنيف الأذكار');
      }
      
      // Check for a new token in the response
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      // Refresh data
      await fetchCategories();
      if (onCategoryChange) onCategoryChange();
      
      setSuccess('تم تحديث تصنيف الأذكار بنجاح');
      setEditingCategory(null);
      setShowEditForm(false);
    } catch (err: any) {
      setError(err.message || 'فشل في تحديث تصنيف الأذكار. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (category: AdhkarCategory) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      description: category.description
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التصنيف؟ سيتم حذف جميع الأذكار المرتبطة به.')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/adhkar-categories?id=${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });
      
      // Parse the response
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في حذف تصنيف الأذكار');
      }
      
      // Check for a new token in the response
      if (responseData.token && onTokenUpdate) {
        localStorage.setItem('authToken', responseData.token);
        onTokenUpdate(responseData.token);
      }
      
      // Refresh data
      await fetchCategories();
      if (onCategoryChange) onCategoryChange();
      
      setSuccess('تم حذف تصنيف الأذكار بنجاح');
    } catch (err: any) {
      const message = err.message || 'فشل في حذف تصنيف الأذكار.';
      setError(message.includes('مستخدم في أذكار') ? 'لا يمكن حذف التصنيف لأنه مستخدم في أذكار.' : message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-white max-w-full">
      {!hideTitle && (
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <h3 className="text-2xl font-bold">إدارة تصنيفات الأذكار</h3>
          <button
            className="px-4 py-2 bg-gradient-to-r from-green-500/70 to-emerald-600/70 hover:from-green-500/90 hover:to-emerald-600/90 text-white rounded-lg transition-all duration-300 shadow-md"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowEditForm(false);
              setEditingCategory(null);
            }}
          >
            {showAddForm ? 'إلغاء' : 'إضافة تصنيف جديد'}
          </button>
        </div>
      )}

      {hideTitle && (
        <div className="flex justify-end mb-6">
          <button
            className="px-4 py-2 bg-gradient-to-r from-green-500/70 to-emerald-600/70 hover:from-green-500/90 hover:to-emerald-600/90 text-white rounded-lg transition-all duration-300 shadow-md"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowEditForm(false);
              setEditingCategory(null);
            }}
          >
            {showAddForm ? 'إلغاء' : 'إضافة تصنيف جديد'}
          </button>
        </div>
      )}

      {/* Search Box */}
      <div className="mb-6 bg-white/5 p-4 rounded-lg shadow-md border border-white/10 backdrop-blur-sm">
        <h3 className="text-lg font-medium mb-4 text-white/90">البحث في التصنيفات</h3>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن اسم أو وصف..."
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2 sm:self-start">
            <button
              type="submit"
              className="px-4 py-3 bg-blue-500/70 hover:bg-blue-500/90 text-white rounded-lg transition-all duration-300 flex-1 sm:flex-initial"
              disabled={!searchQuery.trim() || isLoading}
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
              <span className="text-blue-300 mr-2">&#128269;</span>
              <p>نتائج البحث عن: <span className="font-bold">{searchQuery}</span></p>
            </div>
          </div>
        )}
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

      {showAddForm && (
        <div className="bg-white/5 p-5 rounded-lg mb-6 border border-white/10 shadow-lg backdrop-blur-sm animate-fade-in">
          <h4 className="text-xl font-medium mb-5 text-white/90 border-b border-white/10 pb-2">إضافة تصنيف جديد</h4>
          <form onSubmit={handleAddCategory} className="space-y-5">
            <div>
              <label className="block mb-2 text-white/90 font-medium">الاسم:</label>
              <input
                type="text"
                name="name"
                value={newCategory.name}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                required
                maxLength={50}
                placeholder="أدخل اسم التصنيف..."
              />
            </div>
            
            <div>
              <label className="block mb-2 text-white/90 font-medium">الوصف:</label>
              <textarea
                name="description"
                value={newCategory.description}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white min-h-[100px] focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                rows={3}
                placeholder="أدخل وصف التصنيف هنا..."
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
                  'إضافة التصنيف'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditForm && editingCategory && (
        <div className="bg-white/5 p-5 rounded-lg mb-6 border border-white/10 shadow-lg backdrop-blur-sm animate-fade-in">
          <h4 className="text-xl font-medium mb-5 text-white/90 border-b border-white/10 pb-2">تعديل التصنيف</h4>
          <form onSubmit={handleEditCategory} className="space-y-5">
            <div>
              <label className="block mb-2 text-white/90 font-medium">الاسم:</label>
              <input
                type="text"
                name="name"
                value={editingCategory.name}
                onChange={handleEditInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                required
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="block mb-2 text-white/90 font-medium">الوصف:</label>
              <textarea
                name="description"
                value={editingCategory.description}
                onChange={handleEditInputChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white min-h-[100px] focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                rows={3}
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
                  'تحديث التصنيف'
                )}
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 flex-1"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingCategory(null);
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
          <p className="text-white/70">جاري تحميل التصنيفات...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center p-8 bg-blue-500/20 rounded-lg border border-blue-500/30 shadow-md">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 text-blue-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-white text-xl font-semibold mb-2">لا توجد تصنيفات</p>
            <p className="text-white/80">يرجى إضافة تصنيف جديد باستخدام زر "إضافة تصنيف جديد"</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto bg-white/5 rounded-lg shadow-md border border-white/10 backdrop-blur-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/10 text-right border-b border-white/10">
                  <th className="p-4 font-semibold text-white/80">المعرف</th>
                  <th className="p-4 font-semibold text-white/80">الاسم</th>
                  <th className="p-4 font-semibold text-white/80">الوصف</th>
                  <th className="p-4 font-semibold text-white/80">تاريخ الإنشاء</th>
                  <th className="p-4 font-semibold text-white/80">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-center">{category.id}</td>
                    <td className="p-4">{category.name}</td>
                    <td className="p-4">{category.description || '-'}</td>
                    <td className="p-4 text-center">{new Date(category.created_at).toLocaleString('ar-SA')}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors flex items-center"
                          onClick={() => startEditing(category)}
                          disabled={isLoading}
                        >
                          <span className="mr-1">&#9998;</span>
                          تعديل
                        </button>
                        <button
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors flex items-center"
                          onClick={() => handleDeleteCategory(category.id)}
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

          {/* Mobile view */}
          <div className="md:hidden space-y-4">
            {categories.map(category => (
              <div key={category.id} className="bg-white/5 p-4 rounded-lg shadow-md border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                  <div className="flex items-center">
                    <span className="bg-white/10 px-2 py-1 rounded-full text-sm font-medium">#{category.id}</span>
                    <span className="mx-2 text-white/50">|</span>
                    <h4 className="font-bold truncate max-w-[150px]">{category.name}</h4>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors text-xs"
                      onClick={() => startEditing(category)}
                      disabled={isLoading}
                      aria-label="تعديل"
                    >
                      &#9998;
                    </button>
                    <button
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors text-xs"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={isLoading}
                      aria-label="حذف"
                    >
                      &#10006;
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {category.description && (
                    <div className="bg-white/10 p-3 rounded-lg">
                      <span className="block text-white/70 mb-1 text-sm font-medium">الوصف:</span>
                      <span className="text-white">{category.description}</span>
                    </div>
                  )}
                  <div className="bg-white/10 p-3 rounded-lg">
                    <span className="block text-white/70 mb-1 text-sm font-medium">تاريخ الإنشاء:</span>
                    <span className="text-white">{new Date(category.created_at).toLocaleString('ar-SA')}</span>
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

export default ManageAdhkarCategories; 