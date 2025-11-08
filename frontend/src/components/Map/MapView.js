import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import './MapView.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different activity states
const createCustomIcon = (activity) => {
  const colors = {
    'DRIVING': '#3b82f6',
    'WORKING': '#10b981',
    'IDLE': '#f59e0b',
    'PARKED': '#6b7280',
    'CHARGING': '#8b5cf6',
    'UNKNOWN': '#9ca3af'
  };

  const color = colors[activity] || colors.UNKNOWN;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          font-size: 16px;
          margin-top: 3px;
          margin-left: 5px;
        ">🚜</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

// Component to update map center
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapView() {
  const [forklifts, setForklifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([60.1695, 24.9354]); // Default: Helsinki

  useEffect(() => {
    fetchForklifts();
    const interval = setInterval(fetchForklifts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchForklifts = async () => {
    try {
      const response = await api.getAllForklifts();
      if (response.success && response.data.length > 0) {
        setForklifts(response.data);
        
        // Center map on first forklift with location
        const forkliftWithLocation = response.data.find(f => f.currentLocation);
        if (forkliftWithLocation) {
          setMapCenter([
            forkliftWithLocation.currentLocation.latitude,
            forkliftWithLocation.currentLocation.longitude
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch forklifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (activity) => {
    const colors = {
      'DRIVING': '#3b82f6',
      'WORKING': '#10b981',
      'IDLE': '#f59e0b',
      'PARKED': '#6b7280',
      'CHARGING': '#8b5cf6',
      'UNKNOWN': '#9ca3af'
    };
    return colors[activity] || colors.UNKNOWN;
  };

  if (loading) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <div className="spinner"></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div className="map-header">
        <h2>📍 Live Forklift Locations</h2>
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
            Driving
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#10b981' }}></span>
            Working
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
            Idle
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#6b7280' }}></span>
            Parked
          </span>
        </div>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={16}
        style={{ height: '500px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={mapCenter} />

        {forklifts.map((forklift) => {
          if (!forklift.currentLocation) return null;
          
          return (
            <Marker
              key={forklift._id}
              position={[
                forklift.currentLocation.latitude,
                forklift.currentLocation.longitude
              ]}
              icon={createCustomIcon(forklift.currentActivity)}
            >
              <Popup>
                <div className="popup-content">
                  <h3>🚜 {forklift.name}</h3>
                  <p><strong>ID:</strong> {forklift.forkliftId}</p>
                  <p>
                    <strong>Activity:</strong> 
                    <span 
                      className="activity-badge-small"
                      style={{ backgroundColor: getActivityColor(forklift.currentActivity) }}
                    >
                      {forklift.currentActivity}
                    </span>
                  </p>
                  <p><strong>Battery:</strong> {forklift.batteryLevel}%</p>
                  <p><strong>Model:</strong> {forklift.model}</p>
                  <p className="location-coords">
                    📍 {forklift.currentLocation.latitude.toFixed(6)}, 
                    {forklift.currentLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default MapView;