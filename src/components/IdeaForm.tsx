import { useState, useEffect } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { Idea, IdeaStatus, IdeaColor, statusConfig, colorConfig } from '@/types/idea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedImageUpload } from '@/components/ui/enhanced-image-upload';

interface IdeaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (idea: Omit<Idea, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'image_url' | 'original_description'>) => void;
  onUpdate?: (id: string, updates: Partial<Idea>) => void;
  editingIdea?: Idea | null;
}

export const IdeaForm = ({ isOpen, onClose, onSubmit, onUpdate, editingIdea }: IdeaFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IdeaStatus>('idea');
  const [color, setColor] = useState<IdeaColor>('gray');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingIdea) {
      setTitle(editingIdea.title);
      setDescription(editingIdea.description);
      setStatus(editingIdea.status);
      setColor(editingIdea.color);
      setTags(editingIdea.tags);
      setImagePreview(editingIdea.image_url || null);
    } else {
      setTitle('');
      setDescription('');
      setStatus('idea');
      setColor('gray');
      setTags([]);
      setImagePreview(null);
    }
    setNewTag('');
  }, [editingIdea, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let imageUrl = imagePreview;

    // Handle image upload if there's a new file URL
    if (imagePreview && imagePreview.startsWith('data:')) {
      setIsUploading(true);
      try {
        // Convert data URL to File
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const file = new File([blob], `idea-${Date.now()}.jpg`, { type: blob.type });
        
        const fileName = `idea-${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('idea-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('idea-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Continuing without image.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }

    const ideaData = {
      title: title.trim(),
      description: description.trim(),
      status,
      color,
      tags,
      ...(imageUrl && { image_url: imageUrl })
    };

    if (editingIdea && onUpdate) {
      onUpdate(editingIdea.id, ideaData);
    } else {
      onSubmit(ideaData);
    }

    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editingIdea ? 'Edit Idea' : 'Add New Idea'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your app idea title..."
              className="text-base"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your idea in detail... (Include URLs for automatic screenshot capture)"
              className="min-h-[120px] text-sm leading-relaxed"
            />
          </div>

          {/* Image Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Image</Label>
            <EnhancedImageUpload
              onImageChange={(imageUrl) => setImagePreview(imageUrl)}
              currentImage={imagePreview}
              description={description}
              showScreenshot={true}
              disabled={isUploading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={(value: IdeaStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Color Theme</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(colorConfig).map(([colorKey, config]) => (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setColor(colorKey as IdeaColor)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${config.bg} ${config.border} ${
                      color === colorKey ? 'ring-2 ring-primary scale-110' : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addTag}
                size="sm"
                variant="outline"
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isUploading}>
              {isUploading ? 'Uploading...' : editingIdea ? 'Update Idea' : 'Add Idea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};