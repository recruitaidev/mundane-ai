# GitHub MCP Server
A comprehensive Model Context Protocol (MCP) server for GitHub API integration, providing tools for repository management, issues, pull requests, commits, and user operations.
## Features
### Repository Management
- **list_repositories**: List user repositories with filtering options
- **get_repository**: Get detailed repository information
- **create_repository**: Create new repositories
### Issues Management
- **list_issues**: List repository issues with filtering
- **create_issue**: Create new issues with labels and assignees
### Pull Requests
- **list_pull_requests**: List repository pull requests
- **create_pull_request**: Create new pull requests
### Commits
- **list_commits**: List repository commits with filtering options
### User Operations
- **get_user**: Get user profile information
## Setup
1. **Install dependencies:**
```bash
npm install
```
2. **Environment Configuration:**
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```
Edit `.env`:
```env
GITHUB_TOKEN=your_github_token_here
PORT=3000
GITHUB_API_BASE_URL=https://api.github.com
```
3. **Get GitHub Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with required scopes:
     - `repo` (for repository access)
     - `user` (for user information)
     - `admin:repo_hook` (if you need webhook access)
4. **Start the server:**
```bash
npm start
```
## Usage
The server exposes an MCP endpoint at `http://localhost:3000/mcp`.
### Example Tool Calls
**List repositories:**
```json
{
  "name": "list_repositories",
  "arguments": {
    "type": "owner",
    "sort": "updated",
    "per_page": 10
  }
}
```
**Create an issue:**
```json
{
  "name": "create_issue",
  "arguments": {
    "owner": "username",
    "repo": "repository",
    "title": "Bug report",
    "body": "Description of the bug",
    "labels": ["bug", "priority-high"]
  }
}
```
**Create a pull request:**
```json
{
  "name": "create_pull_request",
  "arguments": {
    "owner": "username",
    "repo": "repository",
    "title": "Feature: Add new functionality",
    "body": "Description of changes",
    "head": "feature-branch",
    "base": "main"
  }
}
```
## API Endpoints
- `POST /mcp` - MCP protocol endpoint
- `GET /health` - Health check endpoint
## Error Handling
The server includes comprehensive error handling for:
- Invalid GitHub tokens
- API rate limiting
- Network errors
- Invalid parameters
## Development
Run in development mode with auto-reload:
```bash
npm run dev
```
## Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```
## License
MIT License