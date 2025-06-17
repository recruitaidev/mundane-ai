import { GitHubService } from '../services/github.js';
export class ResourceManager {
  constructor(private githubService: GitHubService) {}
  async listResources() {
    const user = await this.githubService.getUserInfo();
    const repos = await this.githubService.listRepositories({ type: 'owner' });
    const resources = [];
    // Add user profile as a resource
    resources.push({
      uri: `github://user/${user.login}`,
      name: `GitHub Profile: ${user.login}`,
      description: 'Your GitHub user profile information',
      mimeType: 'application/json',
    });
    // Add each repository as a resource
    for (const repo of repos.slice(0, 20)) { // Limit to first 20 repos
      resources.push({
        uri: `github://repo/${repo.full_name}`,
        name: `Repository: ${repo.name}`,
        description: repo.description || 'No description available',
        mimeType: 'application/json',
      });
    }
    return resources;
  }
  async readResource(uri: string) {
    const [, , type, identifier] = uri.split('/');
    switch (type) {
      case 'user':
        const user = await this.githubService.getUserInfo();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(user, null, 2),
            },
          ],
        };
      case 'repo':
        const [owner, repo] = identifier.split('/');
        const repoData = await this.githubService.getRepositoryContent({ owner, repo });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(repoData, null, 2),
            },
          ],
        };
      default:
        throw new Error(`Unknown resource type: ${type}`);
    }
  }
}