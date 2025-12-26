
import React, { useRef, useState, useEffect } from 'react';

interface ImageCropperProps {
  src: string;
  onComplete: (croppedBase64: string) => void;
  onCancel: () => void;
}

type HandleType = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'move';

const ImageCropper: React.FC<ImageCropperProps> = ({ src, onComplete, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [rect, setRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<HandleType | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setRect({
        x: 0,
        y: 0,
        w: image.width,
        h: image.height
      });
    };
    image.src = src;
  }, [src]);

  useEffect(() => {
    if (!img || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = img.width;
    canvasRef.current.height = img.height;

    ctx.clearRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, img.width, rect.y); 
    ctx.fillRect(0, rect.y + rect.h, img.width, img.height - (rect.y + rect.h)); 
    ctx.fillRect(0, rect.y, rect.x, rect.h); 
    ctx.fillRect(rect.x + rect.w, rect.y, img.width - (rect.x + rect.w), rect.h); 

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = Math.max(2, img.width / 300);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    
    ctx.fillStyle = '#3b82f6';
    const handleSize = Math.max(12, img.width / 60);
    const half = handleSize / 2;

    // Draw 4 corners
    ctx.fillRect(rect.x - half, rect.y - half, handleSize, handleSize); // Top-Left
    ctx.fillRect(rect.x + rect.w - half, rect.y - half, handleSize, handleSize); // Top-Right
    ctx.fillRect(rect.x - half, rect.y + rect.h - half, handleSize, handleSize); // Bottom-Left
    ctx.fillRect(rect.x + rect.w - half, rect.y + rect.h - half, handleSize, handleSize); // Bottom-Right
  }, [img, rect]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const x = (e.clientX - bounds.left) * scaleX;
    const y = (e.clientY - bounds.top) * scaleY;

    const handleSize = Math.max(16, canvas.width / 40);
    const half = handleSize / 1.5;

    if (Math.abs(x - rect.x) < half && Math.abs(y - rect.y) < half) setDragType('top-left');
    else if (Math.abs(x - (rect.x + rect.w)) < half && Math.abs(y - rect.y) < half) setDragType('top-right');
    else if (Math.abs(x - rect.x) < half && Math.abs(y - (rect.y + rect.h)) < half) setDragType('bottom-left');
    else if (Math.abs(x - (rect.x + rect.w)) < half && Math.abs(y - (rect.h + rect.y)) < half) setDragType('bottom-right');
    else if (x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h) setDragType('move');
    else return;

    setIsDragging(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current || !dragType) return;
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const x = (e.clientX - bounds.left) * scaleX;
    const y = (e.clientY - bounds.top) * scaleY;

    const dx = x - startPos.x;
    const dy = y - startPos.y;

    setRect(prev => {
      let { x: rx, y: ry, w: rw, h: rh } = prev;
      
      switch (dragType) {
        case 'move':
          rx = Math.max(0, Math.min(canvas.width - rw, rx + dx));
          ry = Math.max(0, Math.min(canvas.height - rh, ry + dy));
          break;
        case 'top-left':
          const ntlX = Math.max(0, Math.min(rx + rw - 20, rx + dx));
          const ntlY = Math.max(0, Math.min(ry + rh - 20, ry + dy));
          rw = rw + (rx - ntlX);
          rh = rh + (ry - ntlY);
          rx = ntlX;
          ry = ntlY;
          break;
        case 'top-right':
          rw = Math.max(20, Math.min(canvas.width - rx, rw + dx));
          const ntrY = Math.max(0, Math.min(ry + rh - 20, ry + dy));
          rh = rh + (ry - ntrY);
          ry = ntrY;
          break;
        case 'bottom-left':
          const nblX = Math.max(0, Math.min(rx + rw - 20, rx + dx));
          rw = rw + (rx - nblX);
          rx = nblX;
          rh = Math.max(20, Math.min(canvas.height - ry, rh + dy));
          break;
        case 'bottom-right':
          rw = Math.max(20, Math.min(canvas.width - rx, rw + dx));
          rh = Math.max(20, Math.min(canvas.height - ry, rh + dy));
          break;
      }
      return { x: rx, y: ry, w: rw, h: rh };
    });

    setStartPos({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  const finalizeCrop = () => {
    if (!img) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = rect.w;
    tempCanvas.height = rect.h;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
    onComplete(tempCanvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col items-center gap-4">
        <h3 className="text-white text-xl font-bold">Crop Receipt Area</h3>
        <p className="text-gray-400 text-xs sm:text-sm text-center">Drag inside to move. Drag any of the 4 corner dots to resize.</p>
        
        <div className="relative overflow-auto max-h-[70vh] border-2 border-dashed border-gray-600 rounded">
          <canvas 
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair max-w-full"
            style={{ touchAction: 'none' }}
          />
        </div>

        <div className="flex gap-4">
          <button onClick={onCancel} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button onClick={finalizeCrop} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold">
            Confirm Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
