import { Octokit } from '@octokit/rest';
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}
export interface CreateRepositoryParams {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
}
export interface ListRepositoriesParams {
  type?: 'all' | 'owner' | 'member';
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
}
export interface GetContentParams {
  owner: string;
  repo: string;
  path?: string;
  ref?: string;
}
export interface CreateFileParams {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  branch?: string;
}
export class GitHubService {
  private octokit: Octokit;
  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
      userAgent: 'GitHub-MCP-Server/1.0.0',
    });
  }
  async createRepository(params: CreateRepositoryParams): Promise<Repository> {
    const response = await this.octokit.rest.repos.createForAuthenticatedUser({
      name: params.name,
      description: params.description,
      private: params.private ?? false,
      auto_init: params.auto_init ?? true,
    });
    return response.data;
  }
  async listRepositories(params: ListRepositoriesParams = {}): Promise<Repository[]> {
    const response = await this.octokit.rest.repos.listForAuthenticatedUser({
      type: params.type ?? 'owner',
      sort: params.sort ?? 'updated',
      per_page: 50,
    });
    return response.data;
  }
  async getRepositoryContent(params: GetContentParams) {
    const response = await this.octokit.rest.repos.getContent({
      owner: params.owner,
      repo: params.repo,
      path: params.path ?? '',
      ref: params.ref,
    });
    return response.data;
  }
  async createFile(params: CreateFileParams) {
    // First check if file exists
    let sha: string | undefined;
    try {
      const existing = await this.octokit.rest.repos.getContent({
        owner: params.owner,
        repo: params.repo,
        path: params.path,
        ref: params.branch ?? 'main',
      });
      if ('sha' in existing.data) {
        sha = existing.data.sha;
      }
    } catch (error) {
      // File doesn't exist, that's fine for creation
    }
    const response = await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      message: params.message,
      content: Buffer.from(params.content).toString('base64'),
      branch: params.branch ?? 'main',
      sha,
    });
    return response.data;
  }
  async getUserInfo() {
    const response = await this.octokit.rest.users.getAuthenticated();
    return response.data;
  }
}