import React, { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Photo {
  id: number;
  photo_url: string;
  source: string;
  created_at: string;
}

interface PhotosGalleryProps {
  photos: Photo[];
  onRemovePhoto: (photoId: number) => void;
  onSetAsAvatar: (photoId: number) => void;
  loading?: boolean;
}

export const PhotosGallery: React.FC<PhotosGalleryProps> = ({
  photos,
  onRemovePhoto,
  onSetAsAvatar,
  loading,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const validPhotos = photos.filter((p) => p.photo_url !== "removed");

  if (validPhotos.length === 0) {
    return (
      <div className="bg-[#252836] rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Icon name="Image" className="h-4 w-4 text-gray-400" />
          Фото профиля
        </h3>
        <p className="text-gray-500 text-sm">Пока нет фотографий</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#252836] rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Icon name="Image" className="h-4 w-4 text-gray-400" />
          Фото профиля
          <span className="text-xs text-gray-500">({validPhotos.length})</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {validPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.photo_url}
                alt=""
                className="w-full h-full object-contain bg-zinc-900"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={!!selectedPhoto}
        onOpenChange={() => setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-lg bg-[#252836] text-white border-gray-700 p-2">
          <DialogHeader className="px-2 pt-2">
            <DialogTitle className="text-sm text-gray-400">
              {selectedPhoto?.source === "avatar"
                ? "Бывший аватар"
                : "Фото профиля"}
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <>
              <img
                src={selectedPhoto.photo_url}
                alt=""
                className="w-full rounded-lg"
              />
              <div className="flex gap-2 px-2 pb-2">
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    onSetAsAvatar(selectedPhoto.id);
                    setSelectedPhoto(null);
                  }}
                  disabled={loading}
                >
                  <Icon name="User" className="h-4 w-4 mr-1" />
                  Сделать аватаром
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    onRemovePhoto(selectedPhoto.id);
                    setSelectedPhoto(null);
                  }}
                  disabled={loading}
                >
                  <Icon name="Trash2" className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotosGallery;