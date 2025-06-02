// Popup script for AI Form Filler Chrome Extension
// Handles UI interactions and settings management

class PopupManager {
  constructor() {
    this.initializeElements();
    this.loadSettings();
    this.attachEventListeners();
    this.updateFieldCount();
  }

  initializeElements() {
    this.elements = {
      systemPrompt: document.getElementById('systemPrompt'),
      savePrompt: document.getElementById('savePrompt'),
      fillForms: document.getElementById('fillForms'),
      status: document.getElementById('status'),
      fieldCount: document.getElementById('fieldCount'),
      promptCharCount: document.getElementById('promptCharCount'),
      openOptions: document.getElementById('openOptions')
    };
  }

  attachEventListeners() {
    // Save system prompt
    this.elements.savePrompt.addEventListener('click', () => {
      this.saveSystemPrompt();
    });

    // Fill forms
    this.elements.fillForms.addEventListener('click', () => {
      this.fillForms();
    });

    // Open options page
    this.elements.openOptions.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
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
      }, 1000);
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
        this.showStatus('System prompt saved successfully', 'success');
      }
    } catch (error) {
      console.error('Error saving system prompt:', error);
      this.showStatus('Error saving system prompt', 'error');
    }
  }

  async fillForms() {
    console.log('🚀 Fill Forms button clicked');
    
    // Get the current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('📄 Current tab:', tab.url);
    
    if (!tab) {
      console.error('❌ No active tab found');
      this.showStatus('No active tab found', 'error');
      return;
    }

    // Get settings
    const settings = await chrome.storage.sync.get(['systemPrompt']);
    const localStorageData = await chrome.storage.local.get(['apiKey']);
    
    console.log('⚙️ Settings loaded:', { 
      hasPrompt: !!settings.systemPrompt, 
      hasApiKey: !!localStorageData.apiKey 
    });

    if (!settings.systemPrompt || !localStorageData.apiKey) {
      console.error('❌ Missing configuration');
      this.showStatus('Please configure your API key and system prompt first', 'error');
      return;
    }

    try {
      this.showStatus('Detecting form fields...', 'info');
      console.log('📨 Sending message to content script...');
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'fillForms',
        systemPrompt: settings.systemPrompt,
        apiKey: localStorageData.apiKey
      });
      
      console.log('📨 Response from content script:', response);
      
      if (response && response.success) {
        this.showStatus('Forms filled successfully!', 'success');
      } else {
        this.showStatus(`Error: ${response?.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('❌ Error sending message to content script:', error);
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }

  async updateFieldCount() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        this.elements.fieldCount.textContent = 'No active tab';
        return;
      }

      // Check if we can access the tab (not a chrome:// or extension page)
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        this.elements.fieldCount.textContent = 'Cannot access this page';
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'getFieldCount'
      });

      if (response && typeof response.count === 'number') {
        this.elements.fieldCount.textContent = `Found ${response.count} fillable fields`;
        
        // Enable/disable fill button based on field count
        this.elements.fillForms.disabled = response.count === 0;
        
        if (response.count === 0) {
          this.elements.fillForms.textContent = 'No Fields Found';
        } else {
          this.elements.fillForms.textContent = '🚀 Fill Forms on This Page';
        }
      } else {
        this.elements.fieldCount.textContent = 'Unable to scan fields';
      }

    } catch (error) {
      console.error('Error getting field count:', error);
      this.elements.fieldCount.textContent = 'Page not ready - please refresh';
      this.elements.fillForms.disabled = true;
    }
  }

  updateCharCount() {
    const current = this.elements.systemPrompt.value.length;
    const max = 2000;
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

    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        this.elements.status.classList.add('hidden');
      }, 5000);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

// Handle popup reopening
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Popup became visible, update field count
    setTimeout(() => {
      if (window.popupManager) {
        window.popupManager.updateFieldCount();
      }
    }, 100);
  }
});

// Store global reference
document.addEventListener('DOMContentLoaded', () => {
  window.popupManager = new PopupManager();
});
