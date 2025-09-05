import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Link, Trash2, Image as ImageIcon, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedImageUploadProps {
  onImageChange: (imageUrl: string | null, metadata?: ImageMetadata) => void;
  currentImage?: string | null;
  description?: string;
  className?: string;
  showScreenshot?: boolean;
  disabled?: boolean;
  allowMultiple?: boolean;
  onMultipleImagesChange?: (images: ImageUploadResult[]) => void;
}

interface ImageMetadata {
  originalName: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  source: 'upload' | 'screenshot' | 'url';
}

interface ImageUploadResult {
  url: string;
  metadata: ImageMetadata;
}

interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export const EnhancedImageUpload = ({ 
  onImageChange, 
  currentImage, 
  description = "", 
  className = "",
  showScreenshot = true,
  disabled = false,
  allowMultiple = false,
  onMultipleImagesChange
}: EnhancedImageUploadProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(currentImage || null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [detectedUrls, setDetectedUrls] = useState<string[]>([]);
  const [captureErrors, setCaptureErrors] = useState<string[]>([]);
  const [multipleImages, setMultipleImages] = useState<ImageUploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Extract URLs from description
  const extractUrls = useCallback((text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? [...new Set(matches)] : [];
  }, []);

  // Update detected URLs when description changes
  useEffect(() => {
    const urls = extractUrls(description);
    setDetectedUrls(urls);
  }, [description, extractUrls]);

  const updateProgress = (status: UploadProgress['status'], progress: number, message: string) => {
    setUploadProgress({ status, progress, message });
  };

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
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (allowMultiple) {
        handleMultipleFiles(files);
      } else {
        handleFileSelection(files[0]);
      }
    }
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelection = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    updateProgress('processing', 25, 'Processing image...');

    try {
      // Get original dimensions
      const dimensions = await getImageDimensions(file);
      
      // Compress if needed (preserve original dimensions but optimize for web)
      const processedFile = await compressImage(file, 1920, 0.85);
      
      updateProgress('uploading', 50, 'Uploading to storage...');

      // Upload to Supabase Storage
      const fileName = `idea-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('idea-images')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      updateProgress('uploading', 80, 'Getting image URL...');

      const { data: urlData } = supabase.storage
        .from('idea-images')
        .getPublicUrl(fileName);

      const metadata: ImageMetadata = {
        originalName: file.name,
        size: file.size,
        type: file.type,
        width: dimensions.width,
        height: dimensions.height,
        source: 'upload'
      };

      setImagePreview(urlData.publicUrl);
      onImageChange(urlData.publicUrl, metadata);

      updateProgress('complete', 100, 'Upload complete!');

      toast({
        title: "Image uploaded successfully! 📸",
        description: "Your image has been uploaded and optimized.",
      });

      setTimeout(() => {
        setUploadProgress({ status: 'idle', progress: 0, message: '' });
      }, 2000);

    } catch (error: any) {
      console.error('Error uploading image:', error);
      updateProgress('error', 0, 'Upload failed');
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMultipleFiles = async (files: File[]) => {
    if (!allowMultiple || !onMultipleImagesChange) return;

    updateProgress('processing', 0, 'Processing multiple images...');
    const results: ImageUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = ((i + 1) / files.length) * 100;
      
      updateProgress('uploading', progress, `Uploading image ${i + 1} of ${files.length}...`);
      
      try {
        const dimensions = await getImageDimensions(file);
        const processedFile = await compressImage(file, 1920, 0.85);
        
        const fileName = `idea-${Date.now()}-${i}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('idea-images')
          .upload(fileName, processedFile);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('idea-images')
          .getPublicUrl(fileName);

        results.push({
          url: urlData.publicUrl,
          metadata: {
            originalName: file.name,
            size: file.size,
            type: file.type,
            width: dimensions.width,
            height: dimensions.height,
            source: 'upload'
          }
        });
      } catch (error) {
        console.error(`Error uploading file ${i + 1}:`, error);
      }
    }

    setMultipleImages(results);
    onMultipleImagesChange(results);
    updateProgress('complete', 100, `Uploaded ${results.length} images successfully!`);

    toast({
      title: "Multiple images uploaded! 📸",
      description: `Successfully uploaded ${results.length} out of ${files.length} images.`,
    });
  };

  const captureScreenshots = async () => {
    if (detectedUrls.length === 0) {
      toast({
        title: "No URLs found",
        description: "Please include valid URLs in the description to capture screenshots.",
        variant: "destructive",
      });
      return;
    }

    updateProgress('processing', 0, 'Capturing screenshots...');
    setCaptureErrors([]);
    
    const results: ImageUploadResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < detectedUrls.length; i++) {
      const url = detectedUrls[i];
      const progress = ((i + 1) / detectedUrls.length) * 100;
      
      updateProgress('processing', progress, `Capturing screenshot ${i + 1} of ${detectedUrls.length}...`);

      try {
        const { data, error } = await supabase.functions.invoke('capture-screenshot', {
          body: { url }
        });

        if (error) throw error;

        if (data?.success && data?.imageUrl) {
          results.push({
            url: data.imageUrl,
            metadata: {
              originalName: `screenshot-${i + 1}.png`,
              size: 0,
              type: 'image/png',
              source: 'screenshot'
            }
          });
        } else {
          throw new Error(data?.error || 'Failed to capture screenshot');
        }
      } catch (error: any) {
        console.error(`Error capturing screenshot for ${url}:`, error);
        errors.push(`${url}: ${error.message}`);
      }
    }

    setCaptureErrors(errors);
    
    if (results.length > 0) {
      if (allowMultiple && onMultipleImagesChange) {
        setMultipleImages(results);
        onMultipleImagesChange(results);
      } else {
        // Use first screenshot for single image mode
        setImagePreview(results[0].url);
        onImageChange(results[0].url, results[0].metadata);
      }

      updateProgress('complete', 100, `Captured ${results.length} screenshots!`);
      
      toast({
        title: "Screenshots captured! 📸",
        description: `Successfully captured ${results.length} screenshot${results.length > 1 ? 's' : ''} from URLs.`,
      });
    } else {
      updateProgress('error', 0, 'Failed to capture screenshots');
      toast({
        title: "Screenshot capture failed",
        description: "Unable to capture screenshots from the provided URLs.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (allowMultiple && files.length > 1) {
      handleMultipleFiles(files);
    } else {
      handleFileSelection(files[0]);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setMultipleImages([]);
    setUploadProgress({ status: 'idle', progress: 0, message: '' });
    onImageChange(null);
    if (onMultipleImagesChange) {
      onMultipleImagesChange([]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retry = () => {
    setUploadProgress({ status: 'idle', progress: 0, message: '' });
    setCaptureErrors([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Indicator */}
      {uploadProgress.status !== 'idle' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{uploadProgress.message}</span>
            <span className="text-muted-foreground">{uploadProgress.progress}%</span>
          </div>
          <Progress value={uploadProgress.progress} className="h-2" />
        </div>
      )}

      {/* Error Display */}
      {uploadProgress.status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Upload failed. Please try again.</span>
            <Button size="sm" variant="outline" onClick={retry}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {uploadProgress.status === 'complete' && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            {uploadProgress.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Image Preview */}
      {(imagePreview || multipleImages.length > 0) && (
        <div className="space-y-3">
          {imagePreview && (
            <div className="relative">
              <img 
                src={imagePreview}
                alt="Preview" 
                className="w-full max-h-64 object-contain rounded-lg border bg-muted"
                loading="lazy"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeImage}
                disabled={disabled || uploadProgress.status === 'uploading'}
                className="absolute top-2 right-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {multipleImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {multipleImages.map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                    loading="lazy"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                    {image.metadata.source === 'screenshot' ? '📸' : '🖼️'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      {!imagePreview && multipleImages.length === 0 && (
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            {isDragging ? 'Drop your images here' : 'Upload Images'}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Drag & drop images or click to browse
            {allowMultiple && ' (multiple files supported)'}
          </p>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={disabled || uploadProgress.status === 'uploading'}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
              
              {showScreenshot && detectedUrls.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    captureScreenshots();
                  }}
                  disabled={disabled || uploadProgress.status === 'processing'}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Capture Screenshots ({detectedUrls.length})
                </Button>
              )}
            </div>

            {detectedUrls.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <p className="mb-1">Detected URLs:</p>
                <ul className="space-y-1">
                  {detectedUrls.slice(0, 3).map((url, index) => (
                    <li key={index} className="truncate">{url}</li>
                  ))}
                  {detectedUrls.length > 3 && (
                    <li>+{detectedUrls.length - 3} more...</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Capture Errors */}
      {captureErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Some screenshots failed to capture:</p>
            <ul className="text-sm space-y-1">
              {captureErrors.map((error, index) => (
                <li key={index} className="truncate">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={allowMultiple}
        onChange={handleImageUpload}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground text-center">
        Upload images (max 10MB each), drag & drop, or capture from URLs. 
        Original dimensions preserved with web optimization.
        {allowMultiple && ' Multiple images supported.'}
      </p>
    </div>
  );
};