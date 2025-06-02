// Background script for AI Form Filler Chrome Extension
// Handles Anthropic API calls and parallel processing

class AnthropicAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async callAPI(field, systemPrompt) {
    try {
      const prompt = this.constructPrompt(field, systemPrompt);
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            {
              "role": "user", 
              "content": prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract text content from the response
      const content = data.content?.[0]?.text || '';
      
      return {
        fieldId: field.id,
        success: true,
        value: content.trim(),
        error: null
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      return {
        fieldId: field.id,
        success: false,
        value: '',
        error: error.message
      };
    }
  }

  constructPrompt(field, systemPrompt) {
    return `Fill this form field based on the system instructions:

Field Information:
- Type: ${field.type}
- Label: ${field.label || 'No label'}
- Placeholder: ${field.placeholder || 'No placeholder'}
- Context: ${field.context || 'No additional context'}
- Required: ${field.required ? 'Yes' : 'No'}
- Max Length: ${field.maxLength || 'No limit'}

Instructions:
1. Provide ONLY the value to fill in this field
2. Do not include quotes, explanations, or additional text
3. Make sure the response fits the field type and constraints
4. If it's an email field, provide a valid email format
5. If it's a phone field, provide a valid phone number format
6. Keep responses concise and appropriate for form filling

Response:`;
  }

  async processFieldsInParallel(fields, systemPrompt) {
    console.log(`Processing ${fields.length} fields in parallel`);
    
    const promises = fields.map(field => 
      this.callAPI(field, systemPrompt)
    );
    
    try {
      const results = await Promise.all(promises);
      console.log('All API calls completed:', results);
      return results;
    } catch (error) {
      console.error('Error in parallel processing:', error);
      return fields.map(field => ({
        fieldId: field.id,
        success: false,
        value: '',
        error: 'Parallel processing failed'
      }));
    }
  }
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processFields') {
    handleProcessFields(request, sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'testConnection') {
    handleTestConnection(request, sendResponse);
    return true;
  }
});

async function handleProcessFields(request, sendResponse) {
  try {
    const { fields, systemPrompt, apiKey } = request;
    
    if (!apiKey) {
      sendResponse({
        success: false,
        error: 'API key not provided'
      });
      return;
    }
    
    if (!fields || fields.length === 0) {
      sendResponse({
        success: false,
        error: 'No fields to process'
      });
      return;
    }
    
    const anthropicAPI = new AnthropicAPI(apiKey);
    const results = await anthropicAPI.processFieldsInParallel(fields, systemPrompt);
    
    sendResponse({
      success: true,
      results: results
    });
    
  } catch (error) {
    console.error('Error processing fields:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

async function handleTestConnection(request, sendResponse) {
  try {
    const { apiKey } = request;
    
    console.log('Testing API connection with key:', apiKey.substring(0, 10) + '...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        messages: [
          {
            "role": "user",
            "content": "Test"
          }
        ]
      })
    });
    
    console.log('API Response status:', response.status);
    console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response data:', data);
      sendResponse({ success: true, message: 'API connection successful' });
    } else {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      sendResponse({ success: false, error: `HTTP ${response.status}: ${errorText}` });
    }
    
  } catch (error) {
    console.error('API Connection error:', error);
    sendResponse({ success: false, error: error.message });
  }
}
