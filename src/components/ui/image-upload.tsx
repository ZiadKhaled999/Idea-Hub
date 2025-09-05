import { useState, useRef, useCallback } from 'react';
import { Upload, Link, Trash2, Crop as CropIcon, Save, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageUploadProps {
  onImageChange: (imageUrl: string | null) => void;
  currentImage?: string | null;
  description?: string;
  className?: string;
  showScreenshot?: boolean;
  disabled?: boolean;
}

export const ImageUpload = ({ 
  onImageChange, 
  currentImage, 
  description = "", 
  className = "",
  showScreenshot = true,
  disabled = false
}: ImageUploadProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState<CropType>();
  const [imgRef, setImgRef] = useState<HTMLImageElement>();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      onImageChange(result);
      
      toast({
        title: "Image uploaded! 📸",
        description: "Your image is ready. You can crop it if needed.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFileSelection(file);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setImgRef(e.currentTarget);
    
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        16 / 9,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, []);

  const getCroppedImage = useCallback((): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!imgRef || !crop || !imageFile) {
        reject(new Error('Missing image or crop data'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No 2d context'));
        return;
      }

      const scaleX = imgRef.naturalWidth / imgRef.width;
      const scaleY = imgRef.naturalHeight / imgRef.height;

      canvas.width = crop.width! * scaleX;
      canvas.height = crop.height! * scaleY;

      ctx.drawImage(
        imgRef,
        crop.x! * scaleX,
        crop.y! * scaleY,
        crop.width! * scaleX,
        crop.height! * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], imageFile.name, { type: imageFile.type });
        resolve(file);
      }, imageFile.type);
    });
  }, [imgRef, crop, imageFile]);

  const applyCrop = async () => {
    try {
      const croppedFile = await getCroppedImage();
      setImageFile(croppedFile);
      
      // Update preview with cropped version
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        onImageChange(result);
      };
      reader.readAsDataURL(croppedFile);
      
      setShowCrop(false);
      toast({
        title: "Image cropped successfully! ✂️",
        description: "Your image has been cropped and is ready to use.",
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: "Crop failed",
        description: "Failed to crop image. Using original instead.",
        variant: "destructive",
      });
      setShowCrop(false);
    }
  };

  const captureScreenshot = async () => {
    const urls = description.match(/(https?:\/\/[^\s]+)/g);
    if (!urls || urls.length === 0) {
      toast({
        title: "No URL found",
        description: "Please include a valid URL in the description to capture a screenshot.",
        variant: "destructive",
      });
      return;
    }

    setIsScreenshotting(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-screenshot', {
        body: { url: urls[0] }
      });

      if (error) throw error;

      if (data?.success && data?.imageUrl) {
        setImagePreview(data.imageUrl);
        onImageChange(data.imageUrl);
        toast({
          title: "Screenshot captured! 📸",
          description: "Website screenshot has been added as your idea image.",
        });
      } else {
        throw new Error(data?.error || 'Failed to capture screenshot');
      }
    } catch (error: any) {
      console.error('Error capturing screenshot:', error);
      toast({
        title: "Screenshot failed",
        description: "Failed to capture screenshot. Please try uploading an image instead.",
        variant: "destructive",
      });
    } finally {
      setIsScreenshotting(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setShowCrop(false);
    setCrop(undefined);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {showCrop && imagePreview ? (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Crop your image to the desired size:
          </div>
          <div className="relative max-h-80 overflow-hidden rounded-lg border">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={16 / 9}
              minWidth={100}
              minHeight={56}
            >
              <img
                ref={setImgRef}
                src={imagePreview}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-w-full h-auto"
              />
            </ReactCrop>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={applyCrop}
              className="flex-1"
              disabled={disabled}
            >
              <Save className="h-4 w-4 mr-2" />
              Apply Crop
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCrop(false)}
              disabled={disabled}
            >
              Skip Crop
            </Button>
          </div>
        </div>
      ) : imagePreview ? (
        <div className="relative">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="w-full max-h-48 object-cover rounded-lg border"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowCrop(true)}
              disabled={disabled}
            >
              <CropIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeImage}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {isDragging ? 'Drop your image here' : 'Drop files here or use the buttons below'}
          </p>
          <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
            {showScreenshot && (
              <Button
                type="button"
                variant="outline"
                onClick={captureScreenshot}
                disabled={isScreenshotting || disabled}
                className="w-full"
              >
                <Link className="h-4 w-4 mr-2" />
                {isScreenshotting ? 'Capturing...' : 'Screenshot URL'}
              </Button>
            )}
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <p className="text-xs text-muted-foreground text-center">
        Upload an image (max 5MB), drag & drop, or capture from URL. Original dimensions preserved unless cropped.
      </p>
    </div>
  );
};