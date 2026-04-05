import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Vehicle, vehicleTypes } from "./types";
import { VehicleOwnersModal } from "./VehicleOwnersModal";

interface VehicleCardProps {
  vehicle: Vehicle;
  readonly: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: number) => void;
  getVehicleIcon: (type: string) => string;
}

const getPhotos = (photo_url?: string): string[] => {
  if (!photo_url) return [];
  try {
    const parsed = typeof photo_url === "string" ? JSON.parse(photo_url) : photo_url;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const VehicleDetailModal: React.FC<{
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  readonly: boolean;
  getVehicleIcon: (type: string) => string;
}> = ({ vehicle, open, onClose, onEdit, onDelete, readonly, getVehicleIcon }) => {
  const photos = getPhotos(vehicle.photo_url);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [ownersOpen, setOwnersOpen] = useState(false);
  const [ownersBrand, setOwnersBrand] = useState("");
  const [ownersModel, setOwnersModel] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const typeLabel = vehicleTypes.find((t) => t.value === vehicle.vehicle_type)?.label ?? vehicle.vehicle_type;

  const openOwnersSame = () => {
    setOwnersBrand(vehicle.brand);
    setOwnersModel(vehicle.model);
    setOwnersOpen(true);
  };

  const openOwnersSearch = () => {
    setOwnersBrand("");
    setOwnersModel("");
    setOwnersOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="bg-zinc-950 border-zinc-700 text-white max-w-lg p-0 overflow-hidden max-h-[80vh]">
          {/* Обёртка: фото + выезжающая панель */}
          <div className="relative w-full">

            {/* Фото */}
            <div className="relative w-full bg-zinc-950">
              {photos.length > 0 ? (
                <>
                  <div className="w-full aspect-[4/3] overflow-hidden">
                    <img
                      src={photos[photoIdx]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Градиент снизу */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                  {/* Инфо поверх фото */}
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 flex items-end justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-white/60 uppercase tracking-wide">{typeLabel}</span>
                      <span className="bg-black/30 backdrop-blur-sm border border-white/10 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {vehicle.brand}
                      </span>
                      <span className="bg-black/30 backdrop-blur-sm border border-white/10 text-white/90 text-xs px-2.5 py-0.5 rounded-full">
                        {vehicle.model}
                      </span>
                      {vehicle.year && (
                        <span className="bg-black/20 backdrop-blur-sm border border-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">
                          {vehicle.year}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {vehicle.displacement && (
                        <span className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 text-orange-300 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                          {vehicle.displacement} см³
                        </span>
                      )}
                      {vehicle.power_hp && (
                        <span className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 text-orange-300 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                          {vehicle.power_hp} л.с.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Кнопка открытия панели — слева по центру */}
                  <button
                    onClick={() => setPanelOpen(v => !v)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-r-xl px-1.5 py-4 transition-all z-10"
                  >
                    <Icon name={panelOpen ? "ChevronLeft" : "ChevronRight"} size={16} className="text-white" />
                  </button>

                  {photos.length > 1 && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIdx ? "bg-white" : "bg-white/40"}`}
                        />
                      ))}
                    </div>
                  )}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
                        className="absolute left-8 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1 hover:bg-black/70"
                      >
                        <Icon name="ChevronLeft" size={18} />
                      </button>
                      <button
                        onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1 hover:bg-black/70"
                      >
                        <Icon name="ChevronRight" size={18} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="w-full aspect-[4/3] bg-zinc-900 flex items-center justify-center">
                    <Icon name={getVehicleIcon(vehicle.vehicle_type)} size={64} className="text-zinc-700" />
                  </div>
                  <button
                    onClick={() => setPanelOpen(v => !v)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-r-xl px-1.5 py-4 transition-all z-10"
                  >
                    <Icon name={panelOpen ? "ChevronLeft" : "ChevronRight"} size={16} className="text-white" />
                  </button>
                </>
              )}
              {vehicle.is_primary && (
                <span className="absolute top-3 right-3 text-xs bg-accent text-white px-2 py-0.5 rounded font-medium z-10">
                  Основная
                </span>
              )}
            </div>

            {/* Выезжающая панель слева */}
            <div
              className={`absolute inset-y-0 left-0 w-64 bg-zinc-900/95 backdrop-blur-sm border-r border-zinc-700 flex flex-col transition-transform duration-300 z-20 ${
                panelOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              {/* Заголовок панели */}
              <div className="px-4 pt-4 pb-2 border-b border-zinc-800 flex-shrink-0">
                <p className="text-white font-semibold text-sm">{vehicle.brand} {vehicle.model}</p>
                {vehicle.year && <p className="text-zinc-400 text-xs">{vehicle.year} г.</p>}
              </div>

              {/* Детали */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {vehicle.mileage ? (
                  <div className="bg-zinc-800 rounded-lg px-3 py-2 flex items-center justify-between">
                    <p className="text-gray-500 text-xs">Пробег</p>
                    <p className="text-white text-xs font-medium">{vehicle.mileage.toLocaleString("ru-RU")} км</p>
                  </div>
                ) : null}
                {vehicle.modifications && (
                  <div className="bg-zinc-800 rounded-lg px-3 py-2">
                    <p className="text-gray-500 text-[10px] mb-1">Модификации</p>
                    <p className="text-gray-200 text-xs">{vehicle.modifications}</p>
                  </div>
                )}
                {vehicle.description && (
                  <div className="bg-zinc-800 rounded-lg px-3 py-2">
                    <p className="text-gray-500 text-[10px] mb-1">Описание</p>
                    <p className="text-gray-200 text-xs leading-relaxed">{vehicle.description}</p>
                  </div>
                )}
              </div>

              {/* Кнопки */}
              <div className="px-3 pb-3 space-y-2 flex-shrink-0 border-t border-zinc-800 pt-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant="outline"
                    className="border-zinc-600 text-gray-300 hover:text-white hover:border-orange-500/50 text-[10px] px-2 h-8"
                    onClick={openOwnersSame}
                  >
                    <Icon name="Users" size={12} className="mr-1 text-orange-400" />
                    Такой же
                  </Button>
                  <Button
                    variant="outline"
                    className="border-zinc-600 text-gray-300 hover:text-white hover:border-orange-500/50 text-[10px] px-2 h-8"
                    onClick={openOwnersSearch}
                  >
                    <Icon name="Search" size={12} className="mr-1 text-orange-400" />
                    Найти
                  </Button>
                </div>
                {!readonly && (
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      className="flex-1 border-zinc-600 text-gray-300 hover:text-white text-[10px] h-8"
                      onClick={() => { onClose(); onEdit?.(); }}
                    >
                      <Icon name="Edit" size={12} className="mr-1" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-800 text-red-400 hover:bg-red-500/10 px-2.5 h-8"
                      onClick={() => { onClose(); onDelete?.(); }}
                    >
                      <Icon name="Trash2" size={12} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VehicleOwnersModal
        open={ownersOpen}
        onClose={() => setOwnersOpen(false)}
        initialBrand={ownersBrand}
        initialModel={ownersModel}
      />
    </>
  );
};

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  readonly,
  onEdit,
  onDelete,
  getVehicleIcon,
}) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const photos = getPhotos(vehicle.photo_url);

  return (
    <>
      <div
        className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden hover:border-accent transition-colors aspect-square flex flex-col cursor-pointer"
        onClick={() => setDetailOpen(true)}
      >
        <div className="relative w-full h-2/3 bg-zinc-900">
          {photos.length > 0 ? (
            <img src={photos[0]} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <Icon name={getVehicleIcon(vehicle.vehicle_type)} className="h-12 w-12 text-zinc-600" />
            </div>
          )}
          {!readonly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon name="MoreVertical" className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-zinc-700">
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onEdit(vehicle); }}
                  className="text-white cursor-pointer"
                >
                  <Icon name="Edit" className="h-4 w-4 mr-2" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(vehicle.id); }}
                  className="text-red-400 cursor-pointer focus:text-red-300"
                >
                  <Icon name="Trash2" className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <h4 className="text-white font-semibold text-sm leading-tight">{vehicle.brand} {vehicle.model}</h4>
          {vehicle.year && <p className="text-xs text-zinc-400">{vehicle.year}</p>}
          <div className="flex flex-wrap gap-1 mt-auto pt-2">
            {vehicle.displacement ? (
              <span className="text-xs bg-zinc-900 text-zinc-300 px-1.5 py-0.5 rounded">{vehicle.displacement} см³</span>
            ) : null}
            {vehicle.power_hp ? (
              <span className="text-xs bg-zinc-900 text-zinc-300 px-1.5 py-0.5 rounded">{vehicle.power_hp} л.с.</span>
            ) : null}
          </div>
        </div>
      </div>

      <VehicleDetailModal
        vehicle={vehicle}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={() => onEdit(vehicle)}
        onDelete={() => onDelete(vehicle.id)}
        readonly={readonly}
        getVehicleIcon={getVehicleIcon}
      />
    </>
  );
};