import { useState, useRef, useEffect } from 'react';
import { Calendar, Tag, MoreHorizontal, ImageIcon, Sparkles, Undo2, Eye } from 'lucide-react';
import { Idea, statusConfig, colorConfig } from '@/types/idea';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface PremiumIdeaCardProps {
  idea: Idea;
  onEdit: (idea: Idea) => void;
  onDelete: (id: string) => void;
  onPreview: (idea: Idea) => void;
  isSelected?: boolean;
  onSelectionToggle?: (id: string) => void;
  isSelectionMode?: boolean;
  settings: {
    auto_image_generation: boolean;
    ai_description_enhancement: boolean;
    markdown_preview: boolean;
    developer_mode: boolean;
  };
}

export const PremiumIdeaCard = ({ 
  idea, 
  onEdit, 
  onDelete, 
  onPreview,
  isSelected = false,
  onSelectionToggle,
  isSelectionMode = false,
  settings 
}: PremiumIdeaCardProps) => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);
  const { toast } = useToast();

  const colorStyle = colorConfig[idea.color];
  const statusStyle = statusConfig[idea.status];
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleCardClick = () => {
    if (isSelectionMode && onSelectionToggle) {
      onSelectionToggle(idea.id);
    } else if (!isSelectionMode) {
      onPreview(idea);
    }
  };

  const generateImage = async () => {
    if (!settings.auto_image_generation) return;
    
    setIsGeneratingImage(true);
    try {
      const apiKey = settings.developer_mode ? sessionStorage.getItem('dev_google_ai_key') : undefined;
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt: `Create a beautiful, professional illustration for an app idea: ${idea.title}. ${idea.description.substring(0, 200)}`,
          ...(apiKey && { apiKey })
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Failed to generate image. Please check your API configuration.');
      }

      if (data?.success && data?.imageUrl) {
        // Update the idea with the generated image
        const { error: updateError } = await supabase
          .from('ideas')
          .update({ image_url: data.imageUrl })
          .eq('id', idea.id);

        if (updateError) throw updateError;

        toast({
          title: "Image generated! 🎨",
          description: "A beautiful image has been created for your idea.",
        });
        
        // Refresh the page to show the new image
        window.location.reload();
      } else {
        throw new Error(data?.error || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: "Failed to generate",
        description: "Please check your API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const enhanceDescription = async () => {
    if (!settings.ai_description_enhancement) return;
    
    setIsEnhancingDescription(true);
    try {
      const apiKey = settings.developer_mode ? sessionStorage.getItem('dev_deepseek_key') : undefined;
      
      const { data, error } = await supabase.functions.invoke('enhance-description', {
        body: { 
          title: idea.title,
          description: idea.description,
          ...(apiKey && { apiKey })
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Failed to enhance prompt. Please check your API configuration.');
      }

      if (data?.success && data?.enhancedDescription) {
        // Store original description and update with enhanced one
        const { error: updateError } = await supabase
          .from('ideas')
          .update({ 
            original_description: idea.original_description || idea.description,
            description: data.enhancedDescription 
          })
          .eq('id', idea.id);

        if (updateError) throw updateError;

        toast({
          title: "Description enhanced! ✨",
          description: "Your idea description has been improved with AI insights.",
        });
        
        // Refresh the page to show the enhanced description
        window.location.reload();
      } else {
        throw new Error(data?.error || 'Failed to enhance description');
      }
    } catch (error: any) {
      console.error('Error enhancing description:', error);
      toast({
        title: "Failed to enhance prompt",
        description: "Please check your API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancingDescription(false);
    }
  };

  const undoEnhancement = async () => {
    if (!idea.original_description) return;
    
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ 
          description: idea.original_description,
          original_description: null
        })
        .eq('id', idea.id);

      if (error) throw error;

      toast({
        title: "Description restored",
        description: "Your original description has been restored.",
      });
    } catch (error) {
      console.error('Error undoing enhancement:', error);
      toast({
        title: "Undo failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card 
      className={`group relative break-inside-avoid mb-4 cursor-pointer transition-all duration-300 hover:shadow-float hover:-translate-y-1 ${colorStyle.bg} ${colorStyle.border} ${isSelected ? 'ring-2 ring-primary border-primary' : 'border-2'} overflow-hidden`}
      onClick={handleCardClick}
    >
      {/* Image Banner */}
      {idea.image_url && (
        <div className="relative h-32 w-full overflow-hidden">
          <img 
            src={idea.image_url} 
            alt={idea.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <div className="p-4">
        {/* Status Badge and Actions */}
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="secondary" 
            className={`text-xs font-medium ${statusStyle.color} border-0`}
          >
            {statusStyle.label}
          </Badge>
          
          {/* Action Buttons - Only view button */}
          {!isSelectionMode && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white/50"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(idea);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}

          {/* AI Actions Dropdown */}
          {(settings.auto_image_generation || settings.ai_description_enhancement) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {settings.auto_image_generation && (
                  <DropdownMenuItem 
                    onClick={generateImage}
                    disabled={isGeneratingImage}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                  </DropdownMenuItem>
                )}
                {settings.ai_description_enhancement && (
                  <>
                    <DropdownMenuItem 
                      onClick={enhanceDescription}
                      disabled={isEnhancingDescription}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isEnhancingDescription ? 'Enhancing...' : 'Enhance Description'}
                    </DropdownMenuItem>
                    {idea.original_description && (
                      <DropdownMenuItem onClick={undoEnhancement}>
                        <Undo2 className="h-4 w-4 mr-2" />
                        Undo Enhancement
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight break-words overflow-wrap-anywhere">
          {idea.title}
        </h3>

        {/* Description Preview */}
        <div className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {settings.markdown_preview ? (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-code:text-foreground prose-pre:text-foreground prose-blockquote:text-muted-foreground prose-li:text-muted-foreground overflow-hidden">
              <ReactMarkdown
                components={{
                  h1: ({children}) => <h1 className="text-base font-semibold mb-2 text-foreground break-words overflow-wrap-anywhere">{children}</h1>,
                  h2: ({children}) => <h2 className="text-sm font-semibold mb-1 text-foreground break-words overflow-wrap-anywhere">{children}</h2>,
                  h3: ({children}) => <h3 className="text-sm font-medium mb-1 text-foreground break-words overflow-wrap-anywhere">{children}</h3>,
                  p: ({children}) => <p className="text-sm mb-2 text-muted-foreground break-words overflow-wrap-anywhere whitespace-pre-wrap">{children}</p>,
                  strong: ({children}) => <strong className="font-semibold text-foreground break-words overflow-wrap-anywhere">{children}</strong>,
                  em: ({children}) => <em className="italic text-muted-foreground break-words overflow-wrap-anywhere">{children}</em>,
                  code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-xs text-foreground break-all overflow-wrap-anywhere">{children}</code>,
                  blockquote: ({children}) => <blockquote className="border-l-2 border-border pl-2 text-sm text-muted-foreground break-words overflow-wrap-anywhere">{children}</blockquote>,
                  ul: ({children}) => <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">{children}</ol>,
                  li: ({children}) => <li className="text-sm text-muted-foreground break-words overflow-wrap-anywhere">{children}</li>,
                  a: ({children, href}) => (
                    <a 
                      href={href} 
                      className="text-primary underline bg-primary/10 px-1 py-0.5 rounded break-all" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  )
                }}
              >
                {truncateDescription(idea.description, 150)}
              </ReactMarkdown>
            </div>
          ) : (
            <div 
              className="break-words overflow-wrap-anywhere whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: truncateDescription(idea.description, 150).replace(
                  /(https?:\/\/[^\s]+)/g, 
                  '<span class="text-primary bg-primary/10 px-1 py-0.5 rounded break-all">$1</span>'
                )
              }}
            />
          )}
        </div>

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {idea.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-white/50 border-white/60 hover:bg-white/70"
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {tag}
              </Badge>
            ))}
            {idea.tags.length > 3 && (
              <Badge variant="outline" className="text-xs bg-white/50 border-white/60">
                +{idea.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Created Date */}
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(idea.createdAt)}
          {idea.original_description && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Enhanced
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};