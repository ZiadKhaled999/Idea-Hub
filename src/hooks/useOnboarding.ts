import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'ideahub_onboarding_completed';

export const useOnboarding = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    const hasCompleted = completed === 'true';
    setHasCompletedOnboarding(hasCompleted);
    
    // Show onboarding if not completed
    if (!hasCompleted) {
      setIsOnboardingOpen(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompletedOnboarding(true);
    setIsOnboardingOpen(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(false);
    setIsOnboardingOpen(true);
  };

  const openOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
  };

  return {
    hasCompletedOnboarding,
    isOnboardingOpen,
    completeOnboarding,
    resetOnboarding,
    openOnboarding,
    closeOnboarding,
  };
};