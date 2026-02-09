import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop'; 
import { X, ZoomIn, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import getCroppedImg from '../../../utils/cropUtils';
import ModalPortal from '../../utils/ModalPortal'; 

const ImageCropperModal = ({ imageSrc, onCancel, onCropComplete, isUploading }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
      toast.error("Failed to process image");
    }
  };

  return (
    <ModalPortal>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity z-[9999]" onClick={onCancel} />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-[var(--bg-card)] w-full max-w-md h-[500px] max-h-[90vh] rounded-2xl border border-[var(--border-color)] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
          
          {/* 1. Header (Fixed Height) */}
          <div className="flex-none p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] z-10">
            <h3 className="font-bold text-[var(--text-primary)]">Adjust Profile Photo</h3>
            <button 
              onClick={onCancel} 
              disabled={isUploading} 
              className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 2. Cropper Canvas (Takes remaining height) */}
          <div className="flex-1 relative bg-[#141517] w-full">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}          
              cropShape="round"
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteHandler}
            />
          </div>

          {/* 3. Controls (Fixed Height at Bottom) */}
          <div className="flex-none p-5 space-y-5 bg-[var(--bg-card)] border-t border-[var(--border-color)] z-10">
            {/* Zoom Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] font-medium">
                  <span className="flex items-center gap-1"><ZoomIn size={14}/> Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom Image"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isUploading}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] font-medium hover:bg-[var(--bg-secondary)] transition-colors text-sm text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isUploading}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent-color)] text-white font-bold hover:brightness-110 transition-all text-sm flex items-center justify-center gap-2"
              >
                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} 
                {isUploading ? "Uploading..." : "Save & Upload"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};

export default ImageCropperModal;