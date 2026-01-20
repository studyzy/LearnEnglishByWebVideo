# LLM API Integration Research Report for Chrome Extension
## Contextual Translation Feature Implementation Guide

**Date:** 2026-01-20  
**Purpose:** Research for integrating OpenAI and Claude APIs into Chrome extension for contextual word translation

---

## Executive Summary

### Key Recommendations
1. **Use fetch API directly** instead of official SDKs for browser compatibility
2. **Call APIs from service worker** (not content script) to avoid CORS issues
3. **Start with GPT-4o-mini** as primary model (best cost/performance balance)
4. **Store API keys in chrome.storage.local** (encrypted if possible)
5. **Implement aggressive caching** using word+context hash as key
6. **Use short, focused prompts** optimized for contextual explanations

---

## 1. API Integration Approach

### Recommended Strategy: Fetch API (Not Official SDKs)

#### Why NOT use official SDKs?

**OpenAI SDK Issues:**
- Large bundle size (not optimized for browser)
- Designed for Node.js environment
- Includes unnecessary dependencies for simple API calls
- No clear browser compatibility documentation

**Anthropic Claude SDK Issues:**
- Similar Node.js focus
- Bundle size concerns
- Limited browser usage documentation

#### Recommended Approach: Direct fetch() Calls

**Advantages:**
```javascript
// Lightweight, native browser API
// No dependencies, no bundle bloat
// Full control over requests
// Works in Manifest V3 service workers
```

**Implementation:**

```javascript
// OpenAI API Call (from service worker)
async function callOpenAI(prompt, context, word) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a concise English-Chinese translator. Explain words based on context.'
        },
        {
          role: 'user',
          content: `Context: "${context}"\n\nExplain the word "${word}" in Chinese (20 words max).`
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Claude API Call (from service worker)
async function callClaude(prompt, context, word) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Context: "${context}"\n\nExplain the word "${word}" in Chinese (20 words max).`
      }]
    })
  });
  
  const data = await response.json();
  return data.content[0].text;
}
```

---

## 2. API Endpoints and Formats

### OpenAI Chat Completions API

**Endpoint:** `https://api.openai.com/v1/chat/completions`

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
```

**Request Body:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "system", "content": "System prompt"},
    {"role": "user", "content": "User message"}
  ],
  "max_tokens": 100,
  "temperature": 0.3
}
```

**Response Format:**
```json
{
  "id": "chatcmpl-xxx",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Response text here"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 15,
    "total_tokens": 40
  }
}
```

### Claude Messages API

**Endpoint:** `https://api.anthropic.com/v1/messages`

**Request Headers:**
```json
{
  "x-api-key": "YOUR_API_KEY",
  "anthropic-version": "2023-06-01",
  "content-type": "application/json"
}
```

**Request Body:**
```json
{
  "model": "claude-3-5-haiku-20241022",
  "max_tokens": 100,
  "messages": [
    {"role": "user", "content": "Message text"}
  ]
}
```

**Response Format:**
```json
{
  "id": "msg_xxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {"type": "text", "text": "Response text"}
  ],
  "usage": {
    "input_tokens": 25,
    "output_tokens": 15
  }
}
```

### Streaming vs Non-Streaming

**Recommendation: Non-streaming for this use case**

**Reasons:**
- Translations are short (< 100 tokens)
- Response time difference negligible for short outputs
- Simpler implementation (no SSE parsing)
- Easier error handling
- Better for caching (need complete response)

**When to use streaming:**
- Long-form content generation
- Progressive UI updates important
- Slow response times noticeable

---

## 3. Security Considerations

### Chrome Extension Storage Security

#### chrome.storage.local Basics

**Security Model:**
- Data stored locally on user's machine
- NOT synced across devices (use `chrome.storage.sync` for that)
- Isolated per extension (other extensions can't access)
- No built-in encryption

**Security Level: Medium**
- Safe from other websites/extensions
- Vulnerable if attacker has local file system access
- Vulnerable if extension is compromised

#### Best Practices for API Key Storage

**✅ RECOMMENDED APPROACH:**

```javascript
// 1. Store API keys in chrome.storage.local
async function saveApiKey(provider, apiKey) {
  await chrome.storage.local.set({
    [`${provider}_api_key`]: apiKey
  });
}

async function getApiKey(provider) {
  const result = await chrome.storage.local.get([`${provider}_api_key`]);
  return result[`${provider}_api_key`];
}

// 2. Optional: Basic obfuscation (NOT real encryption)
function obfuscateKey(key) {
  return btoa(key); // Base64 encode
}

function deobfuscateKey(encoded) {
  return atob(encoded); // Base64 decode
}

// 3. Best: Let users provide their own API keys
// Don't embed keys in extension code!
```

**⚠️ CRITICAL RULES:**

1. **NEVER hardcode API keys** in extension code
2. **NEVER commit API keys** to git repository
3. **Always let users input their own keys** via options page
4. **Clear API keys** when user uninstalls extension
5. **Validate API keys** before storing

**Chrome Storage Permissions:**

```json
// manifest.json
{
  "permissions": ["storage"]
}
```

#### CORS and Content Script Issues

**Problem:** Content scripts run in webpage context → CORS restrictions apply

**Solution:** Make API calls from service worker (background script)

**Architecture:**

```
┌─────────────────┐
│  Content Script │  (Detects word hover, sends message)
└────────┬────────┘
         │ chrome.runtime.sendMessage()
         ▼
┌─────────────────┐
│ Service Worker  │  (Makes API calls, NO CORS issues)
└────────┬────────┘
         │ fetch() to OpenAI/Claude
         ▼
┌─────────────────┐
│   LLM API       │
└─────────────────┘
```

**Implementation:**

```javascript
// content-script.js
chrome.runtime.sendMessage({
  type: 'TRANSLATE_WORD',
  word: 'run',
  context: 'The program will run automatically'
}, (response) => {
  console.log('Translation:', response.translation);
});

// service-worker.js (background)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSLATE_WORD') {
    translateWord(message.word, message.context)
      .then(translation => sendResponse({translation}))
      .catch(error => sendResponse({error: error.message}));
    return true; // Keep channel open for async response
  }
});
```

**Manifest V3 Configuration:**

```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://api.openai.com/*",
    "https://api.anthropic.com/*"
  ]
}
```

---

## 4. Cost Optimization

### Model Pricing Comparison (2024-2025)

#### OpenAI Models

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|---------------------|----------------------|----------|
| **GPT-4o-mini** | $0.15 | $0.60 | **✅ RECOMMENDED** Short translations |
| GPT-3.5-turbo | $0.50 | $1.50 | Legacy (being phased out) |
| GPT-4o | $2.50 | $10.00 | Complex reasoning (overkill) |

**Cost Analysis for Short Translations:**
- Average prompt: ~50 tokens (context + word + instructions)
- Average response: ~30 tokens (Chinese explanation)
- **Cost per translation: $0.000015 (1.5¢ per 1000 translations)**

#### Claude Models

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|---------------------|----------------------|----------|
| **Claude 3.5 Haiku** | $0.25 | $1.25 | **✅ RECOMMENDED** Fast, cheap |
| Claude 3.5 Sonnet | $3.00 | $15.00 | Advanced reasoning |

**Cost Analysis:**
- **Cost per translation: $0.000025 (2.5¢ per 1000 translations)**

### Cost Optimization Strategies

#### 1. Aggressive Caching

**Strategy:** Cache translations by word + context hash

```javascript
// Generate cache key
function getCacheKey(word, context) {
  // Use first 100 chars of context to avoid huge keys
  const contextSnippet = context.substring(0, 100);
  const combined = `${word.toLowerCase()}:${contextSnippet}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return `trans_${Math.abs(hash)}`;
}

// Cache with expiration
async function getCachedTranslation(word, context) {
  const key = getCacheKey(word, context);
  const result = await chrome.storage.local.get(key);
  
  if (result[key]) {
    const cached = result[key];
    const ageHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
    
    if (ageHours < 168) { // 7 days
      return cached.translation;
    }
  }
  return null;
}

async function cacheTranslation(word, context, translation) {
  const key = getCacheKey(word, context);
  await chrome.storage.local.set({
    [key]: {
      word,
      translation,
      timestamp: Date.now()
    }
  });
}
```

**Cache Strategy:**
- **Cache duration:** 7 days (168 hours)
- **Cache invalidation:** LRU if storage > 5MB
- **Expected hit rate:** 60-80% for common words

**Cost Savings:**
- With 70% cache hit rate: **70% cost reduction**
- 1000 translations: 300 API calls → $0.0045 vs $0.015

#### 2. Batch Processing (Advanced)

**When to batch:**
- User reading long article
- Multiple unknown words detected
- Background processing acceptable

**Example:**
```javascript
async function batchTranslate(wordContextPairs) {
  // Send multiple words in one API call
  const prompt = wordContextPairs.map(({word, context}, i) => 
    `${i+1}. Context: "${context}"\n   Word: "${word}"`
  ).join('\n\n');
  
  // Request structured output
  // Response: JSON array of translations
}
```

**Cost savings:** ~30% (fewer API calls)

**Trade-offs:**
- More complex prompt
- Harder to cache individual words
- All-or-nothing error handling

#### 3. Model Selection Strategy

```javascript
// Choose model based on context complexity
function selectModel(context, word) {
  const contextLength = context.length;
  const isIdiom = /[a-z]+ [a-z]+/.test(word); // Multi-word phrase
  
  if (contextLength > 500 || isIdiom) {
    return 'gpt-4o-mini'; // Better context understanding
  } else {
    return 'gpt-4o-mini'; // Still cheapest option
  }
}
```

**Recommendation:** Just use GPT-4o-mini for everything (simplicity > micro-optimization)

---

## 5. Prompt Engineering

### Contextual Word Explanation Template

#### Proven Prompt Structure

**System Prompt:**
```
You are a concise English-Chinese translator specializing in contextual word explanations for language learners. Provide brief, accurate translations based on the given context.
```

**User Prompt Template:**
```
Context: "{context_sentence}"

Explain the word "{target_word}" as used in this context. Provide:
1. Chinese translation (根据上下文的中文翻译)
2. Part of speech (词性)
3. Brief explanation in Chinese (简短解释)

Keep response under 30 Chinese characters total.
```

#### Optimized Prompts for Different Use Cases

**1. Single Word Translation:**
```javascript
const prompt = `Context: "${context}"

Word: "${word}"

Provide a contextual Chinese explanation (max 20 characters):
`;
```

**Example:**
```
Context: "The program will run automatically"
Word: "run"

Response: "运行;动词;程序执行的意思"
```

**2. Phrase/Idiom Translation:**
```javascript
const prompt = `Context: "${context}"

Phrase: "${phrase}"

Explain this phrase in Chinese considering the context (max 30 characters):
`;
```

**Example:**
```
Context: "Let's call it a day and go home"
Phrase: "call it a day"

Response: "今天就到这;习语;结束工作或活动"
```

**3. With Example Sentence:**
```javascript
const prompt = `Context: "${context}"

Word: "${word}"

Provide:
1. Chinese meaning (中文含义): [translation]
2. Usage note (用法说明): [brief note]

Format: JSON
`;
```

**Example Response:**
```json
{
  "meaning": "跑步;奔跑",
  "usage": "在此句中作动词,表示'运行、执行'"
}
```

### Prompt Optimization Tips

**✅ DO:**
- Be specific about output format
- Set character/word limits
- Provide clear context boundaries
- Use structured output (JSON) for parsing
- Set low temperature (0.2-0.3) for consistency

**❌ DON'T:**
- Use vague instructions like "translate this"
- Allow open-ended responses
- Forget to specify language (Chinese)
- Use high temperature (reduces consistency)
- Over-explain the task

### Example Implementation

```javascript
async function getContextualTranslation(word, context, provider = 'openai') {
  const systemPrompt = 'You are a concise English-Chinese translator. Respond in under 25 Chinese characters.';
  
  const userPrompt = `Context: "${context}"\n\nWord: "${word}"\n\n中文解释:`;
  
  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: userPrompt}
        ],
        max_tokens: 60,
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
  
  // Similar for Claude...
}
```

---

## 6. Error Handling

### Common API Errors

#### OpenAI Error Codes

| Status | Error | Meaning | Solution |
|--------|-------|---------|----------|
| 401 | invalid_api_key | API key invalid/missing | Prompt user to check key |
| 429 | rate_limit_exceeded | Too many requests | Implement retry with backoff |
| 429 | quota_exceeded | Monthly quota reached | Show upgrade message |
| 500 | server_error | OpenAI service issue | Retry after delay |
| 503 | service_unavailable | Temporary outage | Retry with exponential backoff |

#### Claude Error Codes

| Status | Error | Meaning | Solution |
|--------|-------|---------|----------|
| 401 | invalid_api_key | API key invalid | Check API key |
| 429 | rate_limit_error | Rate limit hit | Implement backoff |
| 529 | overloaded_error | System overloaded | Retry after 10-30s |

### Error Handling Implementation

```javascript
class APIError extends Error {
  constructor(message, statusCode, retryable = false) {
    super(message);
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

async function callAPIWithRetry(apiFunction, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.statusCode === 401) {
        throw new APIError('Invalid API key. Please check your settings.', 401, false);
      }
      
      // Retry on rate limits with exponential backoff
      if (error.statusCode === 429) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Retry on server errors
      if (error.statusCode >= 500) {
        const delay = 2000 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Don't retry on other errors
      throw error;
    }
  }
  
  throw lastError;
}

// Usage
async function translateWithErrorHandling(word, context) {
  try {
    return await callAPIWithRetry(() => 
      getContextualTranslation(word, context)
    );
  } catch (error) {
    if (error.statusCode === 401) {
      // Show API key setup UI
      return 'API密钥无效,请在设置中配置';
    } else if (error.statusCode === 429) {
      // Show rate limit message
      return '请求过于频繁,请稍后再试';
    } else {
      // Generic error
      return '翻译失败,请重试';
    }
  }
}
```

### Rate Limit Strategies

**OpenAI Rate Limits (typical free tier):**
- 3 requests per minute (RPM)
- 40,000 tokens per minute (TPM)

**Mitigation Strategies:**

1. **Request Queue:**
```javascript
class RequestQueue {
  constructor(maxRPM = 3) {
    this.queue = [];
    this.processing = false;
    this.requestTimestamps = [];
    this.maxRPM = maxRPM;
  }
  
  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({requestFn, resolve, reject});
      this.process();
    });
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      // Check if we can make a request
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      
      // Remove old timestamps
      this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
      
      if (this.requestTimestamps.length >= this.maxRPM) {
        // Wait until we can make another request
        const oldestTimestamp = this.requestTimestamps[0];
        const waitTime = 60000 - (now - oldestTimestamp) + 100;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Process next request
      const {requestFn, resolve, reject} = this.queue.shift();
      this.requestTimestamps.push(now);
      
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    
    this.processing = false;
  }
}

const requestQueue = new RequestQueue(3); // 3 RPM

// Usage
await requestQueue.add(() => translateWord('run', context));
```

2. **User Feedback:**
```javascript
// Show pending requests in UI
chrome.runtime.sendMessage({
  type: 'SHOW_QUEUE_STATUS',
  queueLength: requestQueue.queue.length
});
```

---

## 7. Recommended Implementation Architecture

### Complete Flow

```
┌─────────────────────────────────────────────────────────┐
│                      USER INTERACTION                     │
│  (Hover over word in subtitle → Content Script detects)  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              CONTENT SCRIPT (content.js)                  │
│  1. Extract word and surrounding context                 │
│  2. Check if word needs translation                      │
│  3. Send message to service worker                       │
└─────────────────┬───────────────────────────────────────┘
                  │ chrome.runtime.sendMessage()
                  ▼
┌─────────────────────────────────────────────────────────┐
│           SERVICE WORKER (service-worker.js)              │
│  1. Receive translation request                          │
│  2. Check cache (chrome.storage.local)                   │
│  3. If cache hit → return immediately                    │
│  4. If cache miss → make API call                        │
│  5. Cache result                                          │
│  6. Return to content script                             │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  OpenAI API  │    │  Claude API  │
│ (GPT-4o-mini)│    │  (Haiku 3.5) │
└──────────────┘    └──────────────┘
```

### File Structure

```
extension/
├── manifest.json
├── service-worker.js         # Background script, API calls
├── content-script.js         # Word detection, UI
├── options.html              # Settings page
├── options.js                # API key management
├── lib/
│   ├── api-client.js        # API wrapper
│   ├── cache-manager.js     # Translation caching
│   ├── prompt-builder.js    # Prompt templates
│   └── error-handler.js     # Error handling utilities
└── ui/
    └── tooltip.css          # Translation tooltip styles
```

### Key Implementation Files

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "Learn English by Web Video",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://api.openai.com/*",
    "https://api.anthropic.com/*"
  ],
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "css": ["ui/tooltip.css"]
    }
  ],
  "options_page": "options.html"
}
```

**service-worker.js (simplified):**
```javascript
import { APIClient } from './lib/api-client.js';
import { CacheManager } from './lib/cache-manager.js';

const apiClient = new APIClient();
const cacheManager = new CacheManager();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSLATE_WORD') {
    handleTranslation(message.word, message.context)
      .then(translation => sendResponse({success: true, translation}))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // Keep channel open
  }
});

async function handleTranslation(word, context) {
  // 1. Check cache
  const cached = await cacheManager.get(word, context);
  if (cached) return cached;
  
  // 2. Make API call
  const translation = await apiClient.translate(word, context);
  
  // 3. Cache result
  await cacheManager.set(word, context, translation);
  
  return translation;
}
```

---

## 8. References

### Official Documentation

**OpenAI:**
- API Reference: https://platform.openai.com/docs/api-reference
- Chat Completions Guide: https://platform.openai.com/docs/guides/chat-completions
- Error Codes: https://platform.openai.com/docs/guides/error-codes
- Pricing: https://openai.com/api/pricing/

**Anthropic Claude:**
- API Documentation: https://docs.anthropic.com/
- Messages API: https://docs.anthropic.com/en/api/messages
- Rate Limits: https://docs.anthropic.com/en/api/rate-limits
- Pricing: https://www.anthropic.com/pricing

**Chrome Extension Development:**
- Manifest V3 Guide: https://developer.chrome.com/docs/extensions/mv3/intro/
- Service Workers: https://developer.chrome.com/docs/extensions/mv3/service_workers/
- Storage API: https://developer.chrome.com/docs/extensions/reference/storage/
- Message Passing: https://developer.chrome.com/docs/extensions/mv3/messaging/

### Best Practices Guides

**Security:**
- Chrome Extension Security: https://developer.chrome.com/docs/extensions/mv3/security/
- API Key Management: Never hardcode keys, use user-provided keys
- Storage Security: chrome.storage.local is isolated but not encrypted

**Prompt Engineering:**
- OpenAI Prompt Engineering Guide: https://platform.openai.com/docs/guides/prompt-engineering
- Few-shot Learning: Provide examples for better results
- Temperature Control: Use 0.2-0.3 for consistent translations

---

## 9. Next Steps

### Implementation Checklist

- [ ] Set up Chrome extension boilerplate (Manifest V3)
- [ ] Implement options page for API key management
- [ ] Create service worker with API client
- [ ] Implement cache manager with hash-based keys
- [ ] Build content script for word detection
- [ ] Design translation tooltip UI
- [ ] Add error handling and retry logic
- [ ] Implement request queue for rate limiting
- [ ] Add usage statistics (tokens used, cost tracking)
- [ ] Write tests for API client and cache
- [ ] Optimize prompts based on testing
- [ ] Add support for both OpenAI and Claude
- [ ] Implement fallback mechanism (if one API fails, try other)

### Testing Strategy

1. **Unit Tests:**
   - Cache key generation
   - API request formatting
   - Error handling logic

2. **Integration Tests:**
   - API calls with real keys (dev environment)
   - Cache hit/miss scenarios
   - Rate limit handling

3. **User Testing:**
   - Test with various subtitle contexts
   - Verify translation accuracy
   - Check UI responsiveness
   - Monitor API costs

### Future Enhancements

- **Offline Mode:** Cache most common 1000 words with pre-generated translations
- **Custom Prompts:** Let users customize translation style
- **Multiple Languages:** Support other target languages (Spanish, French, etc.)
- **Batch Mode:** Pre-translate entire subtitle file
- **Analytics Dashboard:** Show learning progress, word frequency
- **Anki Integration:** Export words to flashcard app

---

## 10. Cost Projections

### Typical Usage Scenarios

**Light User (100 words/day):**
- Daily cost: $0.0015 (100 words × $0.000015)
- Monthly cost: $0.045 (~¥0.33 CNY)
- With 70% cache hit rate: **$0.014/month**

**Medium User (500 words/day):**
- Daily cost: $0.0075
- Monthly cost: $0.225 (~¥1.64 CNY)
- With 70% cache hit rate: **$0.068/month**

**Heavy User (1000 words/day):**
- Daily cost: $0.015
- Monthly cost: $0.45 (~¥3.27 CNY)
- With 70% cache hit rate: **$0.135/month**

**Conclusion:** Extremely affordable, even without aggressive optimization.

---

## Summary

### TL;DR - Quick Start Guide

1. **Use fetch API** (not SDKs) in service worker
2. **Choose GPT-4o-mini** ($0.15 input, $0.60 output per 1M tokens)
3. **Store keys** in chrome.storage.local via options page
4. **Cache aggressively** with word+context hash
5. **Use this prompt:**
   ```
   Context: "{context}"
   Word: "{word}"
   中文解释(max 20 chars):
   ```
6. **Handle errors** with retry + exponential backoff
7. **Queue requests** to avoid rate limits

**Expected Cost:** < $0.15/month for typical usage

**Implementation Time:** ~2-3 days for MVP

---

**Report End**
