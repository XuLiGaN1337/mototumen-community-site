import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { Vehicle, AUTH_API, PROFILE_API } from "./garage/types";
import { VehicleCard } from "./garage/VehicleCard";
import { AddVehicleDialog } from "./garage/AddVehicleDialog";
import { EditVehicleDialog } from "./garage/EditVehicleDialog";

interface GarageTabProps {
  vehicles?: Vehicle[];
  onRefresh?: () => void;
  readonly?: boolean;
}

export const GarageTab: React.FC<GarageTabProps> = ({ vehicles: propVehicles, onRefresh, readonly = false }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(propVehicles || []);
  const [loading, setLoading] = useState(!propVehicles);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();
  const { uploadFile, uploading } = useMediaUpload();

  const [newVehicle, setNewVehicle] = useState({
    vehicle_type: 'moto',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    description: '',
    photo_url: '',
    mileage: 0,
    modifications: '',
    power_hp: 0,
    displacement: 0,
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [showAdditional, setShowAdditional] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [editPhotoFiles, setEditPhotoFiles] = useState<File[]>([]);
  const [editPhotoPreviews, setEditPhotoPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (propVehicles) {
      setVehicles(propVehicles);
      setLoading(false);
    } else if (token) {
      loadVehicles();
    }
  }, [token, propVehicles]);

  const loadVehicles = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${AUTH_API}?action=garage`, {
        headers: { 'X-Auth-Token': token },
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить гараж",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const totalPhotos = photoFiles.length + files.length;
      const availableSlots = 5 - photoFiles.length;
      
      if (totalPhotos > 5) {
        toast({
          title: "Превышен лимит фото",
          description: `Можно загрузить максимум 5 фото. Добавлено ${availableSlots} из ${files.length} выбранных.`,
          variant: "destructive",
        });
      }
      
      const filesToAdd = files.slice(0, availableSlots);
      const newFiles = [...photoFiles, ...filesToAdd];
      setPhotoFiles(newFiles);
      
      const readers = filesToAdd.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(readers).then(results => {
        setPhotoPreviews([...photoPreviews, ...results]);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const addVehicle = async () => {
    if (!token || !newVehicle.brand || !newVehicle.model) {
      toast({
        title: "Ошибка",
        description: "Заполните марку и модель",
        variant: "destructive",
      });
      return;
    }

    try {
      const vehicleData = { ...newVehicle };
      
      if (photoFiles.length > 0) {
        console.log('[ADD VEHICLE] Uploading photos:', photoFiles.length);
        const uploadPromises = photoFiles.map(file => 
          uploadFile(file, { folder: 'garage' })
        );
        
        const uploadResults = await Promise.all(uploadPromises);
        console.log('[ADD VEHICLE] Upload results:', uploadResults);
        
        const uploadedUrls = uploadResults
          .filter(result => result !== null)
          .map(result => result!.url);
        
        if (uploadedUrls.length > 0) {
          vehicleData.photo_url = JSON.stringify(uploadedUrls);
        } else {
          vehicleData.photo_url = '[]';
        }
      }
      
      console.log('[ADD VEHICLE] Sending data:', vehicleData);
      
      const response = await fetch(`${AUTH_API}?action=garage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify(vehicleData),
      });
      
      console.log('[ADD VEHICLE] Response status:', response.status);

      if (response.ok) {
        toast({ title: "Техника добавлена!" });
        setIsAddDialogOpen(false);
        setNewVehicle({ vehicle_type: 'moto', brand: '', model: '', year: new Date().getFullYear(), description: '', photo_url: '', mileage: 0, modifications: '', power_hp: 0, displacement: 0 });
        setPhotoFiles([]);
        setPhotoPreviews([]);
        onRefresh ? onRefresh() : loadVehicles();
      } else {
        toast({ title: "Ошибка", description: "Не удалось добавить", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с сервером", variant: "destructive" });
    }
  };

  const deleteVehicle = async (vehicleId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`${AUTH_API}?action=garage&vehicle_id=${vehicleId}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': token },
      });

      if (response.ok) {
        toast({ title: "Техника удалена" });
        onRefresh ? onRefresh() : loadVehicles();
      }
    } catch (error) {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setEditVehicle({
      vehicle_type: vehicle.vehicle_type,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      description: vehicle.description || '',
      mileage: vehicle.mileage || 0,
      modifications: vehicle.modifications || '',
      power_hp: vehicle.power_hp || 0,
      displacement: vehicle.displacement || 0,
    });
    
    try {
      const photos = typeof vehicle.photo_url === 'string' ? JSON.parse(vehicle.photo_url) : vehicle.photo_url;
      setEditPhotoPreviews(Array.isArray(photos) ? photos : []);
    } catch {
      setEditPhotoPreviews([]);
    }
    setEditPhotoFiles([]);
    setIsEditDialogOpen(true);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const totalPhotos = editPhotoPreviews.length + editPhotoFiles.length + files.length;
      const availableSlots = 5 - (editPhotoPreviews.length + editPhotoFiles.length);
      
      if (totalPhotos > 5) {
        toast({
          title: "Превышен лимит фото",
          description: `Можно загрузить максимум 5 фото. Добавлено ${availableSlots} из ${files.length} выбранных.`,
          variant: "destructive",
        });
      }
      
      const filesToAdd = files.slice(0, availableSlots);
      const newFiles = [...editPhotoFiles, ...filesToAdd];
      setEditPhotoFiles(newFiles);
      
      const readers = filesToAdd.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(readers).then(results => {
        setEditPhotoPreviews([...editPhotoPreviews, ...results]);
      });
    }
  };

  const removeEditPhoto = (index: number) => {
    setEditPhotoPreviews(editPhotoPreviews.filter((_, i) => i !== index));
    if (index >= editPhotoPreviews.length - editPhotoFiles.length) {
      const fileIndex = index - (editPhotoPreviews.length - editPhotoFiles.length);
      setEditPhotoFiles(editPhotoFiles.filter((_, i) => i !== fileIndex));
    }
  };

  const updateVehicle = async () => {
    if (!token || !editingVehicle || !editVehicle.brand || !editVehicle.model) {
      toast({
        title: "Заполни обязательные поля",
        description: "Марка и модель обязательны",
        variant: "destructive",
      });
      return;
    }

    try {
      let photoUrls = editPhotoPreviews.filter(p => p.startsWith('http'));
      
      if (editPhotoFiles.length > 0) {
        console.log('[GARAGE] Uploading', editPhotoFiles.length, 'files...');
        const uploadPromises = editPhotoFiles.map(file => 
          uploadFile(file, { folder: 'garage' })
        );
        const uploadResults = await Promise.all(uploadPromises);
        console.log('[GARAGE] Upload results:', uploadResults);
        const uploadedUrls = uploadResults
          .filter(result => result !== null)
          .map(result => result!.url);
        console.log('[GARAGE] Uploaded URLs:', uploadedUrls);
        photoUrls = [...photoUrls, ...uploadedUrls];
      }

      const vehicleData = {
        ...editVehicle,
        photo_url: JSON.stringify(photoUrls),
      };

      console.log('[GARAGE] Updating vehicle', editingVehicle.id, vehicleData);
      const response = await fetch(`${PROFILE_API}?action=garage&vehicle_id=${editingVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify(vehicleData),
      });

      console.log('[GARAGE] Update response:', response.status, response.ok);
      if (response.ok) {
        toast({ title: "Техника обновлена!" });
        setIsEditDialogOpen(false);
        setEditingVehicle(null);
        setEditVehicle(null);
        setEditPhotoFiles([]);
        setEditPhotoPreviews([]);
        onRefresh ? onRefresh() : loadVehicles();
      } else {
        const errorText = await response.text();
        console.error('[GARAGE] Update failed:', errorText);
        toast({ title: "Ошибка", description: "Не удалось обновить", variant: "destructive" });
      }
    } catch (error) {
      console.error('[GARAGE] Exception:', error);
      toast({ title: "Ошибка", description: "Проблема с сервером", variant: "destructive" });
    }
  };

  const getVehicleIcon = (type: string) => {
    const found = [
      { value: 'moto', icon: 'Bike' },
      { value: 'atv', icon: 'Truck' },
      { value: 'snowmobile', icon: 'Snowflake' },
      { value: 'jetski', icon: 'Waves' },
      { value: 'other', icon: 'Wrench' },
    ].find(vt => vt.value === type);
    return found ? found.icon : 'Car';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white">{readonly ? 'Гараж' : 'Мой гараж'}</h3>
          <p className="text-zinc-400 text-sm">Техника: {vehicles.length}</p>
        </div>
        {!readonly && (
          <AddVehicleDialog
            isOpen={isAddDialogOpen}
            setIsOpen={setIsAddDialogOpen}
            newVehicle={newVehicle}
            setNewVehicle={setNewVehicle}
            photoPreviews={photoPreviews}
            handlePhotoChange={handlePhotoChange}
            removePhoto={removePhoto}
            showAdditional={showAdditional}
            setShowAdditional={setShowAdditional}
            onAdd={addVehicle}
            uploading={uploading}
          />
        )}
      </div>

      <EditVehicleDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        editVehicle={editVehicle}
        setEditVehicle={setEditVehicle}
        photoPreviews={editPhotoPreviews}
        handlePhotoChange={handleEditPhotoChange}
        removePhoto={removeEditPhoto}
        showAdditional={showAdditional}
        setShowAdditional={setShowAdditional}
        onUpdate={updateVehicle}
        uploading={uploading}
      />

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="Car" className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">Гараж пуст</p>
          <p className="text-sm text-zinc-500 mt-2">Добавь свою первую технику</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              readonly={readonly}
              onEdit={openEditDialog}
              onDelete={deleteVehicle}
              getVehicleIcon={getVehicleIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
};