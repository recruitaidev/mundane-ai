// Options page script for AI Form Filler Chrome Extension
// Handles advanced settings and configuration

class OptionsManager {
  constructor() {
    this.initializeElements();
    this.loadSettings();
    this.attachEventListeners();
  }

  initializeElements() {
    this.elements = {
      systemPrompt: document.getElementById('systemPrompt'),
      apiKey: document.getElementById('apiKey'),
      savePrompt: document.getElementById('savePrompt'),
      saveApiKey: document.getElementById('saveApiKey'),
      testConnection: document.getElementById('testConnection'),
      loadExample: document.getElementById('loadExample'),
      status: document.getElementById('status'),
      promptCharCount: document.getElementById('promptCharCount')
    };
  }

  attachEventListeners() {
    // Save system prompt
    this.elements.savePrompt.addEventListener('click', () => {
      this.saveSystemPrompt();
    });

    // Save API key
    this.elements.saveApiKey.addEventListener('click', () => {
      this.saveApiKey();
    });

    // Test API connection
    this.elements.testConnection.addEventListener('click', () => {
      this.testConnection();
    });

    // Load example prompt
    this.elements.loadExample.addEventListener('click', () => {
      this.loadExamplePrompt();
    });

    // Character count for system prompt
    this.elements.systemPrompt.addEventListener('input', () => {
      this.updateCharCount();
    });

    // Auto-save system prompt on change (debounced)
    let promptTimeout;
    this.elements.systemPrompt.addEventListener('input', () => {
      clearTimeout(promptTimeout);
      promptTimeout = setTimeout(() => {
        this.saveSystemPrompt(false); // Silent save
      }, 2000);
    });

    // Auto-save API key on change (debounced)
    let apiKeyTimeout;
    this.elements.apiKey.addEventListener('input', () => {
      clearTimeout(apiKeyTimeout);
      apiKeyTimeout = setTimeout(() => {
        this.saveApiKey(false); // Silent save
      }, 2000);
    });
  }

  async loadSettings() {
    try {
      // Load system prompt from sync storage
      const syncData = await chrome.storage.sync.get(['systemPrompt']);
      if (syncData.systemPrompt) {
        this.elements.systemPrompt.value = syncData.systemPrompt;
        this.updateCharCount();
      }

      // Load API key from local storage (more secure)
      const localData = await chrome.storage.local.get(['apiKey']);
      if (localData.apiKey) {
        this.elements.apiKey.value = localData.apiKey;
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      this.showStatus('Error loading settings', 'error');
    }
  }

  async saveSystemPrompt(showFeedback = true) {
    try {
      const prompt = this.elements.systemPrompt.value.trim();
      
      if (!prompt) {
        if (showFeedback) {
          this.showStatus('Please enter a system prompt', 'error');
        }
        return;
      }

      await chrome.storage.sync.set({ systemPrompt: prompt });
      
      if (showFeedback) {
        this.showStatus('✅ System prompt saved successfully! Changes will apply immediately.', 'success');
      }
    } catch (error) {
      console.error('Error saving system prompt:', error);
      this.showStatus('❌ Error saving system prompt', 'error');
    }
  }

  async saveApiKey(showFeedback = true) {
    try {
      const apiKey = this.elements.apiKey.value.trim();
      
      if (!apiKey) {
        if (showFeedback) {
          this.showStatus('Please enter an API key', 'error');
        }
        return;
      }

      if (!apiKey.startsWith('sk-ant-')) {
        if (showFeedback) {
          this.showStatus('⚠️ API key should start with "sk-ant-"', 'error');
        }
        return;
      }

      await chrome.storage.local.set({ apiKey: apiKey });
      
      if (showFeedback) {
        this.showStatus('✅ API key saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      this.showStatus('❌ Error saving API key', 'error');
    }
  }

  async testConnection() {
    try {
      const apiKey = this.elements.apiKey.value.trim();
      
      if (!apiKey) {
        this.showStatus('Please enter an API key first', 'error');
        return;
      }

      this.elements.testConnection.disabled = true;
      this.elements.testConnection.textContent = 'Testing...';
      this.showStatus('🔄 Testing API connection...', 'info');

      // Send test request to background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'testConnection',
          apiKey: apiKey
        }, resolve);
      });

      if (response.success) {
        this.showStatus('✅ API connection successful! Your key is working properly.', 'success');
      } else {
        this.showStatus(`❌ Connection failed: ${response.error}`, 'error');
      }

    } catch (error) {
      console.error('Error testing connection:', error);
      this.showStatus('❌ Error testing connection', 'error');
    } finally {
      this.elements.testConnection.disabled = false;
      this.elements.testConnection.textContent = 'Test Connection';
    }
  }

  loadExamplePrompt() {
    const examplePrompt = `You are helping fill out professional event registration forms and business inquiry forms. Use a professional but friendly tone throughout.

Personal Information:
- For name fields, use "John Smith"
- For email fields, use "john.smith@techsolutions.com"
- For company/organization, use "TechSolutions Inc."
- For job title/position, use "Senior Software Developer"
- For phone numbers, use "+1 (555) 123-4567"

Professional Background:
- When asked about experience, mention 8+ years in software development
- For skills/expertise, focus on: web development, cloud technologies, AI/ML, and team leadership
- For interests, mention: emerging technologies, digital transformation, and innovation

Communication Style:
- Keep responses concise but informative
- Use professional language appropriate for business contexts
- For "why interested" or motivation fields, express genuine interest in learning and networking
- For bio/description fields, keep to 2-3 sentences maximum

Form-Specific Guidelines:
- For event preferences, choose technical sessions and networking opportunities
- For dietary restrictions, respond "None" unless specifically configured otherwise
- For accessibility needs, respond "None" unless specifically configured otherwise
- For t-shirt sizes, use "Medium"
- For yes/no questions about marketing emails, respond "Yes" for relevant tech content

Always provide responses that are appropriate for the field type and context.`;

    this.elements.systemPrompt.value = examplePrompt;
    this.updateCharCount();
    this.showStatus('📝 Example prompt loaded! Feel free to customize it for your needs.', 'info');
  }

  updateCharCount() {
    const current = this.elements.systemPrompt.value.length;
    const max = 5000;
    this.elements.promptCharCount.textContent = `${current}/${max}`;
    
    if (current > max * 0.9) {
      this.elements.promptCharCount.style.color = '#d73027';
    } else if (current > max * 0.7) {
      this.elements.promptCharCount.style.color = '#fc8d59';
    } else {
      this.elements.promptCharCount.style.color = '#666';
    }
  }

  showStatus(message, type = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
    this.elements.status.classList.remove('hidden');

    // Auto-hide after appropriate time based on type
    const hideTime = type === 'success' ? 8000 : type === 'error' ? 10000 : 6000;
    setTimeout(() => {
      this.elements.status.classList.add('hidden');
    }, hideTime);

    // Scroll status into view
    this.elements.status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
