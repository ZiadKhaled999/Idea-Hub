import { useState } from 'react';
import { Edit3, Trash2, Calendar, Tag } from 'lucide-react';
import { Idea, statusConfig, colorConfig } from '@/types/idea';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BannerDisplay } from '@/components/ui/banner-display';

interface IdeaCardProps {
  idea: Idea;
  onEdit: (idea: Idea) => void;
  onDelete: (id: string) => void;
}

export const IdeaCard = ({ idea, onEdit, onDelete }: IdeaCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorStyle = colorConfig[idea.color];
  const statusStyle = statusConfig[idea.status];
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  return (
    <Card 
      className={`group relative break-inside-avoid mb-4 cursor-pointer transition-all duration-300 hover:shadow-float hover:-translate-y-1 ${colorStyle.bg} ${colorStyle.border} border-2 overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(idea)}
    >
      {/* Banner Image */}
      {idea.image_url && (
        <BannerDisplay
          images={idea.image_url}
          alt={idea.title}
          aspectRatio="16/9"
          className="mb-3"
          allowFullscreen={false}
          showCarousel={false}
        />
      )}
      
      <div className="p-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
        <Badge 
          variant="secondary" 
          className={`text-xs font-medium ${statusStyle.color} border-0`}
        >
          {statusStyle.label}
        </Badge>
        
        {/* Action Buttons */}
        <div className={`flex gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-white/50"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(idea);
            }}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(idea.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight">
        {idea.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {idea.description}
      </p>

      {/* Tags */}
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {idea.tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-xs bg-white/50 border-white/60 hover:bg-white/70"
            >
              <Tag className="h-2.5 w-2.5 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

        {/* Created Date */}
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(idea.createdAt)}
        </div>
      </div>
    </Card>
  );
};