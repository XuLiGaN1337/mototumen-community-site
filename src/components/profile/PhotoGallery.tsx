import React, { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";

interface Photo {
  id: number;
  photo_url: string;
  source: string;
  created_at: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onSetAsAvatar?: (photoId: number) => void;
  onRemovePhoto?: (photoId: number) => void;
  onRemoveAvatar?: () => void;
  onUploadPhoto?: (file: File) => void;
  currentAvatarUrl?: string;
  loading?: boolean;
  uploading?: boolean;
  readonly?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onSetAsAvatar,
  onRemovePhoto,
  onUploadPhoto,
  loading,
  uploading,
  readonly = false,
}) => {
  const [carouselIdx, setCarouselIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openCarousel = (idx: number) => setCarouselIdx(idx);
  const closeCarousel = () => setCarouselIdx(null);
  const prev = () => setCarouselIdx((i) => (i !== null ? (i - 1 + photos.length) % photos.length : 0));
  const next = () => setCarouselIdx((i) => (i !== null ? (i + 1) % photos.length : 0));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => onUploadPhoto?.(f));
    e.target.value = "";
  };

  const currentPhoto = carouselIdx !== null ? photos[carouselIdx] : null;

  return (
    <div className="bg-[#252836] rounded-lg p-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
          <Icon name="Images" className="h-4 w-4 text-blue-400" />
          Фотографии
          {photos.length > 0 && (
            <span className="text-xs text-gray-500 font-normal">({photos.length})</span>
          )}
        </h3>
        {!readonly && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || loading || photos.length >= 20}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Icon name="Loader2" size={12} className="animate-spin" />
            ) : (
              <Icon name="Plus" size={12} />
            )}
            {uploading ? "Загрузка..." : "Добавить фото"}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Сетка фото */}
      {photos.length === 0 ? (
        <div className="text-center py-8">
          {readonly ? (
            <p className="text-gray-500 text-sm">Фотографий нет</p>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || loading}
              className="flex flex-col items-center gap-2 mx-auto text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
            >
              <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-600 hover:border-blue-400 flex items-center justify-center transition-colors">
                <Icon name="ImagePlus" size={22} className="text-gray-500" />
              </div>
              <span className="text-xs">Добавить первое фото</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-[#1e2332] cursor-pointer"
              onClick={() => openCarousel(idx)}
            >
              <img
                src={photo.photo_url}
                alt={`Фото ${idx + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {/* Оверлей только для владельца */}
              {!readonly && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1.5 gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetAsAvatar?.(photo.id); }}
                    className="p-1.5 bg-blue-500/90 rounded-full hover:bg-blue-500 transition-colors"
                    title="Сделать аватаром"
                  >
                    <Icon name="UserCheck" size={11} className="text-white" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemovePhoto?.(photo.id); }}
                    className="p-1.5 bg-red-500/90 rounded-full hover:bg-red-500 transition-colors"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={11} className="text-white" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Ячейка добавления */}
          {!readonly && photos.length < 20 && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || loading}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-700 hover:border-blue-500/50 flex items-center justify-center transition-colors bg-[#1e2332] disabled:opacity-40"
            >
              {uploading ? (
                <Icon name="Loader2" size={18} className="text-blue-400 animate-spin" />
              ) : (
                <Icon name="Plus" size={18} className="text-gray-600 group-hover:text-gray-400" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Каруссель — модальное окно */}
      <Dialog open={carouselIdx !== null} onOpenChange={(v) => !v && closeCarousel()}>
        <DialogContent className="bg-zinc-950 border-zinc-800 p-0 max-w-2xl w-full overflow-hidden">
          {currentPhoto && (
            <div className="relative">
              {/* Фото */}
              <div className="relative bg-black flex items-center justify-center min-h-[300px] max-h-[70vh]">
                <img
                  src={currentPhoto.photo_url}
                  alt={`Фото ${(carouselIdx ?? 0) + 1}`}
                  className="max-w-full max-h-[70vh] object-contain"
                />

                {/* Навигация */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                    >
                      <Icon name="ChevronLeft" size={20} className="text-white" />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                    >
                      <Icon name="ChevronRight" size={20} className="text-white" />
                    </button>
                  </>
                )}

                {/* Счётчик */}
                {photos.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === carouselIdx ? "bg-white" : "bg-white/30"}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Панель действий */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-t border-zinc-800">
                <span className="text-gray-500 text-xs">
                  {new Date(currentPhoto.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                  {photos.length > 1 && ` · ${(carouselIdx ?? 0) + 1} / ${photos.length}`}
                </span>
                {!readonly && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onSetAsAvatar?.(currentPhoto.id); closeCarousel(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs transition-colors"
                    >
                      <Icon name="UserCheck" size={13} />
                      Сделать аватаром
                    </button>
                    <button
                      onClick={() => { onRemovePhoto?.(currentPhoto.id); if (photos.length > 1) { setCarouselIdx(Math.min(carouselIdx ?? 0, photos.length - 2)); } else { closeCarousel(); } }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-colors"
                    >
                      <Icon name="Trash2" size={13} />
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoGallery;