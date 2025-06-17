import { GitHubService } from '../src/services/github.js';
import { config } from '../src/config.js';
async function testBasicFunctionality() {
  console.log('Testing GitHub MCP Server...');
  
  try {
    const githubService = new GitHubService(config.github.token);
    
    // Test user info
    const user = await githubService.getUserInfo();
    console.log(`✓ Connected as: ${user.login}`);
    
    // Test repository listing
    const repos = await githubService.listRepositories({ type: 'owner' });
    console.log(`✓ Found ${repos.length} repositories`);
    
    console.log('🎉 All tests passed! Server is ready to use.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  testBasicFunctionality();
}