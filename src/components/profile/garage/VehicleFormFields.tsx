import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vehicleTypes } from "./types";

interface VehicleFormFieldsProps {
  vehicle: any;
  setVehicle: (vehicle: any) => void;
  photoPreviews: string[];
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  showAdditional: boolean;
  setShowAdditional: (show: boolean) => void;
}

export const VehicleFormFields: React.FC<VehicleFormFieldsProps> = ({
  vehicle,
  setVehicle,
  photoPreviews,
  handlePhotoChange,
  removePhoto,
  showAdditional,
  setShowAdditional,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-zinc-400">Тип</label>
        <Select value={vehicle.vehicle_type} onValueChange={(v) => setVehicle({ ...vehicle, vehicle_type: v })}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {vehicleTypes.map(vt => (
              <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm text-zinc-400">Марка</label>
        <Input
          value={vehicle.brand}
          onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })}
          placeholder="Yamaha, Honda..."
          className="bg-zinc-800 border-zinc-700"
        />
      </div>
      <div>
        <label className="text-sm text-zinc-400">Модель</label>
        <Input
          value={vehicle.model}
          onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
          placeholder="MT-07, CBR600..."
          className="bg-zinc-800 border-zinc-700"
        />
      </div>
      <div>
        <label className="text-sm text-zinc-400">Год</label>
        <Input
          type="number"
          value={vehicle.year}
          onChange={(e) => setVehicle({ ...vehicle, year: parseInt(e.target.value) })}
          className="bg-zinc-800 border-zinc-700"
        />
      </div>
      <div>
        <label className="text-sm text-zinc-400">
          Фото техники 
          <span className="text-xs text-zinc-500 ml-2">(максимум 5 фото за раз)</span>
        </label>
        <div className="mt-2 space-y-2">
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full max-h-40 object-contain rounded-lg bg-zinc-900" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removePhoto(index)}
                  >
                    <Icon name="X" className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {photoPreviews.length < 5 && (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-accent transition-colors">
              <Icon name="Upload" className="h-8 w-8 text-zinc-500 mb-2" />
              <span className="text-sm text-zinc-400">Загрузить фото ({photoPreviews.length}/5)</span>
              <span className="text-xs text-zinc-600 mt-1">Можно выбрать несколько файлов</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
            </label>
          )}
          {photoPreviews.length === 5 && (
            <div className="text-center py-2 text-xs text-zinc-500 bg-zinc-800 rounded-lg">
              Достигнут лимит (5/5). Удалите фото, чтобы добавить новое.
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-zinc-400">Объем (куб.см)</label>
          <Input
            type="number"
            value={vehicle.displacement || ''}
            onChange={(e) => setVehicle({ ...vehicle, displacement: parseInt(e.target.value) || 0 })}
            placeholder="600"
            className="bg-zinc-800 border-zinc-700"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-400">Мощность (л.с.)</label>
          <Input
            type="number"
            value={vehicle.power_hp || ''}
            onChange={(e) => setVehicle({ ...vehicle, power_hp: parseInt(e.target.value) || 0 })}
            placeholder="75"
            className="bg-zinc-800 border-zinc-700"
          />
        </div>
      </div>
      
      <Button
        type="button"
        variant="ghost"
        onClick={() => setShowAdditional(!showAdditional)}
        className="w-full justify-between text-zinc-400 hover:text-white hover:bg-zinc-800"
      >
        <span>Дополнительно</span>
        <Icon name={showAdditional ? "ChevronUp" : "ChevronDown"} className="h-4 w-4" />
      </Button>
      
      {showAdditional && (
        <div className="space-y-4 pt-2 border-t border-zinc-800">
          <div>
            <label className="text-sm text-zinc-400">Пробег (км)</label>
            <Input
              type="number"
              value={vehicle.mileage || ''}
              onChange={(e) => setVehicle({ ...vehicle, mileage: parseInt(e.target.value) || 0 })}
              placeholder="15000"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Модификации / Тюнинг</label>
            <Textarea
              value={vehicle.modifications}
              onChange={(e) => setVehicle({ ...vehicle, modifications: e.target.value })}
              placeholder="Выхлоп Akrapovic, фильтр K&N..."
              className="bg-zinc-800 border-zinc-700 min-h-[60px]"
            />
          </div>
        </div>
      )}
      <div>
        <label className="text-sm text-zinc-400">Описание</label>
        <Textarea
          value={vehicle.description}
          onChange={(e) => setVehicle({ ...vehicle, description: e.target.value })}
          placeholder="Расскажи о своей технике..."
          className="bg-zinc-800 border-zinc-700 min-h-[80px]"
        />
      </div>
    </div>
  );
};