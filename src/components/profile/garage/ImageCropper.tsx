import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";

// Соотношение 4:3 — стандарт для карточки техники
const CROP_RATIO = 4 / 3;

interface CropResult {
  croppedDataUrl: string;
  offsetX: number; // px относительно натурального размера
  offsetY: number;
  cropW: number;
  cropH: number;
}

interface ImageCropperProps {
  src: string;
  open: boolean;
  onConfirm: (result: CropResult) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ src, open, onConfirm, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Позиция рамки в % от отображаемого изображения
  const [pos, setPos] = useState({ x: 0, y: 0 });
  // Размер рамки в px (отображаемые пиксели)
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });
  // Размер отображаемого изображения
  const [imgDisplay, setImgDisplay] = useState({ w: 0, h: 0, top: 0, left: 0 });

  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const calcFrame = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const rect = img.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();

    const dispW = rect.width;
    const dispH = rect.height;
    const offsetTop = rect.top - cRect.top;
    const offsetLeft = rect.left - cRect.left;

    setImgDisplay({ w: dispW, h: dispH, top: offsetTop, left: offsetLeft });

    // Рамка занимает максимально возможный размер с соотношением 4:3
    let fw = dispW;
    let fh = fw / CROP_RATIO;
    if (fh > dispH) {
      fh = dispH;
      fw = fh * CROP_RATIO;
    }

    setFrameSize({ w: fw, h: fh });
    // Центрируем рамку
    setPos({
      x: offsetLeft + (dispW - fw) / 2,
      y: offsetTop + (dispH - fh) / 2,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    // Небольшой таймаут чтобы картинка успела отрендериться
    const t = setTimeout(calcFrame, 100);
    return () => clearTimeout(t);
  }, [open, src, calcFrame]);

  // Ограничиваем позицию рамки в пределах изображения
  const clampPos = useCallback((x: number, y: number) => {
    const minX = imgDisplay.left;
    const minY = imgDisplay.top;
    const maxX = imgDisplay.left + imgDisplay.w - frameSize.w;
    const maxY = imgDisplay.top + imgDisplay.h - frameSize.h;
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }, [imgDisplay, frameSize]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setPos(clampPos(dragStart.current.px + dx, dragStart.current.py + dy));
  }, [clampPos]);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  // Touch
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    dragging.current = true;
    dragStart.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y };
  };

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging.current) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.mx;
    const dy = t.clientY - dragStart.current.my;
    setPos(clampPos(dragStart.current.px + dx, dragStart.current.py + dy));
  }, [clampPos]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [onMouseMove, onMouseUp, onTouchMove]);

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const scaleX = natW / imgDisplay.w;
    const scaleY = natH / imgDisplay.h;

    // Позиция рамки относительно изображения (в отображаемых px)
    const relX = pos.x - imgDisplay.left;
    const relY = pos.y - imgDisplay.top;

    // Переводим в натуральные пиксели
    const cropX = Math.round(relX * scaleX);
    const cropY = Math.round(relY * scaleY);
    const cropW = Math.round(frameSize.w * scaleX);
    const cropH = Math.round(frameSize.h * scaleY);

    // Рисуем в canvas
    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    onConfirm({
      croppedDataUrl: canvas.toDataURL("image/jpeg", 0.92),
      offsetX: cropX,
      offsetY: cropY,
      cropW,
      cropH,
    });
  };

  // Кнопки сдвига на 10px
  const move = (dx: number, dy: number) => {
    setPos(p => clampPos(p.x + dx, p.y + dy));
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">Кадрирование фото</p>
          <p className="text-xs text-zinc-500">Перетащи рамку или используй кнопки, чтобы выбрать нужную часть фото</p>
        </div>

        {/* Область с фото и рамкой */}
        <div
          ref={containerRef}
          className="relative w-full bg-black rounded-lg overflow-hidden select-none"
          style={{ minHeight: 240 }}
        >
          <img
            ref={imgRef}
            src={src}
            alt="crop"
            className="w-full object-contain max-h-[50vh]"
            draggable={false}
            onLoad={calcFrame}
          />

          {/* Затемнение вокруг рамки */}
          {frameSize.w > 0 && (
            <>
              {/* top */}
              <div className="absolute bg-black/60 pointer-events-none"
                style={{ left: 0, top: 0, right: 0, height: pos.y }} />
              {/* bottom */}
              <div className="absolute bg-black/60 pointer-events-none"
                style={{ left: 0, top: pos.y + frameSize.h, right: 0, bottom: 0 }} />
              {/* left */}
              <div className="absolute bg-black/60 pointer-events-none"
                style={{ left: 0, top: pos.y, width: pos.x - (containerRef.current?.getBoundingClientRect().left ?? 0) + (containerRef.current ? 0 : 0), height: frameSize.h }} />
              {/* left side relative */}
              <div className="absolute bg-black/60 pointer-events-none"
                style={{ left: imgDisplay.left, top: pos.y, width: pos.x - imgDisplay.left, height: frameSize.h }} />
              {/* right side */}
              <div className="absolute bg-black/60 pointer-events-none"
                style={{ left: pos.x + frameSize.w, top: pos.y, right: 0, height: frameSize.h }} />

              {/* Рамка */}
              <div
                className="absolute border-2 border-white cursor-grab active:cursor-grabbing"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: frameSize.w,
                  height: frameSize.h,
                }}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
              >
                {/* Сетка правила третей */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute border-white/20 border-r" style={{ left: "33.3%", top: 0, bottom: 0, width: 0 }} />
                  <div className="absolute border-white/20 border-r" style={{ left: "66.6%", top: 0, bottom: 0, width: 0 }} />
                  <div className="absolute border-white/20 border-b" style={{ top: "33.3%", left: 0, right: 0, height: 0 }} />
                  <div className="absolute border-white/20 border-b" style={{ top: "66.6%", left: 0, right: 0, height: 0 }} />
                </div>
                {/* Уголки */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#ff6b35]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#ff6b35]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#ff6b35]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#ff6b35]" />
                {/* Иконка перемещения по центру */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/40 rounded-full p-1">
                    <Icon name="Move" size={16} className="text-white/70" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Кнопки сдвига */}
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => move(0, -10)} className="bg-zinc-800 hover:bg-zinc-700 rounded p-1.5"><Icon name="ChevronUp" size={16} /></button>
          <div className="flex gap-1">
            <button onClick={() => move(-10, 0)} className="bg-zinc-800 hover:bg-zinc-700 rounded p-1.5"><Icon name="ChevronLeft" size={16} /></button>
            <button onClick={() => move(0, 10)} className="bg-zinc-800 hover:bg-zinc-700 rounded p-1.5"><Icon name="ChevronDown" size={16} /></button>
            <button onClick={() => move(10, 0)} className="bg-zinc-800 hover:bg-zinc-700 rounded p-1.5"><Icon name="ChevronRight" size={16} /></button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 border-zinc-600 text-gray-300" onClick={onCancel}>
            Отмена
          </Button>
          <Button className="flex-1 bg-[#ff6b35] hover:bg-[#e55a24]" onClick={handleConfirm}>
            <Icon name="Crop" size={15} className="mr-1.5" />
            Применить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
