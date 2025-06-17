import dotenv from 'dotenv';
dotenv.config();
export const config = {
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  server: {
    name: 'github-repo-server',
    version: '1.0.0',
  },
};
// Validate required environment variables
if (!config.github.token) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}