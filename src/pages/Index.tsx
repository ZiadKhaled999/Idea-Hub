import { useAuth } from '@/contexts/AuthContext';
import { IdeaHub } from '@/components/IdeaHub';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse">
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading your ideas...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Idea Hub</h1>
          <p className="text-muted-foreground mb-6">
            Organize and track your app ideas with style
          </p>
          <Button onClick={() => navigate('/auth')} className="px-8">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return <IdeaHub />;
};

export default Index;
