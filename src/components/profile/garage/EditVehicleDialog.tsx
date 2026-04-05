import React from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VehicleFormFields } from "./VehicleFormFields";

interface EditVehicleDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editVehicle: any;
  setEditVehicle: (vehicle: any) => void;
  photoPreviews: string[];
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  addCroppedPhoto: (dataUrl: string) => void;
  showAdditional: boolean;
  setShowAdditional: (show: boolean) => void;
  onUpdate: () => void;
  uploading: boolean;
}

export const EditVehicleDialog: React.FC<EditVehicleDialogProps> = ({
  isOpen,
  setIsOpen,
  editVehicle,
  setEditVehicle,
  photoPreviews,
  handlePhotoChange,
  removePhoto,
  addCroppedPhoto,
  showAdditional,
  setShowAdditional,
  onUpdate,
  uploading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать технику</DialogTitle>
        </DialogHeader>
        {editVehicle && (
          <>
            <VehicleFormFields
              vehicle={editVehicle}
              setVehicle={setEditVehicle}
              photoPreviews={photoPreviews}
              handlePhotoChange={handlePhotoChange}
              removePhoto={removePhoto}
              addCroppedPhoto={addCroppedPhoto}
              showAdditional={showAdditional}
              setShowAdditional={setShowAdditional}
            />
            <Button 
              onClick={onUpdate} 
              disabled={uploading}
              className="w-full bg-accent hover:bg-accent/90"
            >
              {uploading ? (
                <>
                  <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : "Сохранить"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};