import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

// 修復 Leaflet 預設圖標問題
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// 地圖更新組件 - 當店家改變時自動移動地圖
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 16, {
      animate: true,
      duration: 0.5,
    });
  }, [center, map]);
  
  return null;
}

interface OpenStreetMapViewProps {
  store: {
    name: string;
    lat: string | null;
    lng: string | null;
    googleMapsUrl?: string | null;
  };
}

export function OpenStreetMapView({ store }: OpenStreetMapViewProps) {
  const lat = parseFloat(store.lat || '0');
  const lng = parseFloat(store.lng || '0');
  
  if (!store.lat || !store.lng || lat === 0 || lng === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <p className="text-muted-foreground">此店家沒有地圖資料</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-card">
        <h3 className="font-bold text-lg mb-2">{store.name}</h3>
        {store.googleMapsUrl && (
          <a
            href={store.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Navigation className="w-4 h-4" />
            在 Google Maps 中開啟
          </a>
        )}
      </div>
      <div className="flex-1">
        <MapContainer
          center={[lat, lng]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <MapUpdater center={[lat, lng]} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]}>
            <Popup>
              <div className="text-center">
                <p className="font-bold">{store.name}</p>
                {store.googleMapsUrl && (
                  <a
                    href={store.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 block"
                  >
                    在 Google Maps 中開啟
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

