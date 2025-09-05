export interface Idea {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: IdeaStatus;
  tags: string[];
  color: IdeaColor;
  createdAt: Date;
  updatedAt: Date;
  image_url?: string;
  original_description?: string;
}

export type IdeaStatus = 'idea' | 'research' | 'progress' | 'launched' | 'archived';

export type IdeaColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange' | 'gray';

export const statusConfig = {
  idea: { label: '💡 Idea', color: 'status-idea' },
  research: { label: '🔬 Researching', color: 'status-research' },
  progress: { label: '⚙️ In Progress', color: 'status-progress' },
  launched: { label: '🚀 Launched', color: 'status-launched' },
  archived: { label: '🗄️ Archived', color: 'status-archived' }
};

export const colorConfig = {
  yellow: { bg: 'bg-yellow-100 hover:bg-yellow-200', border: 'border-yellow-200' },
  blue: { bg: 'bg-blue-100 hover:bg-blue-200', border: 'border-blue-200' },
  green: { bg: 'bg-green-100 hover:bg-green-200', border: 'border-green-200' },
  pink: { bg: 'bg-pink-100 hover:bg-pink-200', border: 'border-pink-200' },
  purple: { bg: 'bg-purple-100 hover:bg-purple-200', border: 'border-purple-200' },
  orange: { bg: 'bg-orange-100 hover:bg-orange-200', border: 'border-orange-200' },
  gray: { bg: 'bg-card hover:bg-card-hover', border: 'border-border' }
};