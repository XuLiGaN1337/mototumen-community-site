import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface AvatarCropperProps {
  open: boolean;
  imageSrc: string; // всегда оригинал
  onClose: () => void;
  // возвращает оригинальный blob + параметры кадра для превью
  onSave: (originalBlob: Blob, previewDataUrl: string) => void;
}

const SIZE = 320;

export const AvatarCropper: React.FC<AvatarCropperProps> = ({
  open,
  imageSrc,
  onClose,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 });

  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

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

    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, SIZE, SIZE);

    const dw = imgNaturalSize.w * scale;
    const dh = imgNaturalSize.h * scale;
    ctx.drawImage(img, offset.x, offset.y, dw, dh);

    // Затемнение за кругом
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Обводка
    ctx.save();
    ctx.strokeStyle = "rgba(255,107,53,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [offset, scale, imgNaturalSize]);

  const clamp = useCallback(
    (ox: number, oy: number, sc: number) => {
      const dw = imgNaturalSize.w * sc;
      const dh = imgNaturalSize.h * sc;
      return {
        x: Math.min(0, Math.max(SIZE - dw, ox)),
        y: Math.min(0, Math.max(SIZE - dh, oy)),
      };
    },
    [imgNaturalSize]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => clamp(prev.x + dx, prev.y + dy, scale));
  }, [scale, clamp]);
  const onMouseUp = () => { dragging.current = false; };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset((prev) => clamp(prev.x + dx, prev.y + dy, scale));
  }, [scale, clamp]);
  const onTouchEnd = () => { dragging.current = false; };

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((prev) => {
      const minScale = Math.max(SIZE / imgNaturalSize.w, SIZE / imgNaturalSize.h);
      const next = Math.min(5, Math.max(minScale, prev + delta));
      setOffset((o) => clamp(o.x, o.y, next));
      return next;
    });
  }, [imgNaturalSize, clamp]);

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minScale = Math.max(SIZE / imgNaturalSize.w, SIZE / imgNaturalSize.h);
    const next = Math.min(5, Math.max(minScale, parseFloat(e.target.value)));
    setScale(next);
    setOffset((o) => clamp(o.x, o.y, next));
  };

  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;

    // 1. Превью — круговая обрезка для отображения в UI
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = SIZE;
    previewCanvas.height = SIZE;
    const pCtx = previewCanvas.getContext("2d");
    if (!pCtx) return;
    pCtx.beginPath();
    pCtx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    pCtx.clip();
    pCtx.drawImage(img, offset.x, offset.y, imgNaturalSize.w * scale, imgNaturalSize.h * scale);
    const previewDataUrl = previewCanvas.toDataURL("image/jpeg", 0.92);

    // 2. Оригинал — полное изображение без обрезки, для хранения
    const origCanvas = document.createElement("canvas");
    origCanvas.width = imgNaturalSize.w;
    origCanvas.height = imgNaturalSize.h;
    const oCtx = origCanvas.getContext("2d");
    if (!oCtx) return;
    oCtx.drawImage(img, 0, 0);
    origCanvas.toBlob((blob) => {
      if (blob) onSave(blob, previewDataUrl);
    }, "image/jpeg", 0.95);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-sm p-5">
        <DialogHeader>
          <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
            <Icon name="Move" size={16} className="text-orange-400" />
            Выбор центра аватара
          </DialogTitle>
        </DialogHeader>

        <p className="text-gray-500 text-xs mb-3">
          Перетащи фото чтобы выставить нужный центр. Колёсико — масштаб.
        </p>

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
          <Button variant="outline" className="flex-1 border-zinc-600 text-gray-300" onClick={onClose}>
            Отмена
          </Button>
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleSave}>
            <Icon name="Check" size={15} className="mr-1.5" />
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};