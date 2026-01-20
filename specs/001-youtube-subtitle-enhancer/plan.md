# 实施计划: YouTube智能字幕增强器

**分支**: `001-youtube-subtitle-enhancer` | **日期**: 2026-01-20 | **规范**: [spec.md](./spec.md)
**输入**: 来自 `/specs/001-youtube-subtitle-enhancer/spec.md` 的功能规范

## 摘要

本功能实现一个Chrome扩展，用于增强YouTube视频的英文字幕学习体验。核心功能包括：
1. 自动下载YouTube视频字幕
2. 基于用户英语水平识别生词
3. 调用LLM API提供基于上下文的中文解释
4. 在原生字幕区域叠加增强字幕
5. 支持词形智能识别和交互式标记
6. 提供CSV导入导出功能管理词汇表

技术方法需要研究以下关键决策：
- Chrome扩展构建框架选择
- YouTube字幕获取方案
- 词形还原(lemmatization)库选择
- LLM API集成方案
- 字幕渲染和注入方案
- CSV处理库选择

## 技术背景

**语言/版本**: NEEDS CLARIFICATION - JavaScript/TypeScript版本选择
**主要依赖**: NEEDS CLARIFICATION - Chrome扩展框架、词形还原库、LLM SDK
**存储**: chrome.storage.local API (扩展内置)
**测试**: NEEDS CLARIFICATION - Chrome扩展测试框架选择
**目标平台**: Chrome 88+ (Manifest V3要求)
**项目类型**: Chrome Extension (单一浏览器扩展项目)
**性能目标**: 
- 字幕增强处理<3秒(包括LLM调用)
- 字幕同步延迟<200ms
- 交互式标记响应<500ms
- 1000词CSV导入<2秒
**约束条件**: 
- 内存占用<50MB
- chrome.storage.local配额限制(约5-10MB)
- 必须遵循YouTube服务条款
- 必须通过Chrome Web Store审核
**规模/范围**: 
- 预计用户词汇表<10000词
- 支持30分钟+视频字幕处理
- 需要缓存字幕和翻译结果

## 章程检查

*门控: 必须在阶段 0 研究前通过. 阶段 1 设计后重新检查.*

以下检查基于项目章程(constitution.md v1.0.0):

- [x] **Chrome扩展规范合规**: 是否使用Manifest V3? 是否遵循Service Worker架构?
  - **计划**: 使用Manifest V3，Service Worker处理后台任务和LLM API调用
  - **阶段0评估**: ✅ 研究完成，选定WXT框架(原生Manifest V3支持)
  - **阶段1评估**: ✅ 设计完成，contracts/定义了Service Worker消息协议
  - **最终状态**: ✅ **完全符合**

- [x] **代码质量与注释**: 是否计划详细的JSDoc注释? 是否有文件头注释策略?
  - **计划**: 所有函数使用JSDoc，文件头包含版权、作者、用途说明
  - **阶段0评估**: ✅ TypeScript选定，提供类型注释基础
  - **阶段1评估**: ✅ quickstart.md中明确注释要求，示例代码已包含JSDoc
  - **最终状态**: ✅ **完全符合**

- [x] **测试覆盖率要求**: 是否规划达到60%覆盖率的测试策略? 核心逻辑是否规划80%覆盖?
  - **计划**: 核心业务逻辑(词汇识别、词形还原、LLM调用)80%覆盖，整体60%覆盖
  - **阶段0评估**: ✅ 选定Vitest+Playwright测试框架
  - **阶段1评估**: ✅ vitest.config.ts中配置60%覆盖率阈值，quickstart.md提供测试示例
  - **最终状态**: ✅ **完全符合**

- [x] **模块化与职责分离**: content scripts、background、popup职责是否明确分离?
  - **计划**: 
    - Content Script: YouTube DOM操作、字幕注入、UI交互
    - Service Worker: LLM API调用、字幕处理、数据缓存
    - Options Page: 用户设置、词汇管理、CSV导入导出
  - **阶段0评估**: ✅ WXT框架支持文件路由，职责自然分离
  - **阶段1评估**: ✅ 项目结构明确分离src/background、src/content、src/options
  - **最终状态**: ✅ **完全符合**

- [x] **性能与用户体验**: 是否考虑按需加载? 是否所有耗时操作异步? 是否有用户反馈机制?
  - **计划**: 
    - Content Script仅在youtube.com/watch页面注入
    - 所有LLM API调用和字幕处理异步执行
    - 长时间操作显示loading状态，错误有友好提示
  - **阶段0评估**: ✅ 研究确认缓存策略(7天)和性能目标(<3s字幕处理)
  - **阶段1评估**: ✅ data-model.md定义缓存机制，contracts/message-api.md定义异步消息传递
  - **最终状态**: ✅ **完全符合**

- [x] **安全要求**: 是否遵循CSP? 是否所有外部输入经过验证? 是否HTTPS only?
  - **计划**: 
    - 无内联脚本，所有代码在独立.js文件
    - LLM API响应和CSV导入数据严格验证
    - 所有API调用强制HTTPS
    - LLM API密钥存储在chrome.storage.local(Chrome自动加密)
  - **阶段0评估**: ✅ 研究确认chrome.storage.local安全性，无需额外加密
  - **阶段1评估**: ✅ contracts/llm-api.md明确HTTPS only，contracts/storage-api.md定义安全存储方案
  - **最终状态**: ✅ **完全符合**

- [x] **兼容性要求**: 是否支持Chrome 88+? 是否计划i18n支持?
  - **计划**: 
    - 目标Chrome 88+(Manifest V3最低版本)
    - 使用chrome.i18n实现中英双语支持
  - **阶段0评估**: ✅ WXT框架支持Manifest V3，目标Chrome 88+
  - **阶段1评估**: ✅ data-model.md定义i18n消息结构(en/zh_CN)
  - **最终状态**: ✅ **完全符合**

**章程检查结果**: ✅ **全部通过** - 所有7项检查完全符合项目章程要求

## 项目结构

### 文档(此功能)

```
specs/001-youtube-subtitle-enhancer/
├── plan.md              # 此文件
├── research.md          # 阶段 0 输出 - 技术选型研究
├── data-model.md        # 阶段 1 输出 - 数据模型设计
├── quickstart.md        # 阶段 1 输出 - 快速开始指南
├── contracts/           # 阶段 1 输出 - API合同
│   ├── storage-api.md   # chrome.storage数据结构
│   ├── message-api.md   # content script ↔ service worker消息协议
│   └── llm-api.md       # LLM API集成接口
└── tasks.md             # 阶段 2 输出 - 实施任务清单
```

### 源代码(仓库根目录)

```
# Chrome Extension 项目结构
LearnEnglishByWebVideo/
├── manifest.json                 # Manifest V3配置
├── src/
│   ├── background/              # Service Worker
│   │   ├── service-worker.js    # 主入口
│   │   ├── llm-service.js       # LLM API调用服务
│   │   ├── subtitle-processor.js # 字幕处理逻辑
│   │   ├── vocabulary-service.js # 词汇识别和管理
│   │   └── storage-manager.js    # 存储抽象层
│   ├── content/                 # Content Scripts
│   │   ├── youtube-injector.js  # YouTube页面注入入口
│   │   ├── subtitle-renderer.js # 字幕渲染引擎
│   │   ├── ui-overlay.js        # 交互式UI(小叉图标等)
│   │   └── content.css          # 字幕样式
│   ├── options/                 # Options Page (设置页面)
│   │   ├── options.html
│   │   ├── options.js
│   │   ├── components/
│   │   │   ├── vocabulary-manager.js  # 词汇表管理组件
│   │   │   ├── csv-handler.js         # CSV导入导出处理
│   │   │   └── settings-form.js       # 设置表单
│   │   └── options.css
│   ├── popup/                   # Popup (浏览器工具栏弹窗)
│   │   ├── popup.html
│   │   ├── popup.js             # 快速开关、状态显示
│   │   └── popup.css
│   ├── lib/                     # 共享库
│   │   ├── lemmatizer.js        # 词形还原封装
│   │   ├── word-difficulty.js   # 词汇难度评估
│   │   ├── message-bridge.js    # 消息传递抽象
│   │   └── utils.js             # 通用工具函数
│   └── assets/                  # 静态资源
│       ├── icons/               # 扩展图标(16x16, 48x48, 128x128)
│       ├── dictionaries/        # 词频词典数据(初级/中级/高级)
│       └── _locales/            # i18n消息文件
│           ├── en/
│           │   └── messages.json
│           └── zh_CN/
│               └── messages.json
├── tests/                       # 测试
│   ├── unit/
│   │   ├── vocabulary-service.test.js
│   │   ├── lemmatizer.test.js
│   │   ├── subtitle-processor.test.js
│   │   └── csv-handler.test.js
│   ├── integration/
│   │   ├── storage-integration.test.js
│   │   ├── message-passing.test.js
│   │   └── llm-integration.test.js
│   └── e2e/
│       └── youtube-workflow.test.js
├── scripts/                     # 构建和开发脚本
│   ├── build.js                 # 打包脚本
│   ├── watch.js                 # 开发热重载
│   └── test-coverage.js         # 覆盖率报告
├── package.json
├── tsconfig.json                # TypeScript配置(如使用TS)
├── .eslintrc.json               # ESLint配置
├── .prettierrc                  # Prettier配置
└── README.md
```

**结构决策**: 
- 采用标准Chrome Extension目录结构，遵循Manifest V3规范
- 明确分离background(Service Worker)、content scripts、options page、popup职责
- src/lib/作为共享代码层，避免重复
- tests/按类型分层(unit/integration/e2e)，确保60%覆盖率可追踪
- 使用src/assets/dictionaries/存储预设词频数据，减少运行时计算

## 复杂度跟踪

*仅在章程检查有必须证明的违规时填写*

| 违规 | 为什么需要 | 拒绝更简单替代方案的原因 |
|-----------|------------|-------------------------------------|
| 无 | - | - |

**评估结果**: 当前计划完全符合项目章程要求，无需复杂度证明。
