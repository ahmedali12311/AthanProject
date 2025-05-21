import React, { useState } from 'react';

// API URL
const API_URL = 'https://islambackend.fly.dev';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

interface LoginResponse {
  expires: string;
  token: string;
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

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('+218926432251'); // Pre-filled with test credentials
  const [password, setPassword] = useState('091093Aa'); // Pre-filled with test credentials
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
console.log(URL)
    try {
      
      // Create FormData for the request
      const formData = new FormData();
      
      formData.append('phone_number', phoneNumber);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تسجيل الدخول');
      }

      // Parse response to get token
      const data = await response.json() as LoginResponse;
      console.log('Login response:', data);
      
      const token = data.token;
      
      if (!token) {
        throw new Error('لم يتم استلام رمز الدخول');
      }
      
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      console.log('Token stored in localStorage');
      
      // Fetch user data with the token
      await fetchUserData(token);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  };
  
  const fetchUserData = async (token: string) => {
    try {
      console.log('Fetching user data with token');
      
      const userResponse = await fetch(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('فشل في جلب بيانات المستخدم');
      }
      
      const responseData = await userResponse.json() as MeResponse;
      console.log('User data response:', responseData);
      
      if (!responseData.user) {
        throw new Error('بيانات المستخدم غير متوفرة في الاستجابة');
      }
      
      // Call the callback with the token and user info
      onLoginSuccess(token, responseData.user);
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'تم تسجيل الدخول ولكن فشل في جلب بيانات المستخدم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="bg-white/5 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-6 text-white text-center">تسجيل الدخول للإدارة</h2>
        
        {error && (
          <div className="bg-red-500/30 border border-red-500/50 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
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
          
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-white/80">كلمة المرور:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
              required
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg text-white"
            disabled={isLoading}
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 