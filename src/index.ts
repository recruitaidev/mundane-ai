import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GitHubService } from './services/github.js';
import { config } from './config.js';
// Initialize GitHub service
const githubService = new GitHubService(config.github.token);
// Create MCP server
const server = new Server(
  {
    name: 'github-repo-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);
// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_repository',
        description: 'Create a new GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Repository name' },
            description: { type: 'string', description: 'Repository description' },
            private: { type: 'boolean', description: 'Whether the repo should be private', default: false },
            auto_init: { type: 'boolean', description: 'Initialize with README', default: true },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_repositories',
        description: 'List user repositories',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['all', 'owner', 'member'], default: 'owner' },
            sort: { type: 'string', enum: ['created', 'updated', 'pushed', 'full_name'], default: 'updated' },
          },
        },
      },
      {
        name: 'get_repository_content',
        description: 'Get file or directory contents from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File or directory path', default: '' },
            ref: { type: 'string', description: 'Branch or commit SHA', default: 'main' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'create_file',
        description: 'Create or update a file in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path' },
            content: { type: 'string', description: 'File content (base64 encoded)' },
            message: { type: 'string', description: 'Commit message' },
            branch: { type: 'string', description: 'Target branch', default: 'main' },
          },
          required: ['owner', 'repo', 'path', 'content', 'message'],
        },
      },
    ],
  };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'create_repository':
        const newRepo = await githubService.createRepository(args);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully created repository: ${newRepo.full_name}\nURL: ${newRepo.html_url}`,
            },
          ],
        };
      case 'list_repositories':
        const repos = await githubService.listRepositories(args);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${repos.length} repositories:\n${repos
                .map(repo => `- ${repo.full_name} (${repo.private ? 'private' : 'public'}) - ${repo.description || 'No description'}`)
                .join('\n')}`,
            },
          ],
        };
      case 'get_repository_content':
        const content = await githubService.getRepositoryContent(args);
        return {
          content: [
            {
              type: 'text',
              text: `Repository content for ${args.owner}/${args.repo}:${args.path}\n${JSON.stringify(content, null, 2)}`,
            },
          ],
        };
      case 'create_file':
        const fileResult = await githubService.createFile(args);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully created/updated file: ${args.path}\nCommit SHA: ${fileResult.commit.sha}`,
            },
          ],
        };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});
// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub Repository MCP Server running on stdio');
}
main().catch(console.error);