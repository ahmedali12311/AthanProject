import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './QiblaMap.css';

interface QiblaMapProps {
  latitude: number;
  longitude: number;
  qiblaDirection: number;
  zoomLevel: number;
  onLocationChange?: (lat: number, lng: number, qiblaDirection: number) => void;
  onZoomChange?: (zoom: number) => void;
}

const kaabaPosition: [number, number] = [21.3891, 39.8579]; // Kaaba coordinates

// Helper function to calculate Qibla direction
const calculateQiblaDirection = (lat: number, lng: number): number => {
  const φ1 = lat * Math.PI / 180;
  const λ1 = lng * Math.PI / 180;
  const φ2 = kaabaPosition[0] * Math.PI / 180;
  const λ2 = kaabaPosition[1] * Math.PI / 180;

  const Δλ = λ2 - λ1;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let θ = Math.atan2(y, x);
  θ = ((θ * 180 / Math.PI) + 360) % 360; // Normalize to 0-360
  return θ;
};

// Component to handle map view updates
const MapViewUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom); // Use provided zoom
  }, [center, zoom, map]);
  return null;
};

// Child component for handling map events
const MapEvents: React.FC<{
  onLocationChange?: (lat: number, lng: number, qiblaDirection: number) => void;
  onZoomChange?: (zoom: number) => void;
}> = ({ onLocationChange, onZoomChange }) => {
  const map = useMap();
  useMapEvents({
    click: (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      if (onLocationChange) {
        const newQiblaDirection = calculateQiblaDirection(lat, lng);
        onLocationChange(lat, lng, newQiblaDirection);
      }
    },
    zoomend: () => {
      const currentZoom = map.getZoom();
      if (onZoomChange) {
        onZoomChange(currentZoom);
      }
    },
  });
  return null;
};

const QiblaMap: React.FC<QiblaMapProps> = ({
  latitude,
  longitude,
  qiblaDirection,
  zoomLevel,
  onLocationChange,
  onZoomChange,
}) => {
  const currentPosition: [number, number] = [latitude, longitude];

  // Calculate end point of Qibla line
  const calculateLineEndPoint = (): [number, number] => {
    const R = 6371; // Earth's radius in km
    const distance = 2000; // Distance in km
    const φ1 = latitude * Math.PI / 180;
    const λ1 = longitude * Math.PI / 180;
    const θ = qiblaDirection * Math.PI / 180;

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(distance / R) +
      Math.cos(φ1) * Math.sin(distance / R) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(
      Math.sin(θ) * Math.sin(distance / R) * Math.cos(φ1),
      Math.cos(distance / R) - Math.sin(φ1) * Math.sin(φ2)
    );

    return [φ2 * 180 / Math.PI, λ2 * 180 / Math.PI];
  };

  const lineEndPoint = calculateLineEndPoint();

  // Custom compass marker for current location
  const compassIcon = L.divIcon({
    className: 'compass-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    html: `
      <div class="compass-icon">
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#dbeafe" stroke="#3b82f6" stroke-width="2" filter="url(#shadow)"/>
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.2"/>
            </filter>
          </defs>
          <text x="20" y="10" text-anchor="middle" font-size="8" fill="#1e3a8a" font-weight="bold">ش</text>
          <text x="20" y="34" text-anchor="middle" font-size="8" fill="#1e3a8a" font-weight="bold">ج</text>
          <text x="32" y="22" text-anchor="middle" font-size="8" fill="#1e3a8a" font-weight="bold">ش</text>
          <text x="8" y="22" text-anchor="middle" font-size="8" fill="#1e3a8a" font-weight="bold">غ</text>
          <path d="M20 8 L20 20 L24 24 L20 20 L16 24 Z" fill="#ef4444" transform="rotate(${qiblaDirection}, 20, 20)"/>
        </svg>
      </div>
    `,
  });

  // Kaaba marker
  const kaabaIcon = L.divIcon({
    className: 'kaaba-marker',
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
    popupAnchor: [0, -7.5],
    html: '<div style="color: red; font-size: 15px;">●</div>',
  });

  return (
    <MapContainer
      center={currentPosition}
      zoom={zoomLevel} // Initial zoom
      style={{ height: '100%', width: '100%', minHeight: '192px' }}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={currentPosition} icon={compassIcon}>
        <Popup>موقعك الحالي</Popup>
      </Marker>
      <Marker position={kaabaPosition} icon={kaabaIcon}>
        <Popup>الكعبة المشرفة</Popup>
      </Marker>
      <Polyline positions={[currentPosition, lineEndPoint]} color="#e53e3e" weight={2} dashArray="5, 5" />
      <MapEvents onLocationChange={onLocationChange} onZoomChange={onZoomChange} />
      <MapViewUpdater center={currentPosition} zoom={zoomLevel} />
    </MapContainer>
  );
};

export default QiblaMap;