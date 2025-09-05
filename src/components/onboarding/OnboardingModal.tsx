import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, Check, Lightbulb, Sparkles, Settings, Image, Zap, Rocket, Heart } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const onboardingSteps = [
  {
    id: 1,
    title: "Welcome to Idea Hub! 🎉",
    description: "Your personal space to capture, organize, and bring your app ideas to life.",
    icon: <Lightbulb className="w-16 h-16 text-primary animate-pulse" />,
    content: "Ready to transform how you manage your brilliant ideas? Let's get started on this exciting journey together!"
  },
  {
    id: 2,
    title: "Create Your First Idea ✨",
    description: "Click the 'New Idea' button to start capturing your thoughts.",
    icon: <Sparkles className="w-16 h-16 text-primary animate-bounce" />,
    content: "Every great app starts with a simple idea. Give it a name, describe your vision, and watch the magic happen."
  },
  {
    id: 3,
    title: "AI-Powered Enhancements 🤖",
    description: "Let AI help improve your descriptions and generate stunning images.",
    icon: <Zap className="w-16 h-16 text-primary animate-pulse" />,
    content: "Turn on AI features in settings to automatically enhance your ideas with better descriptions and beautiful visuals."
  },
  {
    id: 4,
    title: "Visual Organization 🖼️",
    description: "Add images, set priority levels, and track your progress.",
    icon: <Image className="w-16 h-16 text-primary animate-bounce" />,
    content: "Upload images or generate them with AI. Set priorities from 'Just an Idea' to 'Ready to Build' to stay organized."
  },
  {
    id: 5,
    title: "Smart Search & Filtering 🔍",
    description: "Find your ideas quickly with powerful search and tag filtering.",
    icon: <Settings className="w-16 h-16 text-primary animate-spin" style={{ animationDuration: '3s' }} />,
    content: "Use tags, status filters, and search to instantly find any idea. Perfect for when inspiration strikes!"
  },
  {
    id: 6,
    title: "Bulk Actions & Management 📋",
    description: "Select multiple ideas for bulk operations like deletion or status updates.",
    icon: <Check className="w-16 h-16 text-primary animate-pulse" />,
    content: "Use the 'Select' button to choose multiple ideas and perform bulk actions. Keep your workspace clean and organized."
  },
  {
    id: 7,
    title: "Ready to Launch! 🚀",
    description: "You're all set to start building your idea empire.",
    icon: <Rocket className="w-16 h-16 text-primary animate-bounce" />,
    content: "Time to unleash your creativity! Start capturing those amazing ideas and watch your portfolio grow."
  },
  {
    id: 8,
    title: "Thank You! 💝",
    description: "We're excited to be part of your creative journey.",
    icon: <Heart className="w-16 h-16 text-red-500 animate-pulse" />,
    content: "Remember: Every successful app started with just one idea. Yours could be next! Happy building! 🎨✨"
  }
];

export const OnboardingModal = ({ isOpen, onClose, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  const step = onboardingSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-gradient-to-br from-background to-muted border-0 shadow-2xl">
        {/* Progress Bar */}
        <div className="w-full bg-muted/30 h-2">
          <Progress value={progress} className="h-2 transition-all duration-500 ease-out" />
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Step Counter */}
          <div className="text-sm text-muted-foreground mb-4 font-medium">
            Step {currentStep + 1} of {onboardingSteps.length}
          </div>

          {/* Icon */}
          <div className={`mb-6 flex justify-center transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {step.icon}
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            {step.title}
          </h2>

          {/* Description */}
          <p className={`text-lg text-muted-foreground mb-4 transition-all duration-300 delay-100 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            {step.description}
          </p>

          {/* Content */}
          <p className={`text-foreground mb-8 leading-relaxed transition-all duration-300 delay-200 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            {step.content}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {currentStep > 0 ? (
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  className="hover-scale"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="hover-scale text-muted-foreground"
                >
                  Skip Tutorial
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStep < onboardingSteps.length - 1 ? (
                <Button onClick={handleNext} className="hover-scale shadow-elegant">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="hover-scale shadow-elegant bg-gradient-primary">
                  Get Started!
                  <Rocket className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center mt-6 gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-primary w-8'
                    : index < currentStep
                    ? 'bg-primary/60'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};