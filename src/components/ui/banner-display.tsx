import { useState } from 'react';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent } from './dialog';

interface BannerDisplayProps {
  images: string | string[];
  alt: string;
  className?: string;
  aspectRatio?: "auto" | "16/9" | "4/3" | "1/1" | "21/9";
  showGradient?: boolean;
  allowFullscreen?: boolean;
  showCarousel?: boolean;
  fallbackSrc?: string;
}

export const BannerDisplay = ({ 
  images, 
  alt, 
  className, 
  aspectRatio = "auto",
  showGradient = true,
  allowFullscreen = true,
  showCarousel = true,
  fallbackSrc
}: BannerDisplayProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageArray = Array.isArray(images) ? images : [images];
  const hasMultipleImages = imageArray.length > 1;
  
  const aspectRatioClasses = {
    "auto": "h-auto",
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "21/9": "aspect-[21/9]"
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % imageArray.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + imageArray.length) % imageArray.length);
  };

  const currentImage = imageArray[currentIndex];

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  if (!currentImage && !fallbackSrc) {
    return null;
  }

  const displayImage = imageError && fallbackSrc ? fallbackSrc : currentImage;

  return (
    <>
      <div className={cn("relative overflow-hidden rounded-lg group", className)}>
        <img 
          src={displayImage}
          alt={alt}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={cn(
            "w-full object-cover transition-transform duration-500 hover:scale-105",
            aspectRatioClasses[aspectRatio]
          )}
          loading="lazy"
        />
        
        {showGradient && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        )}

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {imageArray.length}
          </div>
        )}

        {/* Carousel Controls */}
        {hasMultipleImages && showCarousel && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Fullscreen Button */}
        {allowFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullscreen(true)}
            className="absolute bottom-3 right-3 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}

        {/* Thumbnail Indicators */}
        {hasMultipleImages && imageArray.length <= 10 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {imageArray.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex 
                    ? "bg-white" 
                    : "bg-white/50 hover:bg-white/75"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {allowFullscreen && (
        <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
          <DialogContent className="max-w-screen-xl max-h-screen p-0 bg-black/95">
            <div className="relative w-full h-full flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullscreen(false)}
                className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
              >
                <X className="h-6 w-6" />
              </Button>

              <img 
                src={displayImage}
                alt={alt}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
              />

              {hasMultipleImages && showCarousel && (
                <>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                    {currentIndex + 1} of {imageArray.length}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};