import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const ApiDocumentation = () => {
  const [copiedCode, setCopiedCode] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const baseUrl = "https://pqelavffbhqprofqcfis.supabase.co/functions/v1";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">IdeaHub AI API</h1>
            <p className="text-muted-foreground">
              Comprehensive API for programmatic access to your ideas
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Quick Start
            </CardTitle>
            <CardDescription>
              Get started with the IdeaHub AI API in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Base URL</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                  {baseUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(baseUrl, "Base URL")}
                >
                  {copiedCode === "Base URL" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Authentication Required:</strong> All API endpoints require an API key. 
                Create one in your settings under the "API Keys" tab.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* API Tabs */}
        <Tabs defaultValue="endpoints" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="authentication">Auth</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="sdks">SDKs</TabsTrigger>
          </TabsList>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-6">
            {/* Ideas Management */}
            <Card>
              <CardHeader>
                <CardTitle>Ideas Management</CardTitle>
                <CardDescription>
                  CRUD operations for your ideas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    method: "GET",
                    endpoint: "/ai-ideas",
                    description: "Get all ideas with optional filtering",
                    params: ["status", "limit", "offset", "search"]
                  },
                  {
                    method: "GET",
                    endpoint: "/ai-ideas/{id}",
                    description: "Get a specific idea by ID"
                  },
                  {
                    method: "POST",
                    endpoint: "/ai-ideas",
                    description: "Create a new idea",
                    body: true
                  },
                  {
                    method: "PUT",
                    endpoint: "/ai-ideas/{id}",
                    description: "Update an existing idea",
                    body: true
                  },
                  {
                    method: "DELETE",
                    endpoint: "/ai-ideas/{id}",
                    description: "Archive an idea (soft delete)"
                  }
                ].map((endpoint, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge 
                        variant={
                          endpoint.method === 'GET' ? 'secondary' :
                          endpoint.method === 'POST' ? 'default' :
                          endpoint.method === 'PUT' ? 'outline' : 'destructive'
                        }
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono">{endpoint.endpoint}</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {endpoint.description}
                    </p>
                    {endpoint.params && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Query params:</span>
                        <div className="flex gap-2 mt-1">
                          {endpoint.params.map(param => (
                            <code key={param} className="bg-muted px-1 rounded">
                              {param}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* User Profile */}
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>
                  Access user profile and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm font-mono">/ai-profile</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get user profile, settings, and idea statistics
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authentication Tab */}
          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Key Authentication</CardTitle>
                <CardDescription>
                  How to authenticate your API requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Header Required</h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                      x-api-key: iah_your_api_key_here
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("x-api-key: iah_your_api_key_here", "Auth Header")}
                    >
                      {copiedCode === "Auth Header" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Permission Levels</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">read</Badge>
                      <span className="text-sm text-muted-foreground">
                        Get ideas and profile information
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">write</Badge>
                      <span className="text-sm text-muted-foreground">
                        Create, update, and delete ideas (includes read)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">admin</Badge>
                      <span className="text-sm text-muted-foreground">
                        Full access to all operations
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>cURL Examples</CardTitle>
                <CardDescription>
                  Ready-to-use command line examples
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: "Get All Ideas",
                    code: `curl -X GET "${baseUrl}/ai-ideas?limit=10" \\
  -H "x-api-key: iah_your_api_key_here"`
                  },
                  {
                    title: "Create New Idea",
                    code: `curl -X POST "${baseUrl}/ai-ideas" \\
  -H "x-api-key: iah_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "AI-Powered App",
    "description": "# Revolutionary Idea\\n\\nThis app will...",
    "tags": ["ai", "mobile"],
    "status": "idea"
  }'`
                  },
                  {
                    title: "Get User Profile",
                    code: `curl -X GET "${baseUrl}/ai-profile" \\
  -H "x-api-key: iah_your_api_key_here"`
                  }
                ].map((example, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">{example.title}</h5>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(example.code, example.title)}
                      >
                        {copiedCode === example.title ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-auto">
                      {example.code}
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SDKs Tab */}
          <TabsContent value="sdks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>JavaScript/Node.js SDK</CardTitle>
                <CardDescription>
                  Use the API with JavaScript or Node.js
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">SDK Class</h5>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(jsSDK, "JavaScript SDK")}
                    >
                      {copiedCode === "JavaScript SDK" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-auto max-h-80">
                    {jsSDK}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Python SDK</CardTitle>
                <CardDescription>
                  Use the API with Python
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">Python Class</h5>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(pythonSDK, "Python SDK")}
                    >
                      {copiedCode === "Python SDK" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-auto max-h-80">
                    {pythonSDK}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Need help? Check out the{' '}
            <Button variant="link" className="p-0 h-auto" asChild>
              <a href="https://docs.lovable.dev" target="_blank" rel="noopener noreferrer">
                documentation
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

const jsSDK = `class IdeaHubAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = '${window.location.protocol}//${window.location.host.includes('localhost') ? 'pqelavffbhqprofqcfis.supabase.co' : window.location.host}/functions/v1';
    this.headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      ...options,
      headers: { ...this.headers, ...options.headers }
    });
    
    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }
    
    return response.json();
  }

  async getIdeas(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(\`/ai-ideas\${query ? '?' + query : ''}\`);
  }

  async createIdea(ideaData) {
    return this.request('/ai-ideas', {
      method: 'POST',
      body: JSON.stringify(ideaData)
    });
  }

  async updateIdea(ideaId, updates) {
    return this.request(\`/ai-ideas/\${ideaId}\`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async getProfile() {
    return this.request('/ai-profile');
  }
}

// Usage
const api = new IdeaHubAPI('iah_your_api_key_here');
api.getIdeas({ limit: 10 }).then(console.log);`;

const pythonSDK = `import requests
import json

class IdeaHubAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://pqelavffbhqprofqcfis.supabase.co/functions/v1"
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
    
    def request(self, endpoint, method="GET", data=None, params=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.request(
            method=method,
            url=url,
            headers=self.headers,
            json=data,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def get_ideas(self, **params):
        return self.request("/ai-ideas", params=params)
    
    def create_idea(self, idea_data):
        return self.request("/ai-ideas", method="POST", data=idea_data)
    
    def update_idea(self, idea_id, updates):
        return self.request(f"/ai-ideas/{idea_id}", method="PUT", data=updates)
    
    def get_profile(self):
        return self.request("/ai-profile")

# Usage
api = IdeaHubAPI("iah_your_api_key_here")
ideas = api.get_ideas(limit=10)
print(ideas)`;