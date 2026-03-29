import React, { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface Photo {
  id: number;
  photo_url: string;
  source: string;
  created_at: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onSetAsAvatar: (photoId: number) => void;
  onRemovePhoto: (photoId: number) => void;
  onRemoveAvatar: () => void;
  currentAvatarUrl?: string;
  loading?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onSetAsAvatar,
  onRemovePhoto,
  onRemoveAvatar,
  currentAvatarUrl,
  loading,
}) => {
  const [viewPhoto, setViewPhoto] = useState<Photo | null>(null);

  if (!photos.length && !currentAvatarUrl) return null;

  return (
    <div className="bg-[#252836] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Icon name="Image" className="h-4 w-4 text-blue-400" />
          Фото профиля
        </h3>
        {currentAvatarUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveAvatar}
            disabled={loading}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
          >
            <Icon name="Trash2" className="h-3 w-3 mr-1" />
            Убрать аватар
          </Button>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="text-gray-500 text-sm">Предыдущих фото нет</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-[#1e2332]"
            >
              <img
                src={photo.photo_url}
                alt="Фото"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setViewPhoto(photo)}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  onClick={() => onSetAsAvatar(photo.id)}
                  className="p-1.5 bg-blue-500/80 rounded-full hover:bg-blue-500 transition-colors"
                  title="Установить как аватар"
                >
                  <Icon name="UserCheck" className="h-3 w-3 text-white" />
                </button>
                <button
                  onClick={() => onRemovePhoto(photo.id)}
                  className="p-1.5 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                  title="Удалить"
                >
                  <Icon name="Trash2" className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewPhoto(null)}
        >
          <div className="relative max-w-2xl w-full">
            <img
              src={viewPhoto.photo_url}
              alt="Фото"
              className="w-full rounded-lg"
            />
            <button
              onClick={() => setViewPhoto(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors"
            >
              <Icon name="X" className="h-5 w-5 text-white" />
            </button>
            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetAsAvatar(viewPhoto.id);
                  setViewPhoto(null);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Icon name="UserCheck" className="h-4 w-4 mr-1" />
                Сделать аватаром
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePhoto(viewPhoto.id);
                  setViewPhoto(null);
                }}
              >
                <Icon name="Trash2" className="h-4 w-4 mr-1" />
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;