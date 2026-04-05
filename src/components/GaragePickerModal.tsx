import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';

interface Vehicle {
  id: number;
  vehicle_type: string;
  brand: string;
  model: string;
  year?: number;
  photo_url?: string;
  is_primary: boolean;
}

interface GaragePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (vehicle: Vehicle) => void;
}

function getPhoto(photo_url?: string): string | null {
  if (!photo_url) return null;
  try {
    const arr = typeof photo_url === 'string' ? JSON.parse(photo_url) : photo_url;
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
  } catch {
    return typeof photo_url === 'string' && photo_url.startsWith('http') ? photo_url : null;
  }
}

const VEHICLE_ICONS: Record<string, string> = {
  motorcycle: 'Bike', scooter: 'Bike', atv: 'Truck',
  snowmobile: 'Wind', jetski: 'Waves', other: 'Wrench',
};

const GaragePickerModal: React.FC<GaragePickerModalProps> = ({ open, onClose, onSelect }) => {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    setLoading(true);
    fetch(`${AUTH_API}?action=garage`, { headers: { 'X-Auth-Token': token } })
      .then(r => r.json())
      .then(d => setVehicles(d.vehicles || []))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, [open, token]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#1e2332] border border-white/10 rounded-2xl p-5 w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Icon name="Bike" className="h-5 w-5 text-[#ff6b35]" />
            Выберите технику
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Контент */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="h-8 w-8 animate-spin text-[#ff6b35]" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-10">
            <Icon name="Bike" className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
            <p className="text-gray-400 text-sm">Гараж пуст</p>
            <p className="text-gray-600 text-xs mt-1">Добавьте технику в профиле</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {vehicles.map(v => {
              const photo = getPhoto(v.photo_url);
              const icon = VEHICLE_ICONS[v.vehicle_type] || 'Bike';
              return (
                <button
                  key={v.id}
                  onClick={() => { onSelect(v); onClose(); }}
                  className="group bg-[#252836] hover:bg-[#2e3347] border border-white/5 hover:border-[#ff6b35]/50 rounded-xl overflow-hidden transition-all text-left"
                >
                  {/* Фото */}
                  <div className="relative w-full aspect-square bg-zinc-900">
                    {photo ? (
                      <img src={photo} alt={`${v.brand} ${v.model}`} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name={icon as 'Bike'} className="h-10 w-10 text-zinc-600" />
                      </div>
                    )}
                    {v.is_primary && (
                      <span className="absolute top-1.5 left-1.5 bg-[#ff6b35] text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        Основной
                      </span>
                    )}
                  </div>
                  {/* Инфо */}
                  <div className="p-2.5">
                    <p className="text-white text-xs font-semibold leading-tight truncate">{v.brand} {v.model}</p>
                    {v.year && <p className="text-zinc-400 text-[11px] mt-0.5">{v.year}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GaragePickerModal;