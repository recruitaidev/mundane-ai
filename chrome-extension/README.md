# 🤖 AI Form Filler Chrome Extension

Automatically fill web forms using AI based on your custom prompts. Built for Chrome/Brave browsers.

## ✨ Features

- **Smart Form Detection**: Automatically finds all fillable input and textarea fields
- **Parallel Processing**: Processes multiple fields simultaneously for fast filling
- **Context-Aware**: Considers field labels, placeholders, and surrounding text
- **Persistent Settings**: Your prompts and API key are saved across browser sessions
- **Visual Feedback**: Shows progress and completion status
- **Keyboard Shortcuts**: Quick access with Ctrl+Shift+F
- **Privacy-Focused**: API key stored locally, no data logging

## 🚀 Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. Open Chrome/Brave browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `chrome-extension` folder
6. The extension will appear in your toolbar

### Method 2: Create ZIP Package

1. Zip the entire `chrome-extension` folder
2. Upload to Chrome Web Store (for distribution)

## 🔧 Setup

### 1. Get Anthropic API Key

1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

### 2. Configure the Extension

1. Click the extension icon in your browser toolbar
2. Enter your API key in the "API Configuration" section
3. Create a system prompt that describes how you want forms filled
4. Click "Save" for both settings

### 3. Example System Prompt

```
You are helping fill out professional event registration forms. Use a professional tone.

Personal Info:
- Name: "John Smith"
- Email: "john.smith@techcorp.com" 
- Company: "TechCorp Solutions"
- Title: "Senior Developer"
- Phone: "+1 (555) 123-4567"

For bio/interest fields, mention software development and technology trends.
Keep responses concise and professional.
```

## 📖 Usage

### Basic Usage

1. Navigate to any page with forms
2. Click the extension icon
3. Click "🚀 Fill Forms on This Page"
4. Watch the AI fill all fields automatically!

### Keyboard Shortcut

- Press `Ctrl+Shift+F` on any page to instantly fill forms

### Supported Form Fields

- Text inputs (`<input type="text">`)
- Email inputs (`<input type="email">`)
- Phone inputs (`<input type="tel">`)
- URL inputs (`<input type="url">`)
- Search inputs (`<input type="search">`)
- Password inputs (`<input type="password">`)
- Textareas (`<textarea>`)
- Generic inputs (`<input>` without type)

## 🎯 Perfect For

- **Event Registration**: Conferences, workshops, meetups
- **Contact Forms**: Business inquiries, support requests
- **Lead Generation**: Marketing forms, newsletter signups
- **Account Creation**: Signup forms, profile creation
- **Surveys**: Feedback forms, questionnaires

## 🔒 Privacy & Security

- **Local Storage**: API key stored locally on your device
- **No Data Logging**: Form data is not logged or stored
- **Secure Communication**: Direct API calls to Anthropic
- **Minimal Permissions**: Only requests necessary browser permissions

## 🛠️ Technical Details

### Architecture

- **Manifest V3**: Latest Chrome extension format
- **Service Worker**: Background script for API calls
- **Content Script**: DOM manipulation and field detection
- **Parallel Processing**: Uses `Promise.all()` for simultaneous API calls
- **Error Handling**: Comprehensive error handling and user feedback

### API Integration

```javascript
// Example API call structure
await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    {"role": "system", "content": "Your system prompt"},
    {"role": "user", "content": "Field context and requirements"}
  ]
});
```

### Field Detection Logic

1. Scans page for fillable input/textarea elements
2. Extracts context: labels, placeholders, nearby text
3. Filters out disabled, hidden, or pre-filled fields
4. Sends field data to background script for processing
5. Fills fields with AI responses

## 🐛 Troubleshooting

### Common Issues

**"No fields found"**
- Refresh the page and try again
- Some dynamic forms load fields after page load

**"API connection failed"**
- Check your API key is correct
- Verify you have API credits in your Anthropic account
- Check internet connection

**"Page not ready"**
- Extension may not work on chrome:// pages
- Some sites may block content scripts

**Fields not filling properly**
- Some fields may have custom validation
- Try clicking fields manually after AI filling

### Performance Tips

- Use concise system prompts for faster processing
- The extension processes up to 50 fields simultaneously
- Large forms may take 10-30 seconds to complete

## 📝 Development

### File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls  
├── content.js            # DOM manipulation
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── options.html          # Settings page
├── options.js            # Settings logic
└── icons/               # Extension icons
```

### Adding Features

1. **New Field Types**: Modify `content.js` field detection
2. **Custom Prompts**: Extend prompt construction in `background.js`
3. **UI Improvements**: Update `popup.html` and styles
4. **Storage Options**: Use `chrome.storage.sync` for cross-device sync

## 💰 Cost Considerations

- API usage is charged per request by Anthropic
- Each form field = 1 API request
- Typical cost: $0.01-0.05 per form (varies by field count)
- Check current Anthropic pricing for exact rates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly on various websites
5. Submit pull request

## 📄 License

MIT License - feel free to modify and distribute

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Test on multiple websites to isolate issues
3. Check browser console for error messages
4. Verify API key and credits

---

**Happy form filling! 🎉**
