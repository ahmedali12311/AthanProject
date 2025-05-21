import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Compass, Navigation, Info, MapPin, LocateFixed } from 'lucide-react';
import QiblaMap from './QiblaMap';
import { useTimeTheme } from '../contexts/TimeThemeContext';

const libyanCities = [
  { name: 'طرابلس', qiblaDirection: 111.2, lat: 32.8872, lng: 13.1913 },
  { name: 'بنغازي', qiblaDirection: 113.5, lat: 32.1167, lng: 20.0667 },
  { name: 'مصراتة', qiblaDirection: 112.1, lat: 32.3754, lng: 15.0925 },
  { name: 'الزاوية', qiblaDirection: 110.9, lat: 32.7571, lng: 12.7278 },
  { name: 'سبها', qiblaDirection: 114.8, lat: 27.0377, lng: 14.4283 },
  { name: 'زليتن', qiblaDirection: 112.3, lat: 32.4674, lng: 14.5687 },
  { name: 'البيضاء', qiblaDirection: 114.2, lat: 32.7627, lng: 21.7551 },
  { name: 'درنة', qiblaDirection: 115.1, lat: 32.7648, lng: 22.6392 },
  { name: 'سرت', qiblaDirection: 113.0, lat: 31.2089, lng: 16.5887 },
  { name: 'غدامس', qiblaDirection: 109.5, lat: 30.1333, lng: 9.5000 },
  { name: 'طبرق', qiblaDirection: 115.8, lat: 32.0836, lng: 23.9764 },
  { name: 'الخمس', qiblaDirection: 111.7, lat: 32.6204, lng: 14.2619 },
  { name: 'غريان', qiblaDirection: 111.4, lat: 32.1722, lng: 13.0203 },
  { name: 'اجدابيا', qiblaDirection: 114.0, lat: 30.7556, lng: 20.2263 },
  { name: 'مرزق', qiblaDirection: 115.2, lat: 25.9155, lng: 13.8963 },
  { name: 'يفرن', qiblaDirection: 111.0, lat: 32.0629, lng: 12.5263 },
  { name: 'نالوت', qiblaDirection: 109.8, lat: 31.8685, lng: 10.9868 },
  { name: 'بنت بية', qiblaDirection: 113.7, lat: 31.2000, lng: 16.6833 },
  { name: 'تاجوراء', qiblaDirection: 111.3, lat: 32.8817, lng: 13.3506 },
  { name: 'هون', qiblaDirection: 113.9, lat: 29.1268, lng: 15.9472 },
  { name: 'المرج', qiblaDirection: 114.5, lat: 32.4926, lng: 20.8317 },
];

const QiblaDirection: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState(libyanCities[0]);
  const [customLocation, setCustomLocation] = useState<{ lat: number; lng: number; qiblaDirection: number } | null>(null);
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(5);
  const { theme } = useTimeTheme();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setLocationError('تعذر الحصول على الموقع الحالي. سيتم استخدام طرابلس كموقع افتراضي.');
        }
      );
    } else {
      setLocationError('المتصفح لا يدعم خدمة الموقع الجغرافي. سيتم استخدام طرابلس كموقع افتراضي.');
    }
  }, []);

  const handleLocationChange = useCallback((lat: number, lng: number, qiblaDirection: number) => {
    setCustomLocation({ lat, lng, qiblaDirection });
    setUseManualLocation(true);
  }, []);

  const handleCityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = libyanCities.find(city => city.name === e.target.value);
    if (city && city.name !== selectedCity.name) {
      setSelectedCity(city);
      setCustomLocation(null);
      setUseManualLocation(false);
    }
  }, [selectedCity.name]);

  const handleZoomChange = useCallback((zoom: number) => {
    if (zoom !== zoomLevel) {
      setZoomLevel(zoom);
    }
  }, [zoomLevel]);

  const toggleManualLocation = useCallback(() => {
    setUseManualLocation(prev => !prev);
    setCustomLocation(null);
  }, [useManualLocation]);

  const getThemeAccentClass = () => {
    switch (theme) {
      case 'fajr': return 'text-blue-300';
      case 'sunrise': return 'text-yellow-300';
      case 'dhuhr': return 'text-sky-300';
      case 'asr': return 'text-orange-400';
      case 'maghrib': return 'text-purple-300';
      case 'isha': return 'text-indigo-300';
      default: return 'text-white';
    }
  };

  const getThemeAccentBgClass = () => {
    switch (theme) {
      case 'fajr': return 'bg-blue-500/20';
      case 'sunrise': return 'bg-yellow-500/20';
      case 'dhuhr': return 'bg-sky-500/20';
      case 'asr': return 'bg-orange-500/20';
      case 'maghrib': return 'bg-purple-500/20';
      case 'isha': return 'bg-indigo-500/20';
      default: return 'bg-white/20';
    }
  };

  const formatDegreesInArabic = (degrees: number) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return degrees.toFixed(1).toString().split('').map(char =>
      char === '.' ? '.' : arabicDigits[parseInt(char)]
    ).join('');
  };

  const currentLocation = useMemo(
    () => customLocation || selectedCity,
    [customLocation, selectedCity]
  );


  return (
    <div className="qibla-container bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 mb-6 text-center border border-white/20 shadow-lg max-w-full mx-auto">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Navigation className={`h-5 w-5 ${getThemeAccentClass()}`} />
        <h2 className="text-lg sm:text-xl font-bold">اتجاه القبلة</h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="bg-white/10 rounded-full p-1 hover:bg-white/20 transition-colors"
          aria-label="معلومات عن اتجاه القبلة"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {showInfo && (
        <div className="info-box bg-white/5 rounded-lg p-3 mb-4 text-xs sm:text-sm">
          <p className="mb-2">القبلة هي الاتجاه نحو الكعبة المشرفة في مكة المكرمة، والتي يتوجه إليها المسلمون في صلاتهم.</p>
          <p>الدرجات المعروضة هي زاوية من اتجاه الشمال، حيث يشير الشمال إلى ٠ درجة، والشرق إلى ٩٠ درجة، والجنوب إلى ١٨٠ درجة، والغرب إلى ٢٧٠ درجة.</p>
        </div>
      )}

      <div className="city-selector mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2">
          <label htmlFor="city-select" className="text-sm opacity-80">
            {useManualLocation ? 'تحديد الموقع يدويًا على الخريطة' : 'اختر المدينة:'}
          </label>
          <button
            onClick={toggleManualLocation}
            className="bg-white/10 rounded-lg px-3 py-1 text-sm hover:bg-white/20 transition-colors touch-friendly"
          >
            {useManualLocation ? 'اختيار مدينة' : 'تحديد يدوي'}
          </button>
        </div>
        {!useManualLocation && (
          <div className="relative">
            <MapPin className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${getThemeAccentClass()}`} />
            <select
              id="city-select"
              className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-3 py-2 text-center w-full text-sm sm:text-base touch-friendly"
              value={selectedCity.name}
              onChange={handleCityChange}
            >
              {libyanCities.map(city => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="qibla-display flex flex-col items-center justify-center gap-4">
        {userLocation || locationError ? (
          <div className="w-full h-48 sm:h-64">
            <QiblaMap
              latitude={currentLocation.lat}
              longitude={currentLocation.lng}
              qiblaDirection={currentLocation.qiblaDirection}
              onLocationChange={handleLocationChange}
              onZoomChange={handleZoomChange}
              zoomLevel={zoomLevel}
            />
          </div>
        ) : (
          <div className="w-full h-48 sm:h-64 flex items-center justify-center bg-white/5 rounded-lg">
            <p className="text-white/70 text-sm">جاري تحديد الموقع...</p>
          </div>
        )}
        <div className="compass-container relative mb-4">
          <div className={`compass-circle ${getThemeAccentBgClass()} w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center relative border-4 border-white/20`}>
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold">ش</div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">ش</div>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold">ج</div>
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">غ</div>

            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute h-1 w-1 bg-white/60 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 30}deg) translate(50px) rotate(-${i * 30}deg)`,
                }}
              />
            ))}

            <Compass className={`h-12 w-12 sm:h-16 sm:w-16 ${getThemeAccentClass()}`} />

            <div
              className="qibla-needle absolute h-1.5 bg-red-500 rounded-full"
              style={{
                width: '50%',
                top: '50%',
                left: '50%',
                transformOrigin: 'left center',
                transform: `translateY(-50%) rotate(${currentLocation.qiblaDirection}deg)`,
              }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full" />
            </div>

            <div
              className="absolute text-xs font-bold text-red-500"
              style={{
                transform: `rotate(${currentLocation.qiblaDirection}deg) translate(40px) rotate(-${currentLocation.qiblaDirection}deg)`,
              }}
            >
              القبلة
            </div>
          </div>
        </div>

        <div className="qibla-info bg-white/5 rounded-lg py-2 px-4 text-center">
          <p className="text-base sm:text-lg">
            <span className="city-name font-medium">
              {customLocation ? 'موقع مخصص' : selectedCity.name}:
            </span>
            <span className={`qibla-degrees ${getThemeAccentClass()} font-bold`}>
              {formatDegreesInArabic(currentLocation.qiblaDirection)}°
            </span>
          </p>
          <p className="text-xs mt-1 opacity-70">(اتجاه القبلة بالدرجات من الشمال)</p>
          <p className="text-xs mt-2 opacity-80">
            وجه الجهاز الشمالية (ش) نحو الشمال، ثم اتجه حيث يشير السهم الأحمر
          </p>
        </div>
      </div>
    </div>
  );
};

export default QiblaDirection;