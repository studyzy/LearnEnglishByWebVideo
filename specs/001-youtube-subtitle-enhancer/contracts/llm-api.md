# LLM API集成合同

**版本**: 1.0.0  
**日期**: 2026-01-20

## 概述

本文档定义Chrome扩展与LLM API(OpenAI、Claude)的集成规范，包括API调用格式、Prompt模板、错误处理和成本优化策略。

---

## 1. 支持的LLM提供商

### 1.1 OpenAI

**API Endpoint**: `https://api.openai.com/v1/chat/completions`  
**推荐模型**: `gpt-4o-mini`  
**定价**: $0.15/M 输入tokens, $0.60/M 输出tokens  
**文档**: https://platform.openai.com/docs/api-reference/chat

### 1.2 Anthropic Claude

**API Endpoint**: `https://api.anthropic.com/v1/messages`  
**推荐模型**: `claude-3-5-haiku-20241022`  
**定价**: $0.25/M 输入tokens, $1.25/M 输出tokens  
**文档**: https://docs.anthropic.com/claude/reference/messages_post

---

## 2. OpenAI API集成

### 2.1 请求格式

```typescript
interface OpenAIRequest {
  model: string; // 'gpt-4o-mini'
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number; // 0-2, 默认1
  max_tokens?: number; // 最大输出tokens
  top_p?: number; // 0-1, 默认1
}
```

### 2.2 响应格式

```typescript
interface OpenAIResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### 2.3 实现代码

```typescript
/**
 * OpenAI API调用服务
 */
export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private model = 'gpt-4o-mini';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 获取单词的上下文解释
   * @param word 目标单词
   * @param context 字幕上下文
   * @returns 中文解释
   */
  async getContextualExplanation(word: string, context: string): Promise<string> {
    const request: OpenAIRequest = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a concise English-Chinese translator for language learners. Provide short, contextual explanations in under 25 Chinese characters. Focus on the meaning in context, not literal dictionary translations.',
        },
        {
          role: 'user',
          content: `Context: "${context}"\nWord: "${word}"\n中文解释:`,
        },
      ],
      temperature: 0.3,
      max_tokens: 60,
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        `OpenAI API error: ${response.status}`,
        response.status,
        errorData
      );
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0].message.content.trim();
  }

  /**
   * 批量翻译(一次请求处理多个单词)
   */
  async getContextualExplanationsBatch(
    words: Array<{ word: string; context: string }>
  ): Promise<Map<string, string>> {
    const batchPrompt = words
      .map((item, i) => `${i + 1}. Context: "${item.context}"\n   Word: "${item.word}"`)
      .join('\n\n');

    const request: OpenAIRequest = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a concise English-Chinese translator. For each numbered item, provide a short Chinese explanation (under 25 characters).',
        },
        {
          role: 'user',
          content: `请为以下单词提供基于上下文的中文解释:\n\n${batchPrompt}\n\n请按编号回答，每行一个解释:`,
        },
      ],
      temperature: 0.3,
      max_tokens: words.length * 30, // 每个单词约30 tokens
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new APIError(
        `OpenAI batch API error: ${response.status}`,
        response.status
      );
    }

    const data: OpenAIResponse = await response.json();
    const explanationsText = data.choices[0].message.content.trim();

    // 解析批量响应
    const results = new Map<string, string>();
    const explanations = explanationsText.split('\n').filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const explanation = explanations[i]?.replace(/^\d+\.\s*/, '').trim() || '[翻译失败]';
      results.set(words[i].word, explanation);
    }

    return results;
  }
}
```

---

## 3. Claude API集成

### 3.1 请求格式

```typescript
interface ClaudeRequest {
  model: string; // 'claude-3-5-haiku-20241022'
  max_tokens: number;
  system?: string; // System prompt
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
}
```

### 3.2 响应格式

```typescript
interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
```

### 3.3 实现代码

```typescript
/**
 * Claude API调用服务
 */
export class ClaudeService {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';
  private model = 'claude-3-5-haiku-20241022';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 获取单词的上下文解释
   */
  async getContextualExplanation(word: string, context: string): Promise<string> {
    const request: ClaudeRequest = {
      model: this.model,
      max_tokens: 60,
      system: 'You are a concise English-Chinese translator. Respond in under 25 Chinese characters.',
      messages: [
        {
          role: 'user',
          content: `Context: "${context}"\nWord: "${word}"\n中文解释:`,
        },
      ],
      temperature: 0.3,
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        `Claude API error: ${response.status}`,
        response.status,
        errorData
      );
    }

    const data: ClaudeResponse = await response.json();
    return data.content[0].text.trim();
  }
}
```

---

## 4. Prompt模板

### 4.1 System Prompt (OpenAI)

```text
You are a concise English-Chinese translator for language learners. 
Provide short, contextual explanations in under 25 Chinese characters. 
Focus on the meaning in context, not literal dictionary translations.
```

**设计理由**:
- **concise**: 强调简洁，控制输出长度
- **contextual explanations**: 强调基于上下文，非字典翻译
- **under 25 Chinese characters**: 明确长度限制

### 4.2 User Prompt Template

```text
Context: "{context}"
Word: "{word}"
中文解释:
```

**变量**:
- `{context}`: 完整的字幕句子
- `{word}`: 需要解释的单词

**示例**:
```text
Context: "The program will run automatically."
Word: "run"
中文解释:
```

**预期输出**:
```text
运行
```

### 4.3 批量翻译Prompt

```text
请为以下单词提供基于上下文的中文解释:

1. Context: "The program will run automatically."
   Word: "run"

2. Context: "She studies medicine at the university."
   Word: "studies"

请按编号回答，每行一个解释:
```

**预期输出**:
```text
1. 运行
2. 学习
```

---

## 5. 错误处理

### 5.1 自定义错误类

```typescript
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export enum ErrorCode {
  INVALID_API_KEY = 401,
  RATE_LIMIT_EXCEEDED = 429,
  SERVER_ERROR = 500,
  NETWORK_ERROR = 0,
}
```

### 5.2 错误分类处理

```typescript
/**
 * 带重试机制的API调用
 */
async function callLLMWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!(error instanceof APIError)) {
        throw error; // 非API错误，直接抛出
      }

      // 401 Unauthorized - 无效API密钥，不重试
      if (error.statusCode === 401) {
        throw new Error('Invalid API key. Please check your settings.');
      }

      // 429 Rate Limit - 指数退避重试
      if (error.statusCode === 429) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`Rate limited, retrying in ${delay}ms... (${attempt}/${maxRetries})`);
          await sleep(delay);
          continue;
        } else {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
      }

      // 500+ Server Error - 重试
      if (error.statusCode >= 500) {
        if (attempt < maxRetries) {
          console.warn(`Server error, retrying... (${attempt}/${maxRetries})`);
          await sleep(1000);
          continue;
        } else {
          throw new Error('LLM service temporarily unavailable. Please try again later.');
        }
      }

      // 其他错误 - 不重试
      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 5.3 用户友好的错误消息

```typescript
function getUserFriendlyErrorMessage(error: APIError): string {
  switch (error.statusCode) {
    case 401:
      return '❌ API密钥无效，请在设置中检查您的密钥';
    case 429:
      return '⏸️ API调用频率超限，请稍后再试';
    case 500:
    case 502:
    case 503:
      return '⚠️ LLM服务暂时不可用，请稍后重试';
    case 0:
      return '🌐 网络连接失败，请检查网络设置';
    default:
      return `⚠️ 翻译失败: ${error.message}`;
  }
}
```

---

## 6. 成本优化

### 6.1 Token使用估算

**单次翻译**:
```
System Prompt: ~50 tokens
User Prompt (context + word): ~50 tokens
Response (中文解释): ~10 tokens
总计: ~110 tokens
```

**成本计算** (GPT-4o-mini):
```
输入: 100 tokens × $0.15 / 1M = $0.000015
输出: 10 tokens × $0.60 / 1M = $0.000006
总计: $0.000021 (~0.002分/次)
```

### 6.2 批量优化

**单独调用** (10个单词):
```
10次请求 × 110 tokens = 1100 tokens
成本: $0.00021
```

**批量调用** (10个单词):
```
System Prompt: ~50 tokens
Batch User Prompt: ~500 tokens (10个单词的上下文)
Response: ~100 tokens (10个解释)
总计: ~650 tokens
成本: $0.00013
```

**节省**: 40%

### 6.3 缓存策略

**缓存有效期**: 7天  
**预期缓存命中率**: 60-80%

**示例**:
- 用户观看10个视频/月
- 每个视频200个生词
- 总计2000个翻译请求
- 缓存命中率60%
- 实际API调用: 800次
- **月度成本**: 800 × $0.000021 = $0.017 (约0.12元人民币)

---

## 7. 速率限制

### 7.1 OpenAI速率限制

**Free Tier**:
- 3 requests/minute (RPM)
- 200 requests/day (RPD)

**Paid Tier** (Tier 1, $5充值后):
- 10,000 RPM
- 10M tokens/month

### 7.2 Claude速率限制

**Free Tier**:
- 5 requests/minute
- 50 requests/day

**Paid Tier**:
- 4000 requests/minute
- Unlimited daily

### 7.3 速率限制管理

```typescript
/**
 * 简单的速率限制器
 */
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerMinute: number;
  private requestTimestamps: number[] = [];

  constructor(requestsPerMinute: number) {
    this.requestsPerMinute = requestsPerMinute;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      // 清理1分钟前的时间戳
      const oneMinuteAgo = Date.now() - 60 * 1000;
      this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);

      // 检查是否达到速率限制
      if (this.requestTimestamps.length >= this.requestsPerMinute) {
        const oldestRequest = this.requestTimestamps[0];
        const waitTime = 60 * 1000 - (Date.now() - oldestRequest);
        console.log(`Rate limit reached, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      // 执行下一个请求
      const task = this.queue.shift();
      if (task) {
        this.requestTimestamps.push(Date.now());
        await task();
      }
    }

    this.processing = false;
  }
}

// 使用示例
const limiter = new RateLimiter(3); // 3 requests/minute

for (const word of words) {
  await limiter.execute(() => translateWord(word));
}
```

---

## 8. 监控与日志

### 8.1 API调用日志

```typescript
interface APICallLog {
  timestamp: number;
  provider: 'openai' | 'claude';
  model: string;
  inputTokens: number;
  outputTokens: number;
  latency: number; // ms
  success: boolean;
  errorCode?: number;
}

/**
 * 记录API调用
 */
async function logAPICall(log: APICallLog): Promise<void> {
  // 存储到chrome.storage或发送到统计服务
  console.log('[API Call]', log);
  
  // 更新统计
  await incrementStatistic('totalApiCalls', 1);
  if (log.success) {
    await incrementStatistic('totalTranslationsUsed', 1);
  }
}
```

### 8.2 性能监控

```typescript
/**
 * 监控API响应时间
 */
async function monitoredAPICall<T>(fn: () => Promise<T>): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const latency = Date.now() - startTime;
    console.log(`API call completed in ${latency}ms`);
    return result;
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`API call failed after ${latency}ms`, error);
    throw error;
  }
}
```

---

## 9. LLM API清单

| 提供商 | 模型 | 输入价格 | 输出价格 | 推荐用途 | 速率限制(Free) |
|--------|------|----------|----------|----------|----------------|
| OpenAI | gpt-4o-mini | $0.15/M | $0.60/M | ✅ 主推荐 | 3 RPM |
| Claude | claude-3-5-haiku | $0.25/M | $1.25/M | 备选 | 5 RPM |

**单次翻译成本**: ~$0.000021 (GPT-4o-mini)  
**月度成本** (800次API调用): ~$0.017

---

## 10. 安全最佳实践

1. ✅ **API密钥存储**: 使用`chrome.storage.local`(Chrome自动加密)
2. ✅ **HTTPS Only**: 所有API调用强制使用HTTPS
3. ✅ **从Service Worker调用**: 避免content script CORS问题
4. ✅ **用户自备密钥**: 扩展不内置密钥，由用户提供
5. ✅ **错误不泄露密钥**: 日志中脱敏API密钥

```typescript
// 脱敏API密钥(仅显示前4和后4字符)
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '***';
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}
```

---

**文档版本**: 1.0.0  
**最后更新**: 2026-01-20
