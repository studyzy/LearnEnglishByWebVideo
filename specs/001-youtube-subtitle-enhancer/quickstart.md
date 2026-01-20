# 快速开始指南: YouTube智能字幕增强器

**版本**: 1.0.0  
**日期**: 2026-01-20  
**目标读者**: 开发人员

## 概述

本指南帮助开发人员快速搭建YouTube智能字幕增强器的开发环境并开始编码。

---

## 1. 环境要求

### 1.1 必需软件

- **Node.js**: 18.0+ (推荐20.0+)
- **npm**: 9.0+ (或yarn, pnpm)
- **Chrome浏览器**: 88+ (用于测试Manifest V3扩展)
- **代码编辑器**: VSCode (推荐) 或其他支持TypeScript的IDE

### 1.2 推荐工具

- **Chrome扩展开发工具**: Chrome DevTools
- **API测试工具**: Postman或curl (测试LLM API)

---

## 2. 项目初始化

### 2.1 使用WXT框架创建项目

```bash
# 创建项目
npm create wxt@latest youtube-subtitle-enhancer -- --template vanilla-ts

# 进入项目目录
cd youtube-subtitle-enhancer

# 安装依赖
npm install
```

### 2.2 安装额外依赖

```bash
# 词形还原库
npm install wink-lemmatizer

# CSV处理库
npm install papaparse
npm install --save-dev @types/papaparse

# 测试框架
npm install --save-dev vitest @vitest/ui vitest-chrome @playwright/test

# Chrome types
npm install --save-dev @types/chrome

# 代码质量工具
npm install --save-dev eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### 2.3 项目结构

创建完整的项目结构:

```bash
mkdir -p src/{background,content,options,popup,lib,assets/{icons,dictionaries,_locales/{en,zh_CN}}}
mkdir -p tests/{unit,integration,e2e}
```

完整结构:
```
youtube-subtitle-enhancer/
├── src/
│   ├── background/              # Service Worker
│   │   ├── service-worker.ts
│   │   ├── llm-service.ts
│   │   ├── subtitle-processor.ts
│   │   ├── vocabulary-service.ts
│   │   └── storage-manager.ts
│   ├── content/                 # Content Scripts
│   │   ├── youtube-injector.ts
│   │   ├── subtitle-renderer.ts
│   │   ├── ui-overlay.ts
│   │   └── content.css
│   ├── options/                 # Options Page
│   │   ├── options.html
│   │   ├── options.ts
│   │   ├── components/
│   │   │   ├── vocabulary-manager.ts
│   │   │   ├── csv-handler.ts
│   │   │   └── settings-form.ts
│   │   └── options.css
│   ├── popup/                   # Popup
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── lib/                     # 共享库
│   │   ├── lemmatizer.ts
│   │   ├── word-difficulty.ts
│   │   ├── message-bridge.ts
│   │   └── utils.ts
│   └── assets/
│       ├── icons/
│       ├── dictionaries/
│       │   ├── beginner-words.ts
│       │   ├── intermediate-words.ts
│       │   └── advanced-words.ts
│       └── _locales/
│           ├── en/messages.json
│           └── zh_CN/messages.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── wxt.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── package.json
└── README.md
```

---

## 3. 配置文件

### 3.1 WXT配置 (wxt.config.ts)

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'YouTube智能字幕增强器',
    description: 'Enhance YouTube subtitles with AI-powered contextual translations',
    version: '1.0.0',
    permissions: ['storage', 'activeTab'],
    host_permissions: [
      '*://*.youtube.com/*',
      'https://api.openai.com/*',
      'https://api.anthropic.com/*',
    ],
  },
  runner: {
    startUrls: ['https://www.youtube.com/watch?v=jNQXAC9IVRw'],
  },
});
```

### 3.2 TypeScript配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "types": ["chrome", "vitest/globals"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist", ".output"]
}
```

### 3.3 Vitest配置 (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', '.output/'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3.4 Playwright配置 (playwright.config.ts)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### 3.5 ESLint配置 (.eslintrc.json)

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

---

## 4. 开发工作流

### 4.1 启动开发服务器

```bash
# 启动WXT开发模式(自动打开Chrome并加载扩展)
npm run dev
```

**效果**:
- WXT自动打开Chrome浏览器
- 加载扩展到指定的YouTube视频页面
- 监听文件变更，自动热重载

### 4.2 手动加载扩展(可选)

如果需要在现有Chrome浏览器中加载:

```bash
# 构建扩展
npm run build

# 在Chrome中:
# 1. 打开 chrome://extensions/
# 2. 开启"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择 .output/chrome-mv3 目录
```

### 4.3 常用命令

```bash
# 开发模式(热重载)
npm run dev

# 生产构建
npm run build

# 运行测试
npm run test              # Vitest单元测试
npm run test:coverage     # 带覆盖率报告
npm run test:e2e          # Playwright E2E测试

# 代码检查
npm run lint              # ESLint
npm run format            # Prettier格式化

# 打包发布
npm run zip               # 生成Chrome Web Store zip包
```

---

## 5. 核心功能实现示例

### 5.1 Service Worker入口 (src/background/service-worker.ts)

```typescript
/**
 * Service Worker主入口
 * 处理扩展后台逻辑
 */

import { LLMService } from './llm-service';
import { VocabularyService } from './vocabulary-service';
import { SubtitleProcessor } from './subtitle-processor';

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // 初始化默认配置
    await initializeDefaultSettings();
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // 保持异步响应通道开启
});

async function handleMessage(message: any, sender: any, sendResponse: Function) {
  try {
    switch (message.type) {
      case 'GET_SUBTITLE':
        const result = await processSubtitle(message.payload);
        sendResponse({ success: true, data: result });
        break;
      
      case 'TRANSLATE_WORDS':
        const translations = await translateWords(message.payload.words);
        sendResponse({ success: true, data: translations });
        break;
      
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function initializeDefaultSettings() {
  // 从data-model.md中复制默认UserProfile
  const defaultProfile = {
    englishLevel: 'intermediate',
    llmProvider: 'openai',
    llmApiKey: '',
    masteredWords: [],
    focusWords: [],
    subtitleFontSize: 16,
    subtitleFontColor: '#ffffff',
    subtitleBackgroundColor: 'rgba(0,0,0,0.8)',
    translationColor: '#ffeb3b',
    isEnabled: true,
    showOnboardingGuide: true,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  };
  
  await chrome.storage.local.set({ user_profile: defaultProfile });
}
```

### 5.2 Content Script入口 (src/content/youtube-injector.ts)

```typescript
/**
 * Content Script主入口
 * 注入到YouTube页面，劫持字幕
 */

console.log('YouTube Subtitle Enhancer loaded');

// 等待YouTube播放器加载
waitForYouTubePlayer().then(() => {
  console.log('YouTube player detected');
  initializeEnhancer();
});

async function waitForYouTubePlayer(): Promise<void> {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const videoElement = document.querySelector('video');
      if (videoElement) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

async function initializeEnhancer() {
  // 1. 提取视频ID
  const videoId = getVideoIdFromUrl();
  console.log('Video ID:', videoId);

  // 2. 获取字幕轨道
  const captionTrack = await extractCaptionTrack();
  if (!captionTrack) {
    console.warn('No English captions available');
    return;
  }

  // 3. 请求Service Worker处理字幕
  const response = await chrome.runtime.sendMessage({
    type: 'GET_SUBTITLE',
    payload: {
      videoId,
      captionTrackUrl: captionTrack.baseUrl,
      isAutoGenerated: captionTrack.isAutoGenerated,
    },
  });

  if (response.success) {
    renderEnhancedSubtitles(response.data.segments);
  }
}

function getVideoIdFromUrl(): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v') || '';
}
```

### 5.3 Options Page (src/options/options.html)

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube智能字幕增强器 - 设置</title>
  <link rel="stylesheet" href="options.css">
</head>
<body>
  <div class="container">
    <h1>⚙️ 设置</h1>

    <section class="section">
      <h2>LLM API配置</h2>
      <div class="form-group">
        <label for="llm-provider">服务提供商</label>
        <select id="llm-provider">
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
        </select>
      </div>
      <div class="form-group">
        <label for="api-key">API密钥</label>
        <input type="password" id="api-key" placeholder="sk-...">
      </div>
    </section>

    <section class="section">
      <h2>英语水平</h2>
      <div class="form-group">
        <label>
          <input type="radio" name="english-level" value="beginner">
          初级 (3000词)
        </label>
        <label>
          <input type="radio" name="english-level" value="intermediate" checked>
          中级 (6000词)
        </label>
        <label>
          <input type="radio" name="english-level" value="advanced">
          高级 (10000词)
        </label>
      </div>
    </section>

    <section class="section">
      <h2>词汇表管理</h2>
      <div class="actions">
        <button id="export-btn">📥 导出词汇表</button>
        <button id="import-btn">📤 导入词汇表</button>
        <input type="file" id="file-input" accept=".csv" style="display: none;">
      </div>
    </section>

    <div class="actions">
      <button id="save-btn" class="primary">💾 保存设置</button>
    </div>
  </div>

  <script type="module" src="options.ts"></script>
</body>
</html>
```

---

## 6. 调试技巧

### 6.1 Service Worker调试

```bash
# 1. 打开 chrome://extensions/
# 2. 找到扩展，点击"Service Worker"链接
# 3. 在DevTools中查看console日志和设置断点
```

### 6.2 Content Script调试

```bash
# 1. 打开YouTube视频页面
# 2. F12打开DevTools
# 3. 在Console中输入: console.log(window.ytInitialPlayerResponse)
# 4. 查看content script注入的DOM元素
```

### 6.3 Storage查看

```bash
# 在DevTools Console中:
chrome.storage.local.get(null, console.log)
```

### 6.4 常见问题

**问题1: Content script未注入**
- 检查`wxt.config.ts`中的`host_permissions`
- 确认页面URL匹配`*://*.youtube.com/*`
- 刷新页面重试

**问题2: Service Worker未响应消息**
- 检查Service Worker是否active (chrome://extensions/)
- 查看Service Worker DevTools中的错误日志
- 确认`sendResponse()`在异步操作完成后调用

**问题3: API调用CORS错误**
- 确保从Service Worker而非content script调用LLM API
- 检查`manifest.json`中的`host_permissions`

---

## 7. 测试指南

### 7.1 单元测试示例

创建 `tests/unit/lemmatizer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Lemmatizer } from '@/lib/lemmatizer';

describe('Lemmatizer', () => {
  const lemmatizer = new Lemmatizer();

  it('should lemmatize regular verbs', () => {
    expect(lemmatizer.lemmatize('running', 'verb')).toBe('run');
    expect(lemmatizer.lemmatize('studies', 'verb')).toBe('study');
  });

  it('should lemmatize irregular verbs', () => {
    expect(lemmatizer.lemmatize('went', 'verb')).toBe('go');
    expect(lemmatizer.lemmatize('ran', 'verb')).toBe('run');
  });

  it('should recognize same lemma', () => {
    expect(lemmatizer.isSameLemma('run', 'running')).toBe(true);
    expect(lemmatizer.isSameLemma('go', 'went')).toBe(true);
  });
});
```

运行测试:
```bash
npm run test
```

### 7.2 E2E测试示例

创建 `tests/e2e/youtube-workflow.test.ts`:

```typescript
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test('should enhance YouTube subtitles', async () => {
  // 加载扩展
  const extensionPath = path.join(__dirname, '../../.output/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = await context.newPage();
  await page.goto('https://www.youtube.com/watch?v=jNQXAC9IVRw');

  // 等待视频加载
  await page.waitForSelector('video', { timeout: 10000 });

  // 等待增强字幕出现
  await page.waitForSelector('.subtitle-enhanced', { timeout: 5000 });

  // 验证字幕包含翻译
  const subtitle = await page.locator('.subtitle-enhanced').first();
  expect(await subtitle.textContent()).toBeTruthy();

  await context.close();
});
```

运行E2E测试:
```bash
npm run test:e2e
```

---

## 8. 发布准备

### 8.1 构建生产版本

```bash
npm run build

# 输出目录: .output/chrome-mv3/
```

### 8.2 打包为ZIP

```bash
npm run zip

# 输出: .output/chrome-mv3.zip
```

### 8.3 提交到Chrome Web Store

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 上传`.output/chrome-mv3.zip`
3. 填写商店列表信息(名称、描述、截图)
4. 提交审核

---

## 9. 下一步

完成快速开始后，您可以:

1. **阅读详细设计文档**:
   - [data-model.md](./data-model.md) - 数据模型设计
   - [contracts/](./contracts/) - API合同定义
   - [research.md](./research.md) - 技术选型研究

2. **开始实施任务**:
   - 运行 `/speckit.tasks` 生成任务清单
   - 按优先级完成各项任务

3. **遵循开发规范**:
   - 每个函数必须有JSDoc注释
   - 所有代码必须通过ESLint和Prettier检查
   - 测试覆盖率必须达到60%+

---

## 10. 有用资源

### 官方文档
- [WXT Framework](https://wxt.dev/)
- [Chrome Extensions (Manifest V3)](https://developer.chrome.com/docs/extensions/mv3/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

### 项目相关
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Claude API Docs](https://docs.anthropic.com/claude/reference)
- [PapaParse](https://www.papaparse.com/)
- [wink-lemmatizer](https://www.npmjs.com/package/wink-lemmatizer)

### 社区资源
- [WXT GitHub](https://github.com/wxt-dev/wxt)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

---

**文档版本**: 1.0.0  
**最后更新**: 2026-01-20

**祝开发顺利！🚀**
