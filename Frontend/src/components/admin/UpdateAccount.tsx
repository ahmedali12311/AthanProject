import React, { useState, useEffect } from 'react';

// API URL
const API_URL = 'https://islambackend.fly.dev';

interface UpdateAccountProps {
  token?: string;
  onLogout: () => void;
  onTokenUpdate?: (newToken: string) => void;
}

interface MeResponse {
  user: {
    id: string;
    name: string;
    phone_number: string;
    created_at: string;
    updated_at: string;
  };
}

interface TokenResponse {
  expires: string;
  token: string;
}

const UpdateAccount: React.FC<UpdateAccountProps> = ({ token, onLogout, onTokenUpdate }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user data from /me endpoint
  useEffect(() => {
    const fetchUserData = async () => {
      setIsFetching(true);
      try {
        console.log('Fetching user data with token:', token);
        
        const response = await fetch(`${API_URL}/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('authToken');
            onLogout();
            return;
          }
          throw new Error('فشل جلب بيانات المستخدم');
        }

        const responseData = await response.json() as MeResponse;
        console.log('Response data:', responseData);
        
        // Check if user data exists in the response
        if (responseData.user) {
          setUserId(responseData.user.id);
          setName(responseData.user.name || '');
          setPhoneNumber(responseData.user.phone_number || '');
          console.log('User data loaded successfully:', responseData.user);
        } else {
          console.error('User data not found in response', responseData);
          throw new Error('بيانات المستخدم غير متوفرة في الاستجابة');
        }
        
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'حدث خطأ أثناء جلب بيانات المستخدم');
      } finally {
        setIsFetching(false);
      }
    };

    if (token) {
      fetchUserData();
    } else {
      setError('رمز الدخول غير متوفر');
      setIsFetching(false);
    }
  }, [token, onLogout]);

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('معرف المستخدم غير متوفر');
      console.error('User ID is not available:', userId);
      return;
    }
    
    // Validate password match if provided
    if (password && password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Updating user data for ID:', userId);
      
      // Create FormData for the request
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone_number', phoneNumber);
      if (password) {
        formData.append('password', password);
      }
      
      // Use the correct endpoint and method
      const response = await fetch(`${API_URL}/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      // Get the response text
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      // Try to parse as JSON
      let responseData;
      try {
        if (responseText) {
          responseData = JSON.parse(responseText);
          console.log('Parsed response data:', responseData);
        }
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
      }

      if (!response.ok) {
        // Handle error case
        console.error('Update error status:', response.status);
        
        if (responseData && responseData.message) {
          throw new Error(responseData.message);
        } else {
          throw new Error(`فشل تحديث البيانات: ${responseText || response.statusText}`);
        }
      }

      // If we got a valid JSON response with a token, save it
      if (responseData && responseData.token) {
        console.log('New token received:', responseData.token);
        localStorage.setItem('authToken', responseData.token);
        
        // Notify parent component about the new token
        if (onTokenUpdate) {
          onTokenUpdate(responseData.token);
        }
      }

      setSuccess('تم تحديث بيانات الحساب بنجاح');
      // Clear password fields after successful update
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error updating user data:', err);
      setError(err.message || 'فشل تحديث بيانات الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-white">تحديث بيانات الحساب</h2>
      
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
      
      <form onSubmit={handleUpdateAccount}>
        <div className="mb-4">
          <label htmlFor="name" className="block mb-2 text-white/80">الاسم:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="phoneNumber" className="block mb-2 text-white/80">رقم الهاتف:</label>
          <input
            id="phoneNumber"
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+218XXXXXXXXX"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block mb-2 text-white/80">كلمة المرور الجديدة (اترك فارغًا للإبقاء على كلمة المرور الحالية):</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block mb-2 text-white/80">تأكيد كلمة المرور الجديدة:</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            disabled={isLoading || !password}
          />
        </div>
        
        <div className="flex space-x-4 rtl:space-x-reverse">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg text-white"
            disabled={isLoading}
          >
            {isLoading ? 'جاري التحديث...' : 'تحديث البيانات'}
          </button>
          
          <button
            type="button"
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 transition-all duration-300 rounded-lg text-white"
            onClick={onLogout}
          >
            تسجيل الخروج
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateAccount; 