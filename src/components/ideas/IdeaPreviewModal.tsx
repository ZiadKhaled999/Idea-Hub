import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit3, Calendar, Tag, Sparkles, Undo2, ImageIcon } from 'lucide-react';
import { Idea, statusConfig, colorConfig } from '@/types/idea';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import { BannerDisplay } from '@/components/ui/banner-display';
import { supabase } from '@/integrations/supabase/client';

interface IdeaPreviewModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (idea: Idea) => void;
  settings: {
    auto_image_generation: boolean;
    ai_description_enhancement: boolean;
    markdown_preview: boolean;
    developer_mode: boolean;
  };
}

export const IdeaPreviewModal = ({ 
  idea, 
  isOpen, 
  onClose, 
  onEdit, 
  settings 
}: IdeaPreviewModalProps) => {
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();

  if (!idea) return null;

  const colorStyle = colorConfig[idea.color];
  const statusStyle = statusConfig[idea.status];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
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
        
        // Refresh the modal data
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
      
      // Refresh the modal data
      window.location.reload();
    } catch (error) {
      console.error('Error undoing enhancement:', error);
      toast({
        title: "Undo failed",
        description: "Please try again.",
        variant: "destructive",
      });
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
        const { error: updateError } = await supabase
          .from('ideas')
          .update({ image_url: data.imageUrl })
          .eq('id', idea.id);

        if (updateError) throw updateError;

        toast({
          title: "Image generated! 🎨",
          description: "A beautiful image has been created for your idea.",
        });
        
        // Refresh the modal data
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          <DialogHeader className="space-y-4">
            {!idea.image_url && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <DialogTitle className="text-xl sm:text-2xl font-bold break-words pr-4">{idea.title}</DialogTitle>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge 
                    variant="secondary" 
                    className={`${statusStyle.color} border-0`}
                  >
                    {statusStyle.label}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(idea)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            )}
            {idea.image_url && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(idea)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </DialogHeader>

          {/* Image Banner */}
          {idea.image_url && (
            <div className="relative -mx-6 -mt-6 mb-6">
              <BannerDisplay
                images={idea.image_url}
                alt={idea.title}
                aspectRatio="21/9"
                className="w-full"
                allowFullscreen={true}
                showCarousel={true}
              />
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="secondary" 
                    className={`${statusStyle.color} border-0 bg-white/90 text-black`}
                  >
                    {statusStyle.label}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  {idea.title}
                </h1>
              </div>
            </div>
          )}

        <div className="space-y-6">
          {!idea.image_url && settings.auto_image_generation && (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No image generated yet</p>
              <Button 
                onClick={generateImage}
                disabled={isGeneratingImage}
                variant="outline"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {isGeneratingImage ? 'Generating...' : 'Generate Image'}
              </Button>
            </div>
          )}

          {/* Description */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Description</h3>
              <div className="flex items-center gap-2">
                {idea.original_description && (
                  <Badge variant="secondary">Enhanced</Badge>
                )}
                {settings.ai_description_enhancement && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={enhanceDescription}
                      disabled={isEnhancingDescription}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isEnhancingDescription ? 'Enhancing...' : 'Enhance with AI'}
                    </Button>
                    {idea.original_description && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={undoEnhancement}
                      >
                        <Undo2 className="h-4 w-4 mr-2" />
                        Undo
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="prose prose-gray max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-code:text-foreground prose-pre:text-foreground prose-blockquote:text-muted-foreground prose-li:text-muted-foreground break-words">
              {settings.markdown_preview ? (
                <ReactMarkdown
                  components={{
                    h1: ({children}) => <h1 className="text-2xl font-bold mb-4 text-foreground break-words">{children}</h1>,
                    h2: ({children}) => <h2 className="text-xl font-semibold mb-3 text-foreground break-words">{children}</h2>,
                    h3: ({children}) => <h3 className="text-lg font-medium mb-2 text-foreground break-words">{children}</h3>,
                    h4: ({children}) => <h4 className="text-base font-medium mb-2 text-foreground break-words">{children}</h4>,
                    h5: ({children}) => <h5 className="text-sm font-medium mb-1 text-foreground break-words">{children}</h5>,
                    h6: ({children}) => <h6 className="text-sm font-medium mb-1 text-foreground break-words">{children}</h6>,
                    p: ({children}) => <p className="mb-4 text-muted-foreground break-words leading-relaxed">{children}</p>,
                    strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({children}) => <em className="italic text-muted-foreground">{children}</em>,
                    code: ({children}) => <code className="bg-muted px-2 py-1 rounded text-sm text-foreground font-mono break-words">{children}</code>,
                    pre: ({children}) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm text-foreground font-mono">{children}</pre>,
                    blockquote: ({children}) => <blockquote className="border-l-4 border-border pl-4 mb-4 text-muted-foreground italic">{children}</blockquote>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2 text-muted-foreground">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-muted-foreground">{children}</ol>,
                    li: ({children}) => <li className="text-muted-foreground break-words">{children}</li>,
                    a: ({children, href}) => <a href={href} className="text-primary hover:underline break-all" target="_blank" rel="noopener noreferrer">{children}</a>,
                    table: ({children}) => <div className="overflow-x-auto mb-4"><table className="min-w-full border border-border">{children}</table></div>,
                    thead: ({children}) => <thead className="bg-muted">{children}</thead>,
                    tbody: ({children}) => <tbody>{children}</tbody>,
                    tr: ({children}) => <tr className="border-b border-border">{children}</tr>,
                    th: ({children}) => <th className="px-4 py-2 text-left font-semibold text-foreground">{children}</th>,
                    td: ({children}) => <td className="px-4 py-2 text-muted-foreground break-words">{children}</td>,
                    hr: () => <hr className="my-6 border-border" />,
                  }}
                >
                  {idea.description}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap break-words text-muted-foreground leading-relaxed">{idea.description}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Tags */}
          {idea.tags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="bg-muted/50"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created: {formatDate(idea.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Updated: {formatDate(idea.updatedAt)}</span>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};