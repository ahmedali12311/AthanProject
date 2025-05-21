import axios from 'axios';
import { SectionsResponse, PrayerTimesResponse } from '../types';

const API_BASE_URL = 'https://islambackend.fly.dev';

export const fetchCities = async (): Promise<SectionsResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sections/list`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw new Error('فشل في تحميل قائمة المدن. الرجاء التحقق من اتصال الخادم.');
  }
};

export const fetchPrayerTimes = async (cityName: string): Promise<PrayerTimesResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/prayer-times/list`, {
      params: { q: cityName }
    });
    
    if (!response.data.prayer_times || response.data.prayer_times.length === 0) {
      throw new Error('لم يتم العثور على مواقيت الصلاة لهذه المدينة');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    throw new Error('فشل في تحميل مواقيت الصلاة. الرجاء المحاولة مرة أخرى.');
  }
};