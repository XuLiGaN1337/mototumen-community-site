import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { AUTH_API, vehicleTypes } from "./types";

interface VehicleOwner {
  id: number;
  user_id: number;
  vehicle_type: string;
  brand: string;
  model: string;
  year?: number;
  photo_url?: string;
  displacement?: number;
  power_hp?: number;
  mileage?: number;
  modifications?: string;
  description?: string;
  is_primary: boolean;
  owner_name: string;
  owner_username?: string;
  owner_avatar?: string;
  owner_location?: string;
}

const getPhotos = (photo_url?: string): string[] => {
  if (!photo_url) return [];
  try {
    const p = typeof photo_url === "string" ? JSON.parse(photo_url) : photo_url;
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};

interface VehicleOwnersModalProps {
  open: boolean;
  onClose: () => void;
  initialBrand?: string;
  initialModel?: string;
}

export const VehicleOwnersModal: React.FC<VehicleOwnersModalProps> = ({
  open,
  onClose,
  initialBrand = "",
  initialModel = "",
}) => {
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [results, setResults] = useState<VehicleOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (open) {
      setBrand(initialBrand);
      setModel(initialModel);
      setResults([]);
      setSearched(false);
      if (initialBrand) {
        doSearch(initialBrand, initialModel);
      }
    }
  }, [open, initialBrand, initialModel]);

  const doSearch = async (b: string, m: string) => {
    if (!b.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ action: "search_vehicles", brand: b.trim() });
      if (m.trim()) params.set("model", m.trim());
      const r = await fetch(`${AUTH_API}?${params}`);
      const d = await r.json();
      setResults(Array.isArray(d.vehicles) ? d.vehicles : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => doSearch(brand, model);

  const getTypeIcon = (type: string) =>
    vehicleTypes.find((t) => t.value === type)?.icon ?? "Bike";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
            <Icon name="Search" size={18} className="text-orange-400" />
            Найти владельцев техники
          </DialogTitle>
        </DialogHeader>

        {/* Поиск */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex gap-2">
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Марка: Honda, Yamaha..."
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500 flex-1"
            />
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Модель (необязательно)"
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500 flex-1"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!brand.trim() || loading}
            className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Icon name="Loader2" size={16} className="animate-spin" />
            ) : (
              <Icon name="Search" size={16} />
            )}
            Найти
          </button>
        </div>

        {/* Результаты */}
        <div className="mt-3 space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <Icon name="Loader2" size={28} className="animate-spin text-gray-500" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-8">
              <Icon name="SearchX" size={40} className="text-zinc-600 mx-auto mb-3" />
              <p className="text-gray-400">Никто не нашёлся</p>
              <p className="text-gray-500 text-sm mt-1">Попробуй изменить запрос</p>
            </div>
          )}

          {!loading && results.map((v) => {
            const photos = getPhotos(v.photo_url);
            const typeIcon = getTypeIcon(v.vehicle_type);

            return (
              <a
                key={v.id}
                href={`/user/${v.user_id}`}
                className="flex gap-3 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-orange-500/40 rounded-xl p-3 transition-all group"
              >
                {/* Фото техники */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900 flex items-center justify-center">
                  {photos.length > 0 ? (
                    <img
                      src={photos[0]}
                      alt={`${v.brand} ${v.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon name={typeIcon} size={28} className="text-zinc-600" />
                  )}
                </div>

                {/* Инфо */}
                <div className="flex-1 min-w-0">
                  <p className="font-['Oswald'] text-white text-base leading-tight group-hover:text-orange-400 transition-colors">
                    {v.brand} {v.model}
                  </p>
                  {v.year && (
                    <p className="text-gray-500 text-xs">{v.year} г.</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {v.displacement ? (
                      <span className="text-xs bg-zinc-900 text-zinc-300 px-1.5 py-0.5 rounded">
                        {v.displacement} см³
                      </span>
                    ) : null}
                    {v.power_hp ? (
                      <span className="text-xs bg-zinc-900 text-zinc-300 px-1.5 py-0.5 rounded">
                        {v.power_hp} л.с.
                      </span>
                    ) : null}
                  </div>

                  {/* Владелец */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                      {v.owner_avatar ? (
                        <img
                          src={v.owner_avatar}
                          alt={v.owner_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400">
                          {v.owner_name[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs truncate">{v.owner_name}</span>
                    {v.owner_location && (
                      <span className="text-gray-600 text-xs truncate">· {v.owner_location}</span>
                    )}
                    <Icon name="ChevronRight" size={12} className="text-zinc-600 ml-auto group-hover:text-orange-400 flex-shrink-0" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
