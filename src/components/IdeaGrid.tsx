import { Idea } from '@/types/idea';
import { IdeaCard } from './IdeaCard';

interface IdeaGridProps {
  ideas: Idea[];
  onEditIdea: (idea: Idea) => void;
  onDeleteIdea: (id: string) => void;
}

export const IdeaGrid = ({ ideas, onEditIdea, onDeleteIdea }: IdeaGridProps) => {
  if (ideas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-4xl">💡</span>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No ideas found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters, or add your first idea to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-0">
      {ideas.map((idea, index) => (
        <div 
          key={idea.id} 
          className="animate-slide-up" 
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <IdeaCard
            idea={idea}
            onEdit={onEditIdea}
            onDelete={onDeleteIdea}
          />
        </div>
      ))}
    </div>
  );
};