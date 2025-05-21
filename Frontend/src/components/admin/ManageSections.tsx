import React, { useState, useEffect } from 'react';

// API URL
const API_URL = 'https://islambackend.fly.dev';

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

interface ManageSectionsProps {
  token?: string;
  onTokenUpdate?: (newToken: string) => void;
}

const ManageSections: React.FC<ManageSectionsProps> = ({ token, onTokenUpdate }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  
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

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `${API_URL}/sections/list?page=${meta.current_page}&per_page=${meta.per_page}`,
          {
            headers: getAuthHeaders()
          }
        );
        
        if (!response.ok) {
          throw new Error('فشل في تحميل الأقسام');
        }
        
        const data = await response.json();
        setSections(data.sections);
        setMeta(data.meta);
      } catch (err) {
        setError('فشل في تحميل الأقسام. يرجى المحاولة مرة أخرى لاحقًا.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, [meta.current_page, token]);

  const handlePageChange = (page: number) => {
    setMeta((prev) => ({ ...prev, current_page: page }));
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('name', newSectionName);
      
      const response = await fetch(`${API_URL}/sections`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      
      // Parse the response as JSON
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في إضافة القسم');
      }
      
      // Check for a new token in the response
      console.log('Add section response:', responseData);
      
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
      await refreshSectionsList();
      
      setSuccess('تمت إضافة القسم بنجاح');
      setNewSectionName('');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'فشل في إضافة القسم. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSectionId) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('name', editingSectionName);
      
      const response = await fetch(`${API_URL}/sections/${editingSectionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: formData
      });
      
      // Parse the response as JSON
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في تحديث القسم');
      }
      
      // Check for a new token in the response
      console.log('Edit section response:', responseData);
      
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
      await refreshSectionsList();
      
      setSuccess('تم تحديث القسم بنجاح');
      setShowEditForm(false);
      setEditingSectionId(null);
      setEditingSectionName('');
    } catch (err: any) {
      setError(err.message || 'فشل في تحديث القسم. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (section: Section) => {
    setEditingSectionId(section.id);
    setEditingSectionName(section.name);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleDeleteSection = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/sections/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );
      
      // Parse the response as JSON
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'فشل في حذف القسم');
      }
      
      // Check for a new token in the response
      console.log('Delete section response:', responseData);
      
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
      await refreshSectionsList();
      setSuccess('تم حذف القسم بنجاح');
    } catch (err: any) {
      setError(err.message || 'فشل في حذف القسم. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSectionsList = async () => {
    try {
      const refreshResponse = await fetch(
        `${API_URL}/sections/list?page=${meta.current_page}&per_page=${meta.per_page}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setSections(data.sections);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error('Error refreshing sections list:', err);
    }
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">إدارة الأقسام</h2>
        <button
          className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowEditForm(false);
            setEditingSectionId(null);
            setEditingSectionName('');
          }}
        >
          {showAddForm ? 'إلغاء' : 'إضافة قسم جديد'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/30 border border-red-500/50 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/30 border border-green-500/50 text-white p-4 rounded-lg mb-6">
          {success}
        </div>
      )}

      {showAddForm && (
        <div className="bg-white/5 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-4">إضافة قسم جديد</h3>
          <form onSubmit={handleAddSection}>
            <div className="mb-4">
              <label className="block mb-2 text-white/80">اسم القسم:</label>
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                required
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? 'جاري الإضافة...' : 'إضافة القسم'}
            </button>
          </form>
        </div>
      )}

      {showEditForm && (
        <div className="bg-white/5 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-4">تعديل القسم</h3>
          <form onSubmit={handleEditSection}>
            <div className="mb-4">
              <label className="block mb-2 text-white/80">اسم القسم:</label>
              <input
                type="text"
                value={editingSectionName}
                onChange={(e) => setEditingSectionName(e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="flex space-x-4 rtl:space-x-reverse">
              <button
                type="submit"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? 'جاري التحديث...' : 'تحديث القسم'}
              </button>
              
              <button
                type="button"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-lg"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingSectionId(null);
                  setEditingSectionName('');
                }}
                disabled={isLoading}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && !showAddForm && !showEditForm ? (
        <div className="flex justify-center p-8">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center p-8 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <p className="text-white text-lg font-medium mb-2">لا توجد أقسام حاليًا</p>
          <p className="text-white/80">يرجى إضافة قسم جديد باستخدام زر "إضافة قسم جديد"</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/10 text-right">
                  <th className="p-3">الاسم</th>
                  <th className="p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(section => (
                  <tr key={section.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="p-3">{section.name}</td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <button
                          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-white rounded-lg transition-colors ml-2"
                          onClick={() => startEditing(section)}
                          disabled={isLoading}
                        >
                          تعديل
                        </button>
                        <button
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-colors"
                          onClick={() => handleDeleteSection(section.id)}
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

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex justify-center items-center mt-6">
              <div className="flex gap-2 items-center bg-white/5 rounded-lg p-2">
                <button
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  disabled={meta.current_page === 1 || isLoading}
                  className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  السابق
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current page
                      return page === 1 || 
                             page === meta.last_page || 
                             Math.abs(page - meta.current_page) <= 1;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap in the sequence
                      const prevPage = array[index - 1];
                      const showEllipsisBefore = prevPage && page - prevPage > 1;
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span className="px-2 py-1 text-white/50">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            disabled={isLoading}
                            className={`min-w-[2rem] h-8 rounded-md transition-colors ${
                              meta.current_page === page
                                ? 'bg-blue-500/30 text-white'
                                : 'hover:bg-white/10 text-white/80'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>
                
                <button
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  disabled={meta.current_page === meta.last_page || isLoading}
                  className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageSections; 