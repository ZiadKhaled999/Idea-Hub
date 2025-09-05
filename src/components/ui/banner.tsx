import { cn } from "@/lib/utils";

interface BannerProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "auto" | "16/9" | "4/3" | "1/1";
  showGradient?: boolean;
}

export const Banner = ({ 
  src, 
  alt, 
  className, 
  aspectRatio = "auto",
  showGradient = true 
}: BannerProps) => {
  const aspectRatioClasses = {
    "auto": "h-auto",
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square"
  };

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <img 
        src={src} 
        alt={alt}
        className={cn(
          "w-full object-cover transition-transform duration-300 hover:scale-105",
          aspectRatioClasses[aspectRatio]
        )}
      />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      )}
    </div>
  );
};