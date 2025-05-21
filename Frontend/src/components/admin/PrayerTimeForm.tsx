import React, { useState, useEffect } from 'react';

interface PrayerTimeFormProps {
  onSubmit: (prayerTime: {
    day: number;
    month: number;
    fajr_first_time: string;
    fajr_second_time: string;
    sunrise_time: string;
    dhuhr_time: string;
    asr_time: string;
    maghrib_time: string;
    isha_time: string;
  }) => void;
  isLoading: boolean;
  selectedSection: string;
  initialValues?: {
    day: number;
    month: number;
    fajr_first_time: string;
    fajr_second_time: string;
    sunrise_time: string;
    dhuhr_time: string;
    asr_time: string;
    maghrib_time: string;
    isha_time: string;
  };
  isEditing?: boolean;
}

const PrayerTimeForm: React.FC<PrayerTimeFormProps> = ({
  onSubmit,
  isLoading,
  selectedSection,
  initialValues,
  isEditing = false
}) => {
  const [prayerTime, setPrayerTime] = useState({
    day: 1,
    month: 1,
    fajr_first_time: '',
    fajr_second_time: '',
    sunrise_time: '',
    dhuhr_time: '',
    asr_time: '',
    maghrib_time: '',
    isha_time: ''
  });

  // Initialize form with initial values if editing
  useEffect(() => {
    if (initialValues) {
      setPrayerTime(initialValues);
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'day' || name === 'month') {
      // Parse integer values and ensure they are within valid ranges
      const numValue = parseInt(value);
      
      if (name === 'day') {
        // Days should be between 1 and 31
        const validDay = Math.min(Math.max(isNaN(numValue) ? 1 : numValue, 1), 31);
        setPrayerTime({ ...prayerTime, [name]: validDay });
      } else if (name === 'month') {
        // Months should be between 1 and 12
        const validMonth = Math.min(Math.max(isNaN(numValue) ? 1 : numValue, 1), 12);
        setPrayerTime({ ...prayerTime, [name]: validMonth });
      }
    } else {
      // Allow intermediate inputs while typing
      // Accept empty string or any value that could be part of a valid time
      if (value === '' || /^[0-9]{0,2}(:[0-9]{0,2})?$/.test(value)) {
        setPrayerTime({ ...prayerTime, [name]: value });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all time inputs before submission
    const timeKeys = [
      'fajr_first_time', 'fajr_second_time', 'sunrise_time', 
      'dhuhr_time', 'asr_time', 'maghrib_time', 'isha_time'
    ];
    
    const isValidTime = (time: string) => {
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    };
    
    // Check if all times are in valid format
    const hasInvalidTimes = timeKeys.some(key => !isValidTime(prayerTime[key as keyof typeof prayerTime] as string));
    
    if (hasInvalidTimes) {
      alert('الرجاء التأكد من صحة صيغة الوقت (مثال: 05:30)');
      return;
    }
    
    onSubmit(prayerTime);
  };

  return (
    <form onSubmit={handleSubmit} className="text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 text-white/80">اليوم:</label>
          <input
            type="number"
            name="day"
            value={prayerTime.day}
            onChange={handleChange}
            min="1"
            max="31"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block mb-1 text-white/80">الشهر:</label>
          <input
            type="number"
            name="month"
            value={prayerTime.month}
            onChange={handleChange}
            min="1"
            max="12"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block mb-1 text-white/80">القسم المحدد:</label>
        <input
          type="text"
          value={selectedSection}
          className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white/70"
          disabled
        />
        <p className="text-white/60 text-sm mt-1">القسم محدد من القائمة الرئيسية</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-1 text-white/80">الفجر (أذان):</label>
          <input
            type="text"
            name="fajr_first_time"
            value={prayerTime.fajr_first_time}
            onChange={handleChange}
            placeholder="05:15"
            pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block mb-1 text-white/80">الفجر (الاذان الثاني):</label>
          <input
            type="text"
            name="fajr_second_time"
            value={prayerTime.fajr_second_time}
            onChange={handleChange}
            placeholder="05:30"
            pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block mb-1 text-white/80">الشروق:</label>
          <input
            type="text"
            name="sunrise_time"
            value={prayerTime.sunrise_time}
            onChange={handleChange}
            placeholder="06:45"
            pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block mb-1 text-white/80">الظهر:</label>
          <input
            type="text"
            name="dhuhr_time"
            value={prayerTime.dhuhr_time}
            onChange={handleChange}
            placeholder="12:15"
            pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block mb-1 text-white/80">العصر:</label>
          <input
            type="text"
            name="asr_time"
            value={prayerTime.asr_time}
            onChange={handleChange}
            placeholder="15:30"
            pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block mb-1 text-white/80">المغرب:</label>
          <input
            type="text"
            name="maghrib_time"
            value={prayerTime.maghrib_time}
            onChange={handleChange}
            placeholder="17:45"
            pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block mb-1 text-white/80">العشاء:</label>
          <input
            type="text"
            name="isha_time"
            value={prayerTime.isha_time}
            onChange={handleChange}
            placeholder="19:15"
            pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
            disabled={isLoading}
          />
        </div>
      </div>
      
      <button
        type="submit"
        className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-lg"
        disabled={isLoading}
      >
        {isLoading ? 'جاري المعالجة...' : isEditing ? 'تحديث موعد الصلاة' : 'إضافة موعد الصلاة'}
      </button>
    </form>
  );
};

export default PrayerTimeForm; 