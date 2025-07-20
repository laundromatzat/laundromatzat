import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import { PortfolioItemData } from '../utils/parseCSV';
import 'leaflet/dist/leaflet.css';

interface MapSectionProps {
  items: PortfolioItemData[];
}

const defaultCenter: LatLngExpression = [40.7128, -74.006];

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

export default function MapSection({ items }: MapSectionProps) {
  const markers = items
    .filter(i => i.gpsCoords)
    .map(i => {
      const [lat, lng] = i.gpsCoords!.split(',').map(Number);
      return (
        <Marker position={[lat, lng]} key={i.id}>
          <Popup>{i.title}</Popup>
        </Marker>
      );
    });

  return (
    <section className="map-section">
      <h2 className="map-heading">Find us here</h2>
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '300px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markers}
      </MapContainer>
    </section>
  );
}
