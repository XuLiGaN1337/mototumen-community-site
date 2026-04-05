import React from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VehicleFormFields } from "./VehicleFormFields";

interface AddVehicleDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  newVehicle: any;
  setNewVehicle: (vehicle: any) => void;
  photoPreviews: string[];
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  addCroppedPhoto: (dataUrl: string) => void;
  showAdditional: boolean;
  setShowAdditional: (show: boolean) => void;
  onAdd: () => void;
  uploading: boolean;
}

export const AddVehicleDialog: React.FC<AddVehicleDialogProps> = ({
  isOpen,
  setIsOpen,
  newVehicle,
  setNewVehicle,
  photoPreviews,
  handlePhotoChange,
  removePhoto,
  addCroppedPhoto,
  showAdditional,
  setShowAdditional,
  onAdd,
  uploading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90">
          <Icon name="Plus" className="h-4 w-4 mr-2" />
          Добавить технику
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить технику</DialogTitle>
        </DialogHeader>
        <VehicleFormFields
          vehicle={newVehicle}
          setVehicle={setNewVehicle}
          photoPreviews={photoPreviews}
          handlePhotoChange={handlePhotoChange}
          removePhoto={removePhoto}
          addCroppedPhoto={addCroppedPhoto}
          showAdditional={showAdditional}
          setShowAdditional={setShowAdditional}
        />
        <Button 
          onClick={onAdd} 
          disabled={uploading}
          className="w-full bg-accent hover:bg-accent/90"
        >
          {uploading ? (
            <>
              <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
              Загрузка...
            </>
          ) : "Добавить"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};