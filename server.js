import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(express.json());
// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';
if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN is required. Please set it in your .env file');
  process.exit(1);
}
// GitHub API helper function
async function githubRequest(endpoint, options = {}) {
  const url = `${GITHUB_API_BASE}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-MCP-Server/1.0.0',
    ...options.headers
  };
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`GitHub API Error (${response.status}): ${errorData}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`GitHub API request failed for ${endpoint}:`, error.message);
    throw error;
  }
}
// Create server instance
function createGitHubServer() {
  const server = new McpServer({
    name: 'GitHub MCP Server',
    version: '1.0.0'
  });
  // ===============================
  // REPOSITORY TOOLS
  // ===============================
  // List user repositories
  server.tool(
    'list_repositories',
    {
      username: z.string().optional(),
      type: z.enum(['all', 'owner', 'public', 'private', 'member']).default('owner'),
      sort: z.enum(['created', 'updated', 'pushed', 'full_name']).default('updated'),
      per_page: z.number().min(1).max(100).default(30)
    },
    async ({ username, type, sort, per_page }) => {
      const endpoint = username 
        ? `/users/${username}/repos`
        : '/user/repos';
      
      const params = new URLSearchParams({
        type,
        sort,
        per_page: per_page.toString()
      });
      const repos = await githubRequest(`${endpoint}?${params}`);
      
      return {
        content: [{
          type: 'text',
          text: `Found ${repos.length} repositories:\n\n` +
                repos.map(repo => 
                  `• **${repo.name}** (${repo.private ? 'Private' : 'Public'})\n` +
                  `  ${repo.description || 'No description'}\n` +
                  `  ⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count} | Updated: ${new Date(repo.updated_at).toLocaleDateString()}\n` +
                  `  ${repo.html_url}\n`
                ).join('\n')
        }]
      };
    }
  );
  // Get repository details
  server.tool(
    'get_repository',
    {
      owner: z.string(),
      repo: z.string()
    },
    async ({ owner, repo }) => {
      const repository = await githubRequest(`/repos/${owner}/${repo}`);
      
      return {
        content: [{
          type: 'text',
          text: `# ${repository.full_name}\n\n` +
                `**Description:** ${repository.description || 'No description'}\n` +
                `**Language:** ${repository.language || 'Not specified'}\n` +
                `**Stars:** ${repository.stargazers_count}\n` +
                `**Forks:** ${repository.forks_count}\n` +
                `**Open Issues:** ${repository.open_issues_count}\n` +
                `**Default Branch:** ${repository.default_branch}\n` +
                `**Created:** ${new Date(repository.created_at).toLocaleDateString()}\n` +
                `**Updated:** ${new Date(repository.updated_at).toLocaleDateString()}\n` +
                `**URL:** ${repository.html_url}\n` +
                `**Clone URL:** ${repository.clone_url}`
        }]
      };
    }
  );
  // Create repository
  server.tool(
    'create_repository',
    {
      name: z.string(),
      description: z.string().optional(),
      private: z.boolean().default(false),
      auto_init: z.boolean().default(true)
    },
    async ({ name, description, private: isPrivate, auto_init }) => {
      const repoData = {
        name,
        description,
        private: isPrivate,
        auto_init
      };
      const newRepo = await githubRequest('/user/repos', {
        method: 'POST',
        body: JSON.stringify(repoData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return {
        content: [{
          type: 'text',
          text: `✅ Repository "${newRepo.full_name}" created successfully!\n\n` +
                `**URL:** ${newRepo.html_url}\n` +
                `**Clone URL:** ${newRepo.clone_url}\n` +
                `**Private:** ${newRepo.private ? 'Yes' : 'No'}`
        }]
      };
    }
  );
  // ===============================
  // ISSUES TOOLS
  // ===============================
  // List issues
  server.tool(
    'list_issues',
    {
      owner: z.string(),
      repo: z.string(),
      state: z.enum(['open', 'closed', 'all']).default('open'),
      labels: z.string().optional(),
      per_page: z.number().min(1).max(100).default(30)
    },
    async ({ owner, repo, state, labels, per_page }) => {
      const params = new URLSearchParams({
        state,
        per_page: per_page.toString()
      });
      if (labels) {
        params.append('labels', labels);
      }
      const issues = await githubRequest(`/repos/${owner}/${repo}/issues?${params}`);
      
      return {
        content: [{
          type: 'text',
          text: `Found ${issues.length} issues in ${owner}/${repo}:\n\n` +
                issues.map(issue => 
                  `• **#${issue.number}** ${issue.title}\n` +
                  `  State: ${issue.state} | Author: ${issue.user.login}\n` +
                  `  Created: ${new Date(issue.created_at).toLocaleDateString()}\n` +
                  `  ${issue.html_url}\n`
                ).join('\n')
        }]
      };
    }
  );
  // Create issue
  server.tool(
    'create_issue',
    {
      owner: z.string(),
      repo: z.string(),
      title: z.string(),
      body: z.string().optional(),
      labels: z.array(z.string()).optional(),
      assignees: z.array(z.string()).optional()
    },
    async ({ owner, repo, title, body, labels, assignees }) => {
      const issueData = {
        title,
        body,
        labels,
        assignees
      };
      const newIssue = await githubRequest(`/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        body: JSON.stringify(issueData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return {
        content: [{
          type: 'text',
          text: `✅ Issue #${newIssue.number} created successfully!\n\n` +
                `**Title:** ${newIssue.title}\n` +
                `**URL:** ${newIssue.html_url}\n` +
                `**State:** ${newIssue.state}`
        }]
      };
    }
  );
  // ===============================
  // PULL REQUESTS TOOLS
  // ===============================
  // List pull requests
  server.tool(
    'list_pull_requests',
    {
      owner: z.string(),
      repo: z.string(),
      state: z.enum(['open', 'closed', 'all']).default('open'),
      per_page: z.number().min(1).max(100).default(30)
    },
    async ({ owner, repo, state, per_page }) => {
      const params = new URLSearchParams({
        state,
        per_page: per_page.toString()
      });
      const prs = await githubRequest(`/repos/${owner}/${repo}/pulls?${params}`);
      
      return {
        content: [{
          type: 'text',
          text: `Found ${prs.length} pull requests in ${owner}/${repo}:\n\n` +
                prs.map(pr => 
                  `• **#${pr.number}** ${pr.title}\n` +
                  `  State: ${pr.state} | Author: ${pr.user.login}\n` +
                  `  From: ${pr.head.ref} → ${pr.base.ref}\n` +
                  `  Created: ${new Date(pr.created_at).toLocaleDateString()}\n` +
                  `  ${pr.html_url}\n`
                ).join('\n')
        }]
      };
    }
  );
  // Create pull request
  server.tool(
    'create_pull_request',
    {
      owner: z.string(),
      repo: z.string(),
      title: z.string(),
      body: z.string().optional(),
      head: z.string(),
      base: z.string(),
      draft: z.boolean().default(false)
    },
    async ({ owner, repo, title, body, head, base, draft }) => {
      const prData = {
        title,
        body,
        head,
        base,
        draft
      };
      const newPR = await githubRequest(`/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        body: JSON.stringify(prData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return {
        content: [{
          type: 'text',
          text: `✅ Pull Request #${newPR.number} created successfully!\n\n` +
                `**Title:** ${newPR.title}\n` +
                `**From:** ${newPR.head.ref} → ${newPR.base.ref}\n` +
                `**URL:** ${newPR.html_url}\n` +
                `**State:** ${newPR.state}\n` +
                `**Draft:** ${newPR.draft ? 'Yes' : 'No'}`
        }]
      };
    }
  );
  // ===============================
  // COMMITS TOOLS
  // ===============================
  // List commits
  server.tool(
    'list_commits',
    {
      owner: z.string(),
      repo: z.string(),
      sha: z.string().optional(),
      path: z.string().optional(),
      per_page: z.number().min(1).max(100).default(30)
    },
    async ({ owner, repo, sha, path, per_page }) => {
      const params = new URLSearchParams({
        per_page: per_page.toString()
      });
      if (sha) params.append('sha', sha);
      if (path) params.append('path', path);
      const commits = await githubRequest(`/repos/${owner}/${repo}/commits?${params}`);
      
      return {
        content: [{
          type: 'text',
          text: `Found ${commits.length} commits in ${owner}/${repo}:\n\n` +
                commits.map(commit => 
                  `• **${commit.sha.substring(0, 7)}** ${commit.commit.message.split('\n')[0]}\n` +
                  `  Author: ${commit.commit.author.name} (${commit.commit.author.email})\n` +
                  `  Date: ${new Date(commit.commit.author.date).toLocaleDateString()}\n` +
                  `  ${commit.html_url}\n`
                ).join('\n')
        }]
      };
    }
  );
  // ===============================
  // USER TOOLS
  // ===============================
  // Get user info
  server.tool(
    'get_user',
    {
      username: z.string().optional()
    },
    async ({ username }) => {
      const endpoint = username ? `/users/${username}` : '/user';
      const user = await githubRequest(endpoint);
      
      return {
        content: [{
          type: 'text',
          text: `# ${user.name || user.login}\n\n` +
                `**Username:** ${user.login}\n` +
                `**Bio:** ${user.bio || 'No bio'}\n` +
                `**Company:** ${user.company || 'Not specified'}\n` +
                `**Location:** ${user.location || 'Not specified'}\n` +
                `**Public Repos:** ${user.public_repos}\n` +
                `**Followers:** ${user.followers}\n` +
                `**Following:** ${user.following}\n` +
                `**Created:** ${new Date(user.created_at).toLocaleDateString()}\n` +
                `**Profile:** ${user.html_url}`
        }]
      };
    }
  );
  return server;
}
// Stateless HTTP handler
app.post('/mcp', async (req, res) => {
  try {
    const server = createGitHubServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Handle non-MCP requests
app.get('/mcp', async (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed. Use POST for MCP requests."
    },
    id: null
  });
});
app.delete('/mcp', async (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed. Use POST for MCP requests."
    },
    id: null
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GitHub MCP Server running on port ${PORT}`);
  console.log(`📡 MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});