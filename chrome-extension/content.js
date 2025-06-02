// Content script for AI Form Filler Chrome Extension
// Handles DOM manipulation, field detection, and form filling

console.log('🤖 AI Form Filler Content Script Loaded');

class FormFieldProcessor {
  constructor() {
    this.fieldIdCounter = 0;
  }

  // Find all fillable form fields on the page
  findFormFields() {
    console.log('🔍 Starting field detection...');
    const fields = [];
    
    // Input fields selector
    const inputSelector = 'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"], input[type="password"], input:not([type])';
    const inputs = document.querySelectorAll(inputSelector);
    
    // Textarea fields
    const textareas = document.querySelectorAll('textarea');
    
    console.log(`Found ${inputs.length} input fields and ${textareas.length} textarea fields`);
    
    // Process input fields
    inputs.forEach(element => {
      if (this.isFieldFillable(element)) {
        const fieldData = this.extractFieldContext(element);
        if (fieldData) {
          console.log('✅ Added fillable field:', fieldData);
          fields.push(fieldData);
        }
      } else {
        console.log('❌ Skipped non-fillable field:', element);
      }
    });
    
    // Process textarea fields
    textareas.forEach(element => {
      if (this.isFieldFillable(element)) {
        const fieldData = this.extractFieldContext(element);
        if (fieldData) {
          console.log('✅ Added fillable field:', fieldData);
          fields.push(fieldData);
        }
      } else {
        console.log('❌ Skipped non-fillable field:', element);
      }
    });
    
    console.log(`Found ${fields.length} fillable fields:`, fields);
    return fields;
  }

  // Check if field is fillable
  isFieldFillable(element) {
    console.log('🔍 Checking if field is fillable:', element);
    // Skip if field is disabled, readonly, or hidden
    if (element.disabled || element.readOnly || element.hidden) {
      console.log('❌ Field is disabled, readonly, or hidden:', element);
      return false;
    }
    
    // Skip if field has display: none or visibility: hidden
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      console.log('❌ Field is not visible:', element);
      return false;
    }
    
    // Skip if field is not visible (zero dimensions)
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.log('❌ Field has zero dimensions:', element);
      return false;
    }
    
    // Skip if field already has significant content
    if (element.value && element.value.length > 3) {
      console.log('❌ Field already has content:', element);
      return false;
    }
    
    console.log('✅ Field is fillable:', element);
    return true;
  }

  // Extract context information for a field
  extractFieldContext(element) {
    console.log('🔍 Extracting field context:', element);
    const id = `field_${this.fieldIdCounter++}`;
    
    // Store reference to actual element
    element.setAttribute('data-ai-field-id', id);
    
    const fieldData = {
      id: id,
      type: element.type || 'text',
      tagName: element.tagName.toLowerCase(),
      name: element.name || '',
      placeholder: element.placeholder || '',
      required: element.required || false,
      maxLength: element.maxLength || null,
      label: '',
      context: ''
    };
    
    // Find associated label
    fieldData.label = this.findLabel(element);
    
    // Get surrounding context
    fieldData.context = this.getSurroundingContext(element);
    
    console.log('✅ Extracted field context:', fieldData);
    return fieldData;
  }

  // Find label text for a field
  findLabel(element) {
    console.log('🔍 Finding label for field:', element);
    let labelText = '';
    
    // Method 1: Direct label association
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        labelText = label.textContent.trim();
      }
    }
    
    // Method 2: Parent label
    if (!labelText) {
      const parentLabel = element.closest('label');
      if (parentLabel) {
        labelText = parentLabel.textContent.trim();
        // Remove the input's own text if it's included
        if (element.value) {
          labelText = labelText.replace(element.value, '').trim();
        }
      }
    }
    
    // Method 3: aria-label or aria-labelledby
    if (!labelText) {
      labelText = element.getAttribute('aria-label') || '';
      
      if (!labelText && element.getAttribute('aria-labelledby')) {
        const labelId = element.getAttribute('aria-labelledby');
        const labelElement = document.getElementById(labelId);
        if (labelElement) {
          labelText = labelElement.textContent.trim();
        }
      }
    }
    
    // Method 4: Previous sibling text
    if (!labelText) {
      let sibling = element.previousElementSibling;
      while (sibling && !labelText) {
        if (sibling.textContent && sibling.textContent.trim()) {
          labelText = sibling.textContent.trim();
          break;
        }
        sibling = sibling.previousElementSibling;
      }
    }
    
    console.log('✅ Found label text:', labelText);
    return labelText;
  }

  // Get surrounding context text
  getSurroundingContext(element) {
    console.log('🔍 Getting surrounding context:', element);
    const context = [];
    
    // Get parent container text
    const parent = element.closest('div, fieldset, form, section');
    if (parent) {
      const parentText = parent.textContent.trim();
      // Get first 200 characters of parent text (excluding the field's own content)
      let contextText = parentText.substring(0, 200);
      if (element.value) {
        contextText = contextText.replace(element.value, '');
      }
      context.push(contextText);
    }
    
    // Get nearby text nodes
    const walker = document.createTreeWalker(
      element.parentElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    const nearbyTexts = [];
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text && text.length > 2) {
        nearbyTexts.push(text);
      }
    }
    
    context.push(...nearbyTexts.slice(0, 3)); // Take first 3 meaningful text nodes
    
    console.log('✅ Got surrounding context:', context.join(' ').substring(0, 300));
    return context.join(' ').substring(0, 300); // Limit context length
  }

  // Fill fields with AI responses
  async fillFields(results) {
    console.log('🤖 Filling fields with AI responses:', results);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const result of results) {
      try {
        const element = document.querySelector(`[data-ai-field-id="${result.fieldId}"]`);
        
        if (element && result.success && result.value) {
          // Clear existing value
          element.value = '';
          
          // Simulate typing for better compatibility
          element.focus();
          
          // Set the value
          element.value = result.value;
          
          // Trigger events that forms might listen to
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Add visual feedback
          element.style.backgroundColor = '#e8f5e8';
          setTimeout(() => {
            element.style.backgroundColor = '';
          }, 1000);
          
          console.log('✅ Filled field:', element);
          successCount++;
        } else if (!result.success) {
          console.error(`Failed to fill field ${result.fieldId}:`, result.error);
          
          // Add error visual feedback
          const element = document.querySelector(`[data-ai-field-id="${result.fieldId}"]`);
          if (element) {
            element.style.backgroundColor = '#ffebee';
            setTimeout(() => {
              element.style.backgroundColor = '';
            }, 2000);
          }
          
          errorCount++;
        }
      } catch (error) {
        console.error('Error filling field:', error);
        errorCount++;
      }
    }
    
    // Show completion notification
    this.showNotification(`Form filling completed! ${successCount} fields filled successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}.`);
  }

  // Show notification to user
  showNotification(message) {
    console.log('📣 Showing notification:', message);
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Process all fields with AI
  async processWithAI(systemPrompt, apiKey) {
    console.log('🤖 Processing fields with AI:', systemPrompt, apiKey);
    try {
      const fields = this.findFormFields();
      
      if (fields.length === 0) {
        this.showNotification('No fillable fields found on this page.');
        return;
      }
      
      this.showNotification(`Processing ${fields.length} fields...`);
      
      // Send to background script for API processing
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'processFields',
          fields: fields,
          systemPrompt: systemPrompt,
          apiKey: apiKey
        }, resolve);
      });
      
      if (response.success) {
        await this.fillFields(response.results);
      } else {
        console.error('Error from background script:', response.error);
        this.showNotification(`Error: ${response.error}`);
      }
      
    } catch (error) {
      console.error('Error in processWithAI:', error);
      this.showNotification(`Error: ${error.message}`);
    }
  }
}

// Global instance
const formProcessor = new FormFieldProcessor();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Content script received message:', request);
  
  if (request.action === 'fillForms') {
    console.log('🚀 Starting form filling process...');
    formProcessor.processWithAI(request.systemPrompt, request.apiKey)
      .then(() => {
        console.log('✅ Form filling completed successfully');
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('❌ Form filling failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open
  }
  
  if (request.action === 'getFieldCount') {
    console.log('🔢 Getting field count...');
    const fields = formProcessor.findFormFields();
    console.log(`Found ${fields.length} fillable fields`);
    sendResponse({ count: fields.length, fields: fields });
    return true;
  }
  
  console.log('❓ Unknown message action:', request.action);
});

// Optional: Add keyboard shortcut
document.addEventListener('keydown', (event) => {
  // Ctrl+Shift+F to trigger form filling
  if (event.ctrlKey && event.shiftKey && event.key === 'F') {
    event.preventDefault();
    
    // Get settings and trigger form filling
    chrome.storage.sync.get(['systemPrompt'], (result) => {
      chrome.storage.local.get(['apiKey'], (localResult) => {
        if (result.systemPrompt && localResult.apiKey) {
          formProcessor.processWithAI(result.systemPrompt, localResult.apiKey);
        } else {
          formProcessor.showNotification('Please set up your system prompt and API key first.');
        }
      });
    });
  }
});
