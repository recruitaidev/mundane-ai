#!/usr/bin/env node

// Standalone test script for AI Form Filler API functionality
// Usage: node test-api.js

// You'll need to install node-fetch for Node.js
// Run: npm install node-fetch

import fetch from 'node-fetch';

// Make fetch available globally (like in browser)
global.fetch = fetch;

// Import our AnthropicAPI class (copy from background.js)
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

  async testConnection() {
    try {
      console.log('Testing API connection...');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
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
        return { success: true, message: 'API connection successful', data };
      } else {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
      
    } catch (error) {
      console.error('API Connection error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Test configuration
const TEST_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY || '', // Set your API key here or use environment variable
  systemPrompt: `You are helping fill out professional event registration forms. Use a professional tone.

Personal Info:
- Name: "John Smith"
- Email: "john.smith@techcorp.com" 
- Company: "TechCorp Solutions"
- Title: "Senior Developer"
- Phone: "+1 (555) 123-4567"

For bio/interest fields, mention software development and technology trends.
Keep responses concise and professional.`,
  
  testFields: [
    {
      id: 'field_1',
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      context: 'Registration form for tech conference',
      required: true,
      maxLength: null
    },
    {
      id: 'field_2',
      type: 'email',
      label: 'Email Address',
      placeholder: 'your@email.com',
      context: 'Contact information for event updates',
      required: true,
      maxLength: null
    },
    {
      id: 'field_3',
      type: 'text',
      label: 'Company',
      placeholder: 'Company name',
      context: 'Professional information',
      required: false,
      maxLength: 100
    },
    {
      id: 'field_4',
      type: 'tel',
      label: 'Phone Number',
      placeholder: '+1 (555) 123-4567',
      context: 'Emergency contact information',
      required: false,
      maxLength: null
    },
    {
      id: 'field_5',
      type: 'text',
      label: 'Professional Bio',
      placeholder: 'Tell us about yourself',
      context: 'Networking and speaker information',
      required: false,
      maxLength: 500
    }
  ]
};

// Main test function
async function runTests() {
  console.log('🤖 AI Form Filler - API Test Script');
  console.log('=====================================\n');

  // Check API key
  if (!TEST_CONFIG.apiKey) {
    console.error('❌ ERROR: No API key provided!');
    console.log('Set your API key by:');
    console.log('1. export ANTHROPIC_API_KEY="sk-ant-..."');
    console.log('2. Or edit TEST_CONFIG.apiKey in this file');
    process.exit(1);
  }

  const api = new AnthropicAPI(TEST_CONFIG.apiKey);

  // Test 1: Connection Test
  console.log('🔍 Test 1: API Connection');
  console.log('--------------------------');
  const connectionResult = await api.testConnection();
  if (connectionResult.success) {
    console.log('✅ Connection successful!');
  } else {
    console.log('❌ Connection failed:', connectionResult.error);
    process.exit(1);
  }
  console.log('');

  // Test 2: Single Field Test
  console.log('📝 Test 2: Single Field Processing');
  console.log('-----------------------------------');
  const singleField = TEST_CONFIG.testFields[0];
  console.log('Testing field:', singleField.label);
  
  const singleResult = await api.callAPI(singleField, TEST_CONFIG.systemPrompt);
  console.log('Result:', singleResult);
  console.log('');

  // Test 3: Multiple Fields in Parallel
  console.log('⚡ Test 3: Parallel Field Processing');
  console.log('------------------------------------');
  console.log(`Processing ${TEST_CONFIG.testFields.length} fields in parallel...`);
  
  const startTime = Date.now();
  const results = await api.processFieldsInParallel(TEST_CONFIG.testFields, TEST_CONFIG.systemPrompt);
  const endTime = Date.now();
  
  console.log(`\n✨ Completed in ${endTime - startTime}ms\n`);
  
  // Display results
  console.log('📊 Results Summary:');
  console.log('-------------------');
  results.forEach((result, index) => {
    const field = TEST_CONFIG.testFields[index];
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${field.label}: "${result.value || result.error}"`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);

  console.log('\n🎉 Test completed!');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

// Export for use in other scripts
export { AnthropicAPI, TEST_CONFIG, runTests };
