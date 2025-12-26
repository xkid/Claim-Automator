
import React, { useRef, useState, useEffect } from 'react';

interface ImageCropperProps {
  src: string;
  onComplete: (croppedBase64: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ src, onComplete, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [rect, setRect] = useState({ x: 50, y: 50, w: 200, h: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setImg(image);
      // Center the initial crop box
      const initialW = Math.min(200, image.width * 0.5);
      const initialH = Math.min(300, image.height * 0.5);
      setRect({
        x: (image.width - initialW) / 2,
        y: (image.height - initialH) / 2,
        w: initialW,
        h: initialH
      });
    };
    image.src = src;
  }, [src]);

  useEffect(() => {
    if (!img || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to image dimensions
    canvasRef.current.width = img.width;
    canvasRef.current.height = img.height;

    // Clear
    ctx.clearRect(0, 0, img.width, img.height);
    
    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Darken everything outside crop box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, img.width, rect.y); // Top
    ctx.fillRect(0, rect.y + rect.h, img.width, img.height - (rect.y + rect.h)); // Bottom
    ctx.fillRect(0, rect.y, rect.x, rect.h); // Left
    ctx.fillRect(rect.x + rect.w, rect.y, img.width - (rect.x + rect.w), rect.h); // Right

    // Draw box border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    
    // Draw corners for resize
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(rect.x + rect.w - 10, rect.y + rect.h - 10, 20, 20);
  }, [img, rect]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const x = (e.clientX - bounds.left) * scaleX;
    const y = (e.clientY - bounds.top) * scaleY;

    // Check if clicking resize handle (bottom-right)
    if (Math.abs(x - (rect.x + rect.w)) < 20 && Math.abs(y - (rect.y + rect.h)) < 20) {
      setDragType('resize');
    } else if (x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h) {
      setDragType('move');
    } else {
      return;
    }

    setIsDragging(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const x = (e.clientX - bounds.left) * scaleX;
    const y = (e.clientY - bounds.top) * scaleY;

    const dx = x - startPos.x;
    const dy = y - startPos.y;

    if (dragType === 'move') {
      setRect(prev => ({
        ...prev,
        x: Math.max(0, Math.min(canvas.width - prev.w, prev.x + dx)),
        y: Math.max(0, Math.min(canvas.height - prev.h, prev.y + dy))
      }));
    } else if (dragType === 'resize') {
      setRect(prev => ({
        ...prev,
        w: Math.max(20, Math.min(canvas.width - prev.x, prev.w + dx)),
        h: Math.max(20, Math.min(canvas.height - prev.y, prev.h + dy))
      }));
    }

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
        <p className="text-gray-400 text-sm">Drag to move, use bottom-right handle to resize</p>
        
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
          <button 
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={finalizeCrop}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold"
          >
            Confirm Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
