import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import { PortfolioItemData } from '../utils/parseCSV';
import 'leaflet/dist/leaflet.css';

interface MapSectionProps {
  items: PortfolioItemData[];
  onItemClick: (item: PortfolioItemData, targetElement: HTMLElement) => void;
}

const defaultCenter: LatLngExpression = [39.8283, -98.5795];

// Fix default icon paths in Leaflet when using webpack/vite
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

export default function MapSection({ items, onItemClick }: MapSectionProps) {
  const markers = items
    .filter(i => i.gpsCoords)
    .map(i => {
      const [lat, lng] = i.gpsCoords!.split(',').map(Number);
      return (
        <Marker position={[lat, lng]} key={i.id}>
          <Popup>
            <div className="map-popup-content">
              <div className="map-popup-image-container" onClick={() => onItemClick(i, document.body)}>
                <img src={i.coverImage} alt={i.title} />
              </div>
              <h3>{i.title}</h3>
              <p>{i.date}</p>
              <p>{i.location}</p>
            </div>
          </Popup>
        </Marker>
      );
    });

  return (
    <section className="map-section">
      <MapContainer center={defaultCenter} zoom={4} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {markers}
      </MapContainer>
    </section>
  );
}
