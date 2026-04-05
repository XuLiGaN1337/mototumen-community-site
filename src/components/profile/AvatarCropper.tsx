import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface AvatarCropperProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (blob: Blob) => void;
}

const SIZE = 320; // размер canvas и круга

export const AvatarCropper: React.FC<AvatarCropperProps> = ({
  open,
  imageSrc,
  onClose,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // позиция и масштаб изображения
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 });
  const [imgDisplaySize, setImgDisplaySize] = useState({ w: SIZE, h: SIZE });

  // drag
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Загружаем картинку, выставляем начальный масштаб чтобы покрывала круг
  const initImage = useCallback(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const { naturalWidth: nw, naturalHeight: nh } = img;
      setImgNaturalSize({ w: nw, h: nh });
      const initScale = Math.max(SIZE / nw, SIZE / nh);
      setScale(initScale);
      const dw = nw * initScale;
      const dh = nh * initScale;
      setImgDisplaySize({ w: dw, h: dh });
      setOffset({ x: (SIZE - dw) / 2, y: (SIZE - dh) / 2 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (open && imageSrc) initImage();
  }, [open, imageSrc, initImage]);

  // Перерисовка canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = SIZE;
    canvas.height = SIZE;

    // Тёмный фон
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Рисуем изображение
    const dw = imgNaturalSize.w * scale;
    const dh = imgNaturalSize.h * scale;
    ctx.drawImage(img, offset.x, offset.y, dw, dh);

    // Затемняем всё кроме круга
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Обводка круга
    ctx.save();
    ctx.strokeStyle = "rgba(255,107,53,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [offset, scale, imgNaturalSize]);

  // Clamp offset чтобы изображение не уходило из круга
  const clamp = useCallback(
    (ox: number, oy: number, sc: number) => {
      const dw = imgNaturalSize.w * sc;
      const dh = imgNaturalSize.h * sc;
      const minX = SIZE - dw;
      const minY = SIZE - dh;
      return {
        x: Math.min(0, Math.max(minX, ox)),
        y: Math.min(0, Math.max(minY, oy)),
      };
    },
    [imgNaturalSize]
  );

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setOffset((prev) => clamp(prev.x + dx, prev.y + dy, scale));
    },
    [scale, clamp]
  );
  const onMouseUp = () => { dragging.current = false; };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setOffset((prev) => clamp(prev.x + dx, prev.y + dy, scale));
    },
    [scale, clamp]
  );
  const onTouchEnd = () => { dragging.current = false; };

  // Зум колёсиком
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setScale((prev) => {
        const minScale = Math.max(SIZE / imgNaturalSize.w, SIZE / imgNaturalSize.h);
        const next = Math.min(5, Math.max(minScale, prev + delta));
        setOffset((o) => clamp(o.x, o.y, next));
        setImgDisplaySize({ w: imgNaturalSize.w * next, h: imgNaturalSize.h * next });
        return next;
      });
    },
    [imgNaturalSize, clamp]
  );

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minScale = Math.max(SIZE / imgNaturalSize.w, SIZE / imgNaturalSize.h);
    const next = Math.min(5, Math.max(minScale, parseFloat(e.target.value)));
    setScale(next);
    setImgDisplaySize({ w: imgNaturalSize.w * next, h: imgNaturalSize.h * next });
    setOffset((o) => clamp(o.x, o.y, next));
  };

  // Сохранение — вырезаем круг в отдельный canvas
  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;

    const out = document.createElement("canvas");
    out.width = SIZE;
    out.height = SIZE;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    // Круговая маска
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const dw = imgNaturalSize.w * scale;
    const dh = imgNaturalSize.h * scale;
    ctx.drawImage(img, offset.x, offset.y, dw, dh);

    out.toBlob((blob) => {
      if (blob) onSave(blob);
    }, "image/jpeg", 0.92);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-sm p-5">
        <DialogHeader>
          <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
            <Icon name="Crop" size={16} className="text-orange-400" />
            Редактор аватара
          </DialogTitle>
        </DialogHeader>

        <p className="text-gray-500 text-xs mb-3">
          Перетащи фото чтобы выставить нужную часть. Прокрути для масштабирования.
        </p>

        {/* Canvas */}
        <div className="flex justify-center mb-3">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className="rounded-full cursor-grab active:cursor-grabbing touch-none"
            style={{ width: SIZE, height: SIZE, userSelect: "none" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onWheel={onWheel}
          />
        </div>

        {/* Слайдер масштаба */}
        <div className="flex items-center gap-2 mb-4">
          <Icon name="ZoomOut" size={14} className="text-gray-500 flex-shrink-0" />
          <input
            type="range"
            min={Math.max(SIZE / (imgNaturalSize.w || 1), SIZE / (imgNaturalSize.h || 1))}
            max={5}
            step={0.01}
            value={scale}
            onChange={handleScaleChange}
            className="flex-1 accent-orange-500"
          />
          <Icon name="ZoomIn" size={14} className="text-gray-500 flex-shrink-0" />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-zinc-600 text-gray-300"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSave}
          >
            <Icon name="Check" size={15} className="mr-1.5" />
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
