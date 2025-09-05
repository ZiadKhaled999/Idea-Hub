import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Grid3x3, List, Search, Trash2, X, CheckSquare } from 'lucide-react';
import { useIdeas } from '@/hooks/useIdeas';
import { UserProfile } from '@/components/UserProfile';
import { IdeaForm } from '@/components/IdeaForm';
import { SearchAndFilters } from '@/components/SearchAndFilters';
import { PremiumIdeaCard } from '@/components/ideas/PremiumIdeaCard';
import { IdeaPreviewModal } from '@/components/ideas/IdeaPreviewModal';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { Idea } from '@/types/idea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useOnboarding } from '@/hooks/useOnboarding';

interface UserSettings {
  auto_image_generation: boolean;
  ai_description_enhancement: boolean;
  markdown_preview: boolean;
  developer_mode: boolean;
  theme: string;
}

export const IdeaHub = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    isOnboardingOpen, 
    completeOnboarding, 
    closeOnboarding 
  } = useOnboarding();
  const {
    ideas,
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
  } = useIdeas();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [previewIdea, setPreviewIdea] = useState<Idea | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<UserSettings>({
    auto_image_generation: false,
    ai_description_enhancement: false,
    markdown_preview: true,
    developer_mode: false,
    theme: 'system'
  });

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          const loadedSettings = {
            auto_image_generation: data.auto_image_generation,
            ai_description_enhancement: data.ai_description_enhancement,
            markdown_preview: data.markdown_preview,
            developer_mode: data.developer_mode,
            theme: data.theme
          };
          setSettings(loadedSettings);
          
          // Apply theme on load
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          
          if (loadedSettings.theme === 'light') {
            root.classList.add('light');
          } else if (loadedSettings.theme === 'dark') {
            root.classList.add('dark');
          } else {
            // System theme - detect and apply
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, [user]);

  const handleAddIdea = async (newIdea: Omit<Idea, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'image_url' | 'original_description'>) => {
    await addIdea(newIdea);
    setIsFormOpen(false);
    
    toast({
      title: "Idea created! 🎉",
      description: settings.auto_image_generation ? 
        "AI image generation will start shortly." : 
        "Your idea has been saved successfully.",
    });
  };

  const handleEditIdea = async (id: string, updates: Partial<Idea>) => {
    await updateIdea(id, updates);
    setEditingIdea(null);
  };

  const handleDeleteIdea = async (id: string) => {
    await deleteIdea(id);
    toast({
      title: "Idea deleted",
      description: "Your idea has been removed.",
    });
  };

  const openEditForm = (idea: Idea) => {
    setEditingIdea(idea);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingIdea(null);
  };

  const openPreview = (idea: Idea) => {
    setPreviewIdea(idea);
  };

  const closePreview = () => {
    setPreviewIdea(null);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIdeas(new Set());
  };

  const toggleIdeaSelection = (ideaId: string) => {
    const newSelection = new Set(selectedIdeas);
    if (newSelection.has(ideaId)) {
      newSelection.delete(ideaId);
    } else {
      newSelection.add(ideaId);
    }
    setSelectedIdeas(newSelection);
  };

  const handleBulkDelete = async () => {
    for (const ideaId of selectedIdeas) {
      await deleteIdea(ideaId);
    }
    setSelectedIdeas(new Set());
    setIsSelectionMode(false);
    toast({
      title: `${selectedIdeas.size} idea(s) deleted`,
      description: "Selected ideas have been removed.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading your ideas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card-header/95 backdrop-blur supports-[backdrop-filter]:bg-card-header/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-text bg-clip-text text-transparent">
                Idea Hub
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="hidden sm:flex"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="hidden sm:flex"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
               {/* Bulk Delete Actions */}
               {isSelectionMode ? (
                 <div className="flex items-center gap-1 sm:gap-2">
                   <span className="text-xs sm:text-sm text-muted-foreground">
                     {selectedIdeas.size} selected
                   </span>
                   <Button
                     variant="destructive"
                     size="sm"
                     onClick={handleBulkDelete}
                     disabled={selectedIdeas.size === 0}
                     className="text-xs sm:text-sm px-2 sm:px-3"
                   >
                     <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                     <span className="hidden sm:inline">Delete </span>({selectedIdeas.size})
                   </Button>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={toggleSelectionMode}
                     className="px-2 sm:px-3"
                   >
                     <X className="h-3 w-3 sm:h-4 sm:w-4" />
                   </Button>
                 </div>
               ) : (
                 <div className="flex items-center gap-1 sm:gap-2">
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={toggleSelectionMode}
                     className="px-2 sm:px-3 text-xs sm:text-sm"
                   >
                     <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                     <span className="hidden sm:inline">Select</span>
                   </Button>
                   <Button onClick={() => setIsFormOpen(true)} className="shadow-elegant text-xs sm:text-sm px-2 sm:px-3">
                     <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                     <span className="hidden sm:inline">New </span>Idea
                   </Button>
                 </div>
               )}
              
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          allTags={allTags}
          totalCount={allIdeas.length}
          filteredCount={ideas.length}
        />
      </div>

      {/* Ideas Grid/List */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {ideas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary/10 flex items-center justify-center">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {searchQuery || statusFilter !== 'all' || selectedTags.length > 0 
                ? 'No ideas match your filters' 
                : 'No ideas yet'
              }
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' || selectedTags.length > 0
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Start capturing your brilliant app ideas and organize them like never before.'
              }
            </p>
            <Button onClick={() => setIsFormOpen(true)} className="shadow-elegant">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Idea
            </Button>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4' 
              : 'space-y-4 max-w-4xl mx-auto'
          }`}>
            {ideas.map((idea) => (
              <PremiumIdeaCard
                key={idea.id}
                idea={idea}
                onEdit={openEditForm}
                onDelete={handleDeleteIdea}
                onPreview={openPreview}
                isSelected={selectedIdeas.has(idea.id)}
                onSelectionToggle={toggleIdeaSelection}
                isSelectionMode={isSelectionMode}
                settings={settings}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <IdeaForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleAddIdea}
        onUpdate={editingIdea ? 
          (id, updates) => handleEditIdea(id, updates) : 
          undefined
        }
        editingIdea={editingIdea}
      />

       {previewIdea && (
         <IdeaPreviewModal
           idea={previewIdea}
           isOpen={!!previewIdea}
           onClose={closePreview}
           onEdit={openEditForm}
           settings={settings}
         />
       )}

       {/* Onboarding Modal */}
       <OnboardingModal
         isOpen={isOnboardingOpen}
         onClose={closeOnboarding}
         onComplete={completeOnboarding}
       />
    </div>
  );
};