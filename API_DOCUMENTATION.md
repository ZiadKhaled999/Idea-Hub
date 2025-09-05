# IdeaHub AI API Documentation

Welcome to the IdeaHub AI API! This comprehensive API allows AI assistants and external applications to programmatically interact with user ideas stored in IdeaHub.

## 🚀 Quick Start

### Base URL
```
https://pqelavffbhqprofqcfis.supabase.co/functions/v1/
```

### Authentication
All AI endpoints require API key authentication using the `x-api-key` header:

```http
x-api-key: iah_your_api_key_here
```

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)
7. [SDK Examples](#sdk-examples)

## 🔐 Authentication

### API Key Management

First, you need to create an API key using the authenticated `/ai-keys` endpoint:

#### Create API Key
```http
POST /ai-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My AI Assistant",
  "permissions": ["read", "write"],
  "rate_limit_per_hour": 1000,
  "expires_at": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "My AI Assistant",
    "permissions": ["read", "write"],
    "rate_limit_per_hour": 1000,
    "usage_count": 0,
    "is_active": true,
    "created_at": "2025-09-03T00:00:00Z"
  },
  "api_key": "iah_abcd1234...",
  "message": "API key created successfully. Please save the key as it will not be shown again."
}
```

### Permission Levels

- **`read`**: Can retrieve ideas and profile information
- **`write`**: Can create, update, and delete ideas (includes read permissions)
- **`admin`**: Full access to all operations (includes read and write permissions)

## ⚡ Rate Limiting

Rate limits are enforced per API key per hour. Default limit is 1000 requests/hour, configurable up to 10,000 requests/hour.

When rate limit is exceeded, you'll receive:
```json
{
  "error": "Rate limit exceeded"
}
```

## 🔌 API Endpoints

### Ideas Management

#### Get All Ideas
```http
GET /ai-ideas?status=idea&limit=50&offset=0&search=nodejs
x-api-key: iah_your_api_key_here
```

**Query Parameters:**
- `status` (optional): Filter by status (`idea`, `research`, `progress`, `launched`, `archived`)
- `limit` (optional): Number of results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `search` (optional): Search in titles and descriptions

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "AI-powered code review tool",
      "description": "# Code Review Assistant\n\nAn AI tool that...",
      "status": "idea",
      "tags": ["ai", "development", "automation"],
      "color": "#FF6B6B",
      "user_id": "uuid",
      "created_at": "2025-09-03T00:00:00Z",
      "updated_at": "2025-09-03T00:00:00Z"
    }
  ],
  "meta": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

#### Get Single Idea
```http
GET /ai-ideas/{idea_id}
x-api-key: iah_your_api_key_here
```

#### Create New Idea
```http
POST /ai-ideas
x-api-key: iah_your_api_key_here
Content-Type: application/json

{
  "title": "Revolutionary App Idea",
  "description": "# My Amazing Idea\n\nThis app will change the world by...",
  "status": "idea",
  "tags": ["mobile", "innovation"],
  "color": "#4ECDC4"
}
```

**Required fields:**
- `title` (string, max 500 chars)

**Optional fields:**
- `description` (string, markdown supported, max 10MB)
- `status` (string: `idea`, `research`, `progress`, `launched`, `archived`)
- `tags` (array of strings)
- `color` (string, hex color code)

#### Update Idea
```http
PUT /ai-ideas/{idea_id}
x-api-key: iah_your_api_key_here
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "research",
  "description": "Updated markdown content..."
}
```

#### Delete Idea (Soft Delete)
```http
DELETE /ai-ideas/{idea_id}
x-api-key: iah_your_api_key_here
```

*Note: This performs a soft delete by setting status to 'archived'*

### User Profile

#### Get User Profile
```http
GET /ai-profile
x-api-key: iah_your_api_key_here
```

**Response:**
```json
{
  "data": {
    "user_id": "uuid",
    "profile": {
      "display_name": "John Doe",
      "avatar_color": "#3B82F6",
      "created_at": "2025-01-01T00:00:00Z"
    },
    "settings": {
      "theme": "dark",
      "auto_image_generation": true,
      "ai_description_enhancement": false,
      "markdown_preview": true
    },
    "statistics": {
      "ideas": {
        "idea": 5,
        "research": 2,
        "progress": 1,
        "launched": 0,
        "archived": 3,
        "total": 11
      }
    },
    "api_info": {
      "permissions": ["read", "write"],
      "rate_limit_per_hour": 1000
    }
  }
}
```

### API Key Management (Requires JWT Authentication)

#### List API Keys
```http
GET /ai-keys
Authorization: Bearer <jwt_token>
```

#### Get Single API Key
```http
GET /ai-keys/{key_id}
Authorization: Bearer <jwt_token>
```

#### Update API Key
```http
PUT /ai-keys/{key_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "permissions": ["read", "write", "admin"],
  "rate_limit_per_hour": 2000,
  "is_active": false
}
```

#### Delete API Key
```http
DELETE /ai-keys/{key_id}
Authorization: Bearer <jwt_token>
```

## 📊 Data Models

### Idea Object
```typescript
interface Idea {
  id: string;                    // UUID
  user_id: string;              // UUID (automatically set)
  title: string;                // Required, max 500 chars
  description?: string;         // Optional, markdown supported
  status: 'idea' | 'research' | 'progress' | 'launched' | 'archived';
  tags?: string[];              // Array of tag strings
  color: string;                // Hex color code (default: '#FFF')
  image_url?: string;           // Optional image URL
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}
```

### API Key Object
```typescript
interface ApiKey {
  id: string;                   // UUID
  name: string;                 // Human-readable name
  permissions: string[];        // ['read', 'write', 'admin']
  rate_limit_per_hour: number;  // 1-10000
  usage_count: number;          // Total requests made
  last_used_at?: string;        // ISO timestamp
  expires_at?: string;          // ISO timestamp (optional)
  is_active: boolean;           // Active/inactive status
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}
```

## ❌ Error Handling

All errors return JSON with appropriate HTTP status codes:

```json
{
  "error": "Error message",
  "details": ["Additional error details array (for validation errors)"]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## 💡 Code Examples

### Python Example
```python
import requests
import json

class IdeaHubAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://pqelavffbhqprofqcfis.supabase.co/functions/v1"
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
    
    def get_ideas(self, status=None, limit=50, search=None):
        params = {"limit": limit}
        if status:
            params["status"] = status
        if search:
            params["search"] = search
            
        response = requests.get(
            f"{self.base_url}/ai-ideas", 
            headers=self.headers,
            params=params
        )
        return response.json()
    
    def create_idea(self, title, description=None, tags=None):
        data = {"title": title}
        if description:
            data["description"] = description
        if tags:
            data["tags"] = tags
            
        response = requests.post(
            f"{self.base_url}/ai-ideas",
            headers=self.headers,
            json=data
        )
        return response.json()
    
    def update_idea(self, idea_id, **updates):
        response = requests.put(
            f"{self.base_url}/ai-ideas/{idea_id}",
            headers=self.headers,
            json=updates
        )
        return response.json()

# Usage
api = IdeaHubAPI("iah_your_api_key_here")

# Get all ideas
ideas = api.get_ideas()
print(f"Found {len(ideas['data'])} ideas")

# Create a new idea
new_idea = api.create_idea(
    title="AI Chat Assistant",
    description="# AI Assistant\n\nA conversational AI that helps with...",
    tags=["ai", "chatbot", "automation"]
)
print(f"Created idea: {new_idea['data']['id']}")

# Update idea status
updated = api.update_idea(new_idea['data']['id'], status="research")
print(f"Updated idea status to: {updated['data']['status']}")
```

### JavaScript/Node.js Example
```javascript
class IdeaHubAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://pqelavffbhqprofqcfis.supabase.co/functions/v1';
        this.headers = {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
        };
    }

    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.keys(params).forEach(key => 
            url.searchParams.append(key, params[key])
        );
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.headers
        });
        
        return response.json();
    }

    async post(endpoint, data) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        
        return response.json();
    }

    async put(endpoint, data) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        
        return response.json();
    }

    // API Methods
    async getIdeas(options = {}) {
        return this.get('/ai-ideas', options);
    }

    async createIdea(ideaData) {
        return this.post('/ai-ideas', ideaData);
    }

    async updateIdea(ideaId, updates) {
        return this.put(`/ai-ideas/${ideaId}`, updates);
    }

    async getProfile() {
        return this.get('/ai-profile');
    }
}

// Usage
const api = new IdeaHubAPI('iah_your_api_key_here');

// Get user profile
const profile = await api.getProfile();
console.log(`User: ${profile.data.profile.display_name}`);

// Create and update an idea
const newIdea = await api.createIdea({
    title: 'Smart Home App',
    description: '# Smart Home Control\n\nAn app to control all smart devices...',
    tags: ['iot', 'mobile', 'automation'],
    status: 'idea'
});

console.log(`Created: ${newIdea.data.title}`);

// Move to research phase
await api.updateIdea(newIdea.data.id, { 
    status: 'research',
    description: newIdea.data.description + '\n\n## Research Notes\n- Market analysis needed\n- Competitor review'
});
```

### cURL Examples
```bash
# Get all ideas
curl -X GET "https://pqelavffbhqprofqcfis.supabase.co/functions/v1/ai-ideas?limit=10" \
  -H "x-api-key: iah_your_api_key_here"

# Create a new idea
curl -X POST "https://pqelavffbhqprofqcfis.supabase.co/functions/v1/ai-ideas" \
  -H "x-api-key: iah_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Blockchain Voting System",
    "description": "# Secure Voting\n\nA decentralized voting platform...",
    "tags": ["blockchain", "governance", "security"],
    "status": "idea"
  }'

# Update idea
curl -X PUT "https://pqelavffbhqprofqcfis.supabase.co/functions/v1/ai-ideas/idea-uuid-here" \
  -H "x-api-key: iah_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "research",
    "description": "Updated with research findings..."
  }'

# Get user profile
curl -X GET "https://pqelavffbhqprofqcfis.supabase.co/functions/v1/ai-profile" \
  -H "x-api-key: iah_your_api_key_here"
```

## 🛡️ Security Features

### Markdown Sanitization
All markdown content is automatically sanitized to prevent XSS attacks:
- Script tags and dangerous HTML are removed
- JavaScript and data URLs are stripped
- Content size is limited to 10MB

### Rate Limiting
- Configurable per-key rate limits (1-10,000 requests/hour)
- Automatic usage tracking
- Rate limit headers in responses

### Data Isolation
- Row Level Security (RLS) ensures users can only access their own data
- API keys are hashed and stored securely
- All operations are scoped to the authenticated user

## 🔄 Pagination

For endpoints that return multiple items, use `limit` and `offset`:

```http
GET /ai-ideas?limit=25&offset=50
```

The response includes metadata:
```json
{
  "data": [...],
  "meta": {
    "limit": 25,
    "offset": 50,
    "count": 25
  }
}
```

## 🏷️ Best Practices

### Error Handling
Always check response status and handle errors gracefully:

```javascript
const response = await fetch(url, options);
const data = await response.json();

if (!response.ok) {
    console.error('API Error:', data.error);
    if (data.details) {
        console.error('Details:', data.details);
    }
    return;
}

// Process successful response
console.log('Success:', data.data);
```

### Rate Limit Management
Monitor your usage and implement backoff strategies:

```javascript
async function apiCall(url, options) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
        // Rate limited - wait and retry
        console.log('Rate limited, waiting...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        return apiCall(url, options); // Retry
    }
    
    return response.json();
}
```

### Markdown Best Practices
- Use proper markdown formatting for better readability
- Include headers (`#`, `##`) to structure content
- Use code blocks for technical details
- Keep descriptions focused and well-organized

## 📞 Support

For API support, issues, or questions:
- Check the error messages and status codes
- Review this documentation for proper usage
- Ensure your API key has the correct permissions
- Verify rate limits haven't been exceeded

## 🔗 Additional Resources

- [IdeaHub Web App](https://ideahub-app.vercel.app/)
- [Supabase Documentation](https://supabase.com/docs)
- [Markdown Guide](https://www.markdownguide.org/)

---

*Last updated: September 3, 2025*