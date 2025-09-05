import { useState, useCallback, useEffect } from 'react';
import { Idea, IdeaStatus, IdeaColor } from '@/types/idea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useIdeas = () => {
  const { user } = useAuth();
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch ideas from Supabase
  const fetchIdeas = async () => {
    if (!user) {
      setAllIdeas([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ideas:', error);
        return;
      }

      const formattedIdeas: Idea[] = data.map(idea => ({
        id: idea.id,
        userId: idea.user_id,
        title: idea.title,
        description: idea.description || '',
        status: idea.status as Idea['status'],
        tags: idea.tags || [],
        color: idea.color as Idea['color'],
        image_url: idea.image_url,
        original_description: idea.original_description,
        createdAt: new Date(idea.created_at),
        updatedAt: new Date(idea.updated_at),
      }));

      setAllIdeas(formattedIdeas);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [user]);

  // Filter ideas based on search and filters
  const filteredIdeas = allIdeas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter;
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => idea.tags.includes(tag));
    
    return matchesSearch && matchesStatus && matchesTags;
  });

  const addIdea = useCallback(async (newIdea: Omit<Idea, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'image_url' | 'original_description'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          user_id: user.id,
          title: newIdea.title,
          description: newIdea.description,
          status: newIdea.status,
          tags: newIdea.tags,
          color: newIdea.color,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding idea:', error);
        return;
      }

      const formattedIdea: Idea = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description || '',
        status: data.status as Idea['status'],
        tags: data.tags || [],
        color: data.color as Idea['color'],
        image_url: data.image_url,
        original_description: data.original_description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setAllIdeas(prev => [formattedIdea, ...prev]);
    } catch (error) {
      console.error('Error adding idea:', error);
    }
  }, [user]);

  const updateIdea = useCallback(async (id: string, updates: Partial<Idea>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ideas')
        .update({
          title: updates.title,
          description: updates.description,
          status: updates.status,
          tags: updates.tags,
          color: updates.color,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating idea:', error);
        return;
      }

      const formattedIdea: Idea = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description || '',
        status: data.status as Idea['status'],
        tags: data.tags || [],
        color: data.color as Idea['color'],
        image_url: data.image_url,
        original_description: data.original_description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setAllIdeas(prev => prev.map(idea => 
        idea.id === id ? formattedIdea : idea
      ));
    } catch (error) {
      console.error('Error updating idea:', error);
    }
  }, [user]);

  const deleteIdea = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting idea:', error);
        return;
      }

      setAllIdeas(prev => prev.filter(idea => idea.id !== id));
    } catch (error) {
      console.error('Error deleting idea:', error);
    }
  }, [user]);

  const allTags = Array.from(new Set(allIdeas.flatMap(idea => idea.tags))).sort();

  return {
    ideas: filteredIdeas,
    allIdeas,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedTags,
    setSelectedTags,
    allTags,
    addIdea,
    updateIdea,
    deleteIdea
  };
};