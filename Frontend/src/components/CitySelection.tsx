import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Section } from '../types';
import { fetchCities } from '../utils/api';
import { MapPin, Loader2, Calendar } from 'lucide-react';
import HijriDate from './HijriDate';

interface CitySelectionProps {
  onCitySelected: (cityName: string) => void;
}

const CitySelection: React.FC<CitySelectionProps> = ({ onCitySelected }) => {
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCities = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchCities();
        setCities(response.sections);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء تحميل قائمة المدن');
        setLoading(false);
      }
    };

    getCities();
  }, []);

  const handleCityChange = (selected: any) => {
    if (selected) {
      localStorage.setItem('selectedCity', selected.value);
      onCitySelected(selected.value);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full">
          <Loader2 className="animate-spin h-16 w-16 mb-6 mx-auto text-white" />
          <div className="text-xl font-medium">جاري تحميل قائمة المدن...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full">
          <div className="text-red-400 text-xl mb-6">{error}</div>
          <button 
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const cityOptions = cities.map(city => ({
    value: city.name,
    label: city.name
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="glass-card rounded-2xl p-8 shadow-2xl max-w-md w-full">
        {/* Display Hijri Date at the top */}
        <div className="mb-8">
          <HijriDate />
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl transform -translate-y-10 scale-75 opacity-70"></div>
          <MapPin className="mx-auto mb-6 h-20 w-20 text-white relative z-10" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">اختر المدينة</h1>
        <p className="mb-8 text-white/80">اختر المدينة لعرض مواقيت الصلاة</p>
        
        <div className="relative">
          <div className="absolute inset-0 bg-white/5 rounded-lg blur-lg"></div>
          <Select
            options={cityOptions}
            onChange={handleCityChange}
            placeholder="اختر المدينة"
            className="text-right relative z-10"
            classNamePrefix="city-select"
            isSearchable={false} // Add this to disable typing
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                boxShadow: 'none',
                borderRadius: '0.75rem',
                padding: '0.25rem',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)'
                }
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                overflow: 'hidden'
              }),
              option: (base, { isFocused, isSelected }) => ({
                ...base,
                backgroundColor: isSelected 
                  ? 'rgba(59, 130, 246, 0.5)' 
                  : isFocused 
                    ? 'rgba(59, 130, 246, 0.2)' 
                    : undefined,
                color: 'white',
                padding: '0.75rem 1rem',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.3)'
                }
              }),
              singleValue: (base) => ({
                ...base,
                color: 'white',
                fontSize: '1.1rem'
              }),
              placeholder: (base) => ({
                ...base,
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1.1rem'
              }),
              input: (base) => ({
                ...base,
                color: 'white'
              }),
              dropdownIndicator: (base) => ({
                ...base,
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'white'
                }
              })
            }}
          />
        </div>
        
        <div className="mt-8 text-sm text-center opacity-70">
          <Calendar className="h-4 w-4 inline-block mr-1" />
          <span>يتم تحديث مواقيت الصلاة يومياً</span>
        </div>
      </div>
    </div>
  );
};

export default CitySelection;