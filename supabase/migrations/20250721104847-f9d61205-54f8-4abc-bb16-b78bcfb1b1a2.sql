-- Add email verification fields to auth configuration
-- Enable email confirmation in Supabase auth settings

-- Add settings for premium features
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS auto_image_generation BOOLEAN DEFAULT false;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS ai_description_enhancement BOOLEAN DEFAULT false;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS markdown_preview BOOLEAN DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS developer_mode BOOLEAN DEFAULT false;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';

-- Add image_url to ideas table for AI-generated images
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS original_description TEXT;

-- Update trigger for user_settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  colors TEXT[] := ARRAY['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  random_color TEXT;
BEGIN
  -- Select a random color
  random_color := colors[floor(random() * array_length(colors, 1) + 1)];
  
  INSERT INTO public.profiles (user_id, display_name, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    random_color
  );
  
  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;