import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Palette, Code2, Sparkles, Brain, AlertTriangle, BookOpen, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ApiKeysManager } from './ApiKeysManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  auto_image_generation: boolean;
  ai_description_enhancement: boolean;
  markdown_preview: boolean;
  developer_mode: boolean;
  theme: string;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { resetOnboarding } = useOnboarding();
  const [settings, setSettings] = useState<UserSettings>({
    auto_image_generation: false,
    ai_description_enhancement: false,
    markdown_preview: true,
    developer_mode: false,
    theme: 'system'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [devApiKeys, setDevApiKeys] = useState({
    googleAI: '',
    deepseek: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
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
        
        // Load API keys from session storage if in developer mode
        if (loadedSettings.developer_mode) {
          setDevApiKeys({
            googleAI: sessionStorage.getItem('dev_google_ai_key') || '',
            deepseek: sessionStorage.getItem('dev_deepseek_key') || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error loading settings",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user?.id,
            ...settings,
            ...newSettings,
          },
          {
            onConflict: 'user_id'
          }
        );

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...newSettings }));
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: boolean | string) => {
    // Apply theme changes immediately
    if (key === 'theme') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      if (value === 'light') {
        root.classList.add('light');
      } else if (value === 'dark') {
        root.classList.add('dark');
      } else {
        // System theme - detect and apply
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      }
    }
    
    saveSettings({ [key]: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings className="h-6 w-6" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your Idea Hub experience and configure premium features.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ai-features">AI Features</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="developer">Developer</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Settings</CardTitle>
                <CardDescription>
                  Configure how your ideas are displayed and managed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Markdown Preview</Label>
                    <div className="text-sm text-muted-foreground">
                      Enable rich markdown formatting in idea descriptions
                    </div>
                  </div>
                  <Switch
                    checked={settings.markdown_preview}
                    onCheckedChange={(checked) => handleSettingChange('markdown_preview', checked)}
                    disabled={isLoading}
                  />
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <BookOpen className="h-5 w-5" />
                   Tutorial & Onboarding
                 </CardTitle>
                 <CardDescription>
                   Access the tutorial and onboarding experience again.
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <Label className="text-base">Missed the Onboarding?</Label>
                     <div className="text-sm text-muted-foreground">
                       Restart the welcome tutorial to learn about all features
                     </div>
                   </div>
                   <Button
                     variant="outline"
                     onClick={() => {
                       resetOnboarding();
                       onClose();
                       toast({
                         title: "Onboarding restarted",
                         description: "The welcome tutorial will now guide you through the features.",
                       });
                     }}
                   >
                     Start Tutorial
                   </Button>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="ai-features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI-Powered Features
                  <Badge variant="secondary">Premium</Badge>
                </CardTitle>
                <CardDescription>
                  Enable intelligent features to enhance your idea management experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto Image Generation</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically generate beautiful images for your ideas using Google AI
                    </div>
                  </div>
                  <Switch
                    checked={settings.auto_image_generation}
                    onCheckedChange={(checked) => handleSettingChange('auto_image_generation', checked)}
                    disabled={isLoading}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">AI Description Enhancement</Label>
                    <div className="text-sm text-muted-foreground">
                      Get AI-powered suggestions to improve your idea descriptions
                    </div>
                  </div>
                  <Switch
                    checked={settings.ai_description_enhancement}
                    onCheckedChange={(checked) => handleSettingChange('ai_description_enhancement', checked)}
                    disabled={isLoading}
                  />
                </div>

                {(settings.auto_image_generation || settings.ai_description_enhancement) && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          AI Features Enabled
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          These features use our pre-configured AI services. For custom API keys, enable Developer Mode.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme Settings
                </CardTitle>
                <CardDescription>
                  Customize the visual appearance of your workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => handleSettingChange('theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">
                    Choose your preferred color scheme
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys Management
                </CardTitle>
                <CardDescription>
                  Generate and manage API keys for accessing IdeaHub programmatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeysManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="developer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Developer Mode
                  <Badge variant="outline">Advanced</Badge>
                </CardTitle>
                <CardDescription>
                  Use your own API keys for AI services instead of our managed endpoints.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Developer Mode</Label>
                    <div className="text-sm text-muted-foreground">
                      Configure custom API keys for AI services
                    </div>
                  </div>
                  <Switch
                    checked={settings.developer_mode}
                    onCheckedChange={(checked) => handleSettingChange('developer_mode', checked)}
                    disabled={isLoading}
                  />
                </div>

                {settings.developer_mode && (
                  <>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Security Notice
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            API keys entered here are only stored in your browser session and are never saved to our servers. They will be lost when you close the browser.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="google-ai-key">Google AI Studio API Key</Label>
                        <Input
                          id="google-ai-key"
                          type="password"
                          placeholder="Enter your Google AI Studio API key"
                          value={devApiKeys.googleAI}
                          onChange={(e) => setDevApiKeys(prev => ({ ...prev, googleAI: e.target.value }))}
                        />
                        <div className="text-xs text-muted-foreground">
                          Used for image generation. Get your key from Google AI Studio.
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deepseek-key">Deepseek API Key</Label>
                        <Input
                          id="deepseek-key"
                          type="password"
                          placeholder="Enter your Deepseek API key"
                          value={devApiKeys.deepseek}
                          onChange={(e) => setDevApiKeys(prev => ({ ...prev, deepseek: e.target.value }))}
                        />
                        <div className="text-xs text-muted-foreground">
                          Used for description enhancement. Get your key from Deepseek.
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          // Store in session storage (not persistent)
                          if (devApiKeys.googleAI) {
                            sessionStorage.setItem('dev_google_ai_key', devApiKeys.googleAI);
                          }
                          if (devApiKeys.deepseek) {
                            sessionStorage.setItem('dev_deepseek_key', devApiKeys.deepseek);
                          }
                          toast({
                            title: "API keys configured",
                            description: "Your custom API keys are now active for this session.",
                          });
                        }}
                        disabled={!devApiKeys.googleAI && !devApiKeys.deepseek}
                        className="w-full"
                      >
                        Save API Keys (Session Only)
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};