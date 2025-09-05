import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Plus, Trash2, Key, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  rate_limit_per_hour: number;
  usage_count: number;
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ApiKeysManager = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    permissions: ['read'] as string[],
    rate_limit_per_hour: 1000,
    expires_at: ''
  });

  const fetchApiKeys = async () => {
    if (!user || !session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-keys', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to fetch API keys');
      }

      if (data?.data) {
        setApiKeys(data.data);
      } else {
        setApiKeys([]);
      }
    } catch (error: any) {
      console.error('Error fetching API keys:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch API keys. Please try again or check your connection."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  const createApiKey = async () => {
    if (!user || !formData.name.trim()) return;

    setCreating(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        permissions: formData.permissions,
        rate_limit_per_hour: formData.rate_limit_per_hour
      };

      if (formData.expires_at) {
        payload.expires_at = new Date(formData.expires_at).toISOString();
      }

      const { data, error } = await supabase.functions.invoke('ai-keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (error) throw error;

      setNewApiKey(data.api_key);
      setApiKeys(prev => [data.data, ...prev]);
      setFormData({
        name: '',
        permissions: ['read'],
        rate_limit_per_hour: 1000,
        expires_at: ''
      });

      toast({
        title: "API Key Created",
        description: "Your API key has been created successfully"
      });
    } catch (error: any) {
      console.error('Error creating API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create API key"
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (keyId: string, keyName: string) => {
    if (!user) return;

    if (!confirm(`Are you sure you want to delete the API key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke(`ai-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      toast({
        title: "API Key Deleted",
        description: `API key "${keyName}" has been deleted`
      });
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete API key"
      });
    }
  };

  const toggleKeyActive = async (keyId: string, isActive: boolean) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke(`ai-keys/${keyId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (error) throw error;

      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, is_active: !isActive } : key
      ));

      toast({
        title: isActive ? "API Key Deactivated" : "API Key Activated",
        description: `API key has been ${isActive ? 'deactivated' : 'activated'}`
      });
    } catch (error: any) {
      console.error('Error updating API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update API key"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard"
    });
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission)
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'read': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'write': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">API Keys</h3>
          <p className="text-sm text-muted-foreground">
            Manage API keys for programmatic access to your ideas
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for accessing your ideas programmatically
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-name">Name</Label>
                <Input
                  id="api-key-name"
                  placeholder="My AI Assistant"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  {[
                    { id: 'read', label: 'Read', description: 'Get ideas and profile' },
                    { id: 'write', label: 'Write', description: 'Create, update, delete ideas' },
                    { id: 'admin', label: 'Admin', description: 'Full access to all operations' }
                  ].map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      />
                      <div className="flex flex-col">
                        <label htmlFor={permission.id} className="text-sm font-medium">
                          {permission.label}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {permission.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate-limit">Rate Limit (requests/hour)</Label>
                <Select
                  value={formData.rate_limit_per_hour.toString()}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    rate_limit_per_hour: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="1000">1,000</SelectItem>
                    <SelectItem value="2000">2,000</SelectItem>
                    <SelectItem value="5000">5,000</SelectItem>
                    <SelectItem value="10000">10,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires-at">Expiry Date (Optional)</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={formData.expires_at}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button 
                onClick={createApiKey} 
                disabled={creating || !formData.name.trim() || formData.permissions.length === 0}
              >
                {creating ? "Creating..." : "Create API Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* New API Key Display */}
      {newApiKey && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="space-y-2">
            <p className="font-medium text-green-800 dark:text-green-200">
              API Key Created Successfully!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Please copy and save this API key now. You won't be able to see it again.
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <code className="flex-1 p-2 bg-green-100 dark:bg-green-900 rounded text-sm font-mono">
                {showKey ? newApiKey : '•'.repeat(32) + newApiKey.slice(-8)}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowKey(!showKey)}
                className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                onClick={() => copyToClipboard(newApiKey)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setNewApiKey('')}
              className="text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200 mt-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Key className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No API Keys</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create your first API key to start accessing your ideas programmatically
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className={`${!apiKey.is_active ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{apiKey.name}</CardTitle>
                    <CardDescription>
                      Created {formatDate(apiKey.created_at)}
                      {apiKey.last_used_at && (
                        <> • Last used {formatDate(apiKey.last_used_at)}</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={apiKey.is_active ? "destructive" : "default"}
                      onClick={() => toggleKeyActive(apiKey.id, apiKey.is_active)}
                    >
                      {apiKey.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteApiKey(apiKey.id, apiKey.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {apiKey.permissions.map(permission => (
                    <Badge 
                      key={permission} 
                      className={getPermissionColor(permission)}
                      variant="secondary"
                    >
                      {permission}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Rate Limit</span>
                    <p className="font-medium">{apiKey.rate_limit_per_hour.toLocaleString()}/hour</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Usage</span>
                    <p className="font-medium">{apiKey.usage_count.toLocaleString()} requests</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className={`font-medium ${apiKey.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {apiKey.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expires</span>
                    <p className="font-medium">
                      {apiKey.expires_at ? formatDate(apiKey.expires_at) : 'Never'}
                    </p>
                  </div>
                </div>

                {apiKey.expires_at && new Date(apiKey.expires_at) <= new Date() && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This API key has expired and will not work until reactivated with a new expiry date.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documentation Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Key className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1">API Documentation</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Learn how to use the IdeaHub API to programmatically manage your ideas. 
                Includes authentication, endpoints, and code examples.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/API_DOCUMENTATION.md', '_blank')}
              >
                View Documentation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};