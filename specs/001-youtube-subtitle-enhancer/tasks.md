# 实施任务: YouTube智能字幕增强器

**功能分支**: `001-youtube-subtitle-enhancer`  
**日期**: 2026-01-20  
**规范**: [spec.md](./spec.md) | **计划**: [plan.md](./plan.md)

## 概述

本文档将功能规范分解为按优先级排序的可执行任务。每个用户故事作为独立的增量实施，可以单独测试和交付。

**技术栈**: TypeScript + WXT Framework + Vite + Vitest + Playwright  
**目标平台**: Chrome 88+ (Manifest V3)  
**总任务数**: 58个任务  
**并行机会**: 24个可并行任务

---

## 实施策略

### MVP方法
- **MVP范围**: 用户故事1 (基础字幕增强显示)
- **增量交付**: 每个用户故事完成后可独立发布
- **测试策略**: 单元测试覆盖率60%+，核心逻辑80%+

### 依赖关系图

```
阶段1 (设置)
   ↓
阶段2 (基础设施)
   ↓
┌──────────────────────────────────────────────────┐
│  阶段3 (US1 - 基础字幕增强) - MVP               │
│  ├─ 字幕获取                                     │
│  ├─ 词汇识别                                     │
│  ├─ LLM翻译                                      │
│  └─ 字幕渲染                                     │
└──────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────┐
│  阶段4 (US2 - 英语水平与LLM配置)                │
│  ├─ Options页面UI                                │
│  ├─ API密钥管理                                  │
│  └─ 英语水平切换                                 │
└──────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────┐
│  阶段5 (US3 - 智能词汇管理)                     │
│  ├─ 词形还原                                     │
│  ├─ 词汇表CRUD                                   │
│  └─ CSV导入导出                                  │
└──────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────┐
│  阶段6 (US4 - 交互式熟词标记)                   │
│  ├─ 暂停检测                                     │
│  ├─ 交互UI (×图标)                              │
│  └─ 即时标记                                     │
└──────────────────────────────────────────────────┘
   ↓
阶段7 (完善与横切关注点)
```

---

## 阶段 1: 项目设置

**目标**: 初始化项目结构和开发环境

- [X] T001 使用WXT框架创建项目 `npm create wxt@latest youtube-subtitle-enhancer -- --template vanilla-ts`
- [X] T002 安装核心依赖 `wink-lemmatizer`, `papaparse`, `@types/papaparse`, `@types/chrome`
- [X] T003 安装开发依赖 `vitest`, `@vitest/ui`, `vitest-chrome`, `@playwright/test`, `eslint`, `prettier`, `@typescript-eslint/eslint-plugin`
- [X] T004 [P] 配置TypeScript `tsconfig.json` (target: ES2020, types: chrome, strict mode)
- [X] T005 [P] 配置Vitest `vitest.config.ts` (60%覆盖率阈值, jsdom环境)
- [X] T006 [P] 配置Playwright `playwright.config.ts` (Chrome extension测试)
- [X] T007 [P] 配置ESLint `.eslintrc.json` (TypeScript规则)
- [X] T008 [P] 配置Prettier `.prettierrc` (代码格式化)
- [X] T009 创建项目目录结构 `src/{background,content,options,popup,lib,assets}`
- [X] T010 配置WXT `wxt.config.ts` (manifest基础配置, permissions, host_permissions)
- [X] T011 [P] 创建测试目录结构 `tests/{unit,integration,e2e}`
- [X] T012 [P] 创建测试setup文件 `tests/setup.ts` (mock Chrome APIs)

**检查点**: 运行`npm run dev`成功启动开发服务器，Chrome自动打开并加载扩展

---

## 阶段 2: 基础设施层

**目标**: 实现所有用户故事共享的基础组件

### 数据模型与存储

- [X] T013 [P] 定义TypeScript类型 `src/types/index.ts` (UserProfile, SubtitleSegment, WordEntry, VideoSession, TranslationCacheEntry)
- [X] T014 [P] 实现存储管理器 `src/lib/storage-manager.ts` (getUserProfile, updateUserProfile, cacheVideoSession, getTranslationCache)
- [X] T015 [P] 实现存储管理器单元测试 `tests/unit/storage-manager.test.ts` (测试CRUD操作、缓存过期、配额检查)

### 词频词典

- [X] T016 [P] 准备COCA词频数据 `src/assets/dictionaries/beginner-words.ts` (3000词)
- [X] T017 [P] 准备中级词频数据 `src/assets/dictionaries/intermediate-words.ts` (6000词)
- [X] T018 [P] 准备高级词频数据 `src/assets/dictionaries/advanced-words.ts` (10000词)
- [X] T019 实现词汇难度服务 `src/lib/word-difficulty.ts` (isUnknownWord, getDifficultyLevel)
- [X] T020 [P] 实现词汇难度服务测试 `tests/unit/word-difficulty.test.ts`

### 消息传递

- [X] T021 [P] 实现消息桥接工具 `src/lib/message-bridge.ts` (sendToBackground, sendToContent, type-safe消息)
- [X] T022 [P] 实现消息桥接测试 `tests/unit/message-bridge.test.ts`

### 国际化

- [X] T023 [P] 创建英文i18n消息 `src/assets/_locales/en/messages.json`
- [X] T024 [P] 创建中文i18n消息 `src/assets/_locales/zh_CN/messages.json`

**检查点**: 运行`npm run test`，所有基础组件测试通过，覆盖率>60%

---

## 阶段 3: 用户故事 1 - 基础字幕增强显示 (P1) 🎯 MVP

**目标**: 实现核心功能 - 自动下载YouTube字幕并显示带中文解释的增强字幕

**独立测试标准**: 
✅ 用户安装插件，打开YouTube视频，看到生词旁边显示中文解释  
✅ 字幕随视频播放实时更新，翻译准确且简洁(<25字)  
✅ 无英文字幕的视频显示友好提示

### Service Worker - 字幕处理

- [X] T025 [US1] 实现Service Worker入口 `src/background/service-worker.ts` (onInstalled, onMessage监听器, 初始化默认配置)
- [X] T026 [P] [US1] 实现字幕下载服务 `src/background/subtitle-fetcher.ts` (extractCaptionTracks, downloadSubtitle, parseJSON3Format)
- [X] T027 [P] [US1] 实现字幕下载服务测试 `tests/unit/subtitle-fetcher.test.ts`
- [X] T028 [P] [US1] 实现字幕处理器 `src/background/subtitle-processor.ts` (processSubtitle, identifyUnknownWords, buildEnhancedHTML)
- [X] T029 [P] [US1] 实现字幕处理器测试 `tests/unit/subtitle-processor.test.ts`

### Service Worker - LLM集成

- [X] T030 [P] [US1] 实现OpenAI服务 `src/background/llm-service.ts` (OpenAIService类, getContextualExplanation, getContextualExplanationsBatch, 缓存逻辑)
- [X] T031 [P] [US1] 实现Claude服务 `src/background/llm-service.ts` (ClaudeService类, getContextualExplanation)
- [X] T032 [P] [US1] 实现LLM服务测试 `tests/unit/llm-service.test.ts` (mock fetch, 测试重试逻辑、错误处理、缓存命中)
- [X] T033 [US1] 集成LLM服务到字幕处理器 `src/background/subtitle-processor.ts` (调用translateWords, 批量翻译优化)

### Content Script - YouTube集成

- [X] T034 [US1] 实现Content Script入口 `src/content/youtube-injector.ts` (detectYouTubePlayer, extractVideoId, extractCaptionTrack, 发送消息到Service Worker)
- [X] T035 [P] [US1] 实现字幕渲染器 `src/content/subtitle-renderer.ts` (createSubtitleOverlay, renderEnhancedSubtitle, syncWithVideo)
- [X] T036 [P] [US1] 实现字幕样式 `src/content/content.css` (overlay定位, 字幕字体、颜色、背景)
- [X] T037 [US1] 集成字幕渲染到YouTube页面 `src/content/youtube-injector.ts` (监听视频时间更新, 切换字幕片段)

### 集成测试

- [ ] T038 [US1] 实现Service Worker集成测试 `tests/integration/background-integration.test.ts` (字幕下载→LLM翻译→缓存流程)
- [ ] T039 [US1] 实现E2E测试 `tests/e2e/youtube-workflow.test.ts` (加载扩展→打开YouTube→验证增强字幕显示)

**检查点 US1**: 
- ✅ E2E测试通过 - 在真实YouTube视频上看到增强字幕
- ✅ 单元测试覆盖率: 字幕处理器80%+, LLM服务80%+
- ✅ 无API密钥时显示友好错误提示
- ✅ **可作为MVP发布**

---

## 阶段 4: 用户故事 2 - 英语水平与LLM配置 (P2)

**目标**: 提供用户配置界面，支持LLM API设置和英语水平选择

**独立测试标准**:
✅ 用户可以在Options页面配置API密钥和选择英语水平  
✅ 切换英语水平后，字幕标注单词数量明显变化  
✅ API密钥验证失败时显示清晰错误

### Options Page - UI实现

- [X] T040 [US2] 创建Options页面HTML `entrypoints/options/index.html` (LLM配置表单, 英语水平单选按钮, 保存按钮)
- [X] T041 [P] [US2] 创建Options页面样式 `entrypoints/options/style.css` (现代化UI设计, 响应式布局)
- [X] T042 [P] [US2] 实现设置表单组件 `entrypoints/options/main.ts` (表单验证, API密钥脱敏显示, 保存/加载配置)
- [X] T043 [US2] 实现Options页面逻辑 `entrypoints/options/main.ts` (读取UserProfile, 保存配置, 通知Content Script刷新)

### API密钥验证

- [X] T044 [P] [US2] 实现API密钥验证 `src/background/llm-service.ts` (validateApiKey方法, 测试调用)
- [X] T045 [P] [US2] 实现API密钥验证测试 `tests/unit/llm-service.test.ts` (测试有效/无效密钥)

### 英语水平切换

- [X] T046 [US2] 实现英语水平切换逻辑 `src/background/vocabulary-service.ts` (VocabularyService类, identifyUnknownWords基于用户水平)
- [X] T047 [P] [US2] 实现词汇服务测试 `tests/unit/vocabulary-service.test.ts` (测试不同水平的单词识别)
- [X] T048 [US2] 实现配置变更广播 `entrypoints/background/index.ts` (监听storage变更, 广播USER_PROFILE_RESPONSE消息)
- [X] T049 [US2] 实现Content Script配置更新 `entrypoints/content.ts` (监听配置变更, 调用updateUserProfile重新渲染字幕)

### 集成测试

- [X] T050 [US2] 实现Options页面E2E测试 `tests/e2e/options-workflow.test.ts` (打开Options→配置API→切换水平→验证字幕变化)

**检查点 US2**:
- ✅ Options页面功能完整，UI友好
- ✅ 切换英语水平立即生效
- ✅ 无效API密钥有清晰错误提示

---

## 阶段 5: 用户故事 3 - 智能词汇管理 (P3)

**目标**: 支持词形还原、词汇表CRUD、CSV导入导出

**独立测试标准**:
✅ 添加"run"到熟词表后，"runs/running/ran"都不显示翻译  
✅ CSV导出成功，Excel可正常打开  
✅ CSV导入验证格式，错误时不修改现有数据

### 词形还原

- [X] T051 [P] [US3] 实现词形还原服务 `src/lib/lemmatizer.ts` (Lemmatizer类, lemmatize, lemmatizeAuto, isSameLemma, 集成wink-lemmatizer)
- [X] T052 [P] [US3] 实现词形还原测试 `tests/unit/lemmatizer.test.ts` (测试规则/不规则动词, 名词复数, 形容词比较级)
- [X] T053 [US3] 集成词形还原到词汇服务 `src/background/vocabulary-service.ts` (检查单词时比较lemma)

### 词汇表管理UI

- [ ] T054 [US3] 实现词汇管理器组件 `src/options/components/vocabulary-manager.ts` (显示已掌握/重点关注词汇, 添加/删除/搜索功能)
- [ ] T055 [P] [US3] 实现词汇管理器样式 `src/options/options.css` (列表样式, 搜索框, 操作按钮)
- [ ] T056 [US3] 集成词汇管理器到Options页面 `src/options/options.html` 和 `src/options/options.ts`

### CSV导入导出

- [ ] T057 [P] [US3] 实现CSV处理器 `src/options/components/csv-handler.ts` (CSVHandler类, exportVocabulary, importVocabulary, validateAndTransform, 集成PapaParse)
- [ ] T058 [P] [US3] 实现CSV处理器测试 `tests/unit/csv-handler.test.ts` (测试导出格式, 导入验证, UTF-8编码)
- [ ] T059 [US3] 实现导出功能 `src/options/options.ts` (导出按钮点击→生成CSV→触发下载)
- [ ] T060 [US3] 实现导入功能 `src/options/options.ts` (文件选择→解析CSV→显示确认对话框→覆盖存储)

### 集成测试

- [ ] T061 [US3] 实现词汇管理E2E测试 `tests/e2e/vocabulary-management.test.ts` (添加词汇→验证字幕变化→导出CSV→导入CSV)

**检查点 US3**:
- ✅ 词形还原准确率95%+
- ✅ CSV导入导出功能完整，UTF-8编码正确
- ✅ 词汇管理UI直观易用

---

## 阶段 6: 用户故事 4 - 交互式熟词标记 (P4)

**目标**: 支持视频暂停时点击×图标标记熟词

**独立测试标准**:
✅ 暂停视频时，生词右上角显示×图标  
✅ 点击×后，该词翻译立即消失，恢复播放后不再显示  
✅ 标记的词出现在Options页面的已掌握词汇列表

### 暂停检测与UI

- [ ] T062 [US4] 实现暂停检测 `src/content/youtube-injector.ts` (监听video.pause事件)
- [ ] T063 [P] [US4] 实现交互UI覆盖层 `src/content/ui-overlay.ts` (showMarkButtons, hideMarkButtons, 在生词右上角渲染×图标)
- [ ] T064 [P] [US4] 实现交互UI样式 `src/content/content.css` (×图标样式, hover效果, 点击动画)
- [ ] T065 [US4] 集成暂停检测到字幕渲染 `src/content/subtitle-renderer.ts` (暂停时调用showMarkButtons)

### 标记逻辑

- [ ] T066 [US4] 实现标记处理 `src/content/ui-overlay.ts` (×图标点击→发送ADD_MASTERED_WORD消息→移除当前字幕翻译)
- [ ] T067 [US4] 实现Service Worker标记处理 `src/background/service-worker.ts` (处理ADD_MASTERED_WORD消息, 更新UserProfile, 响应结果)
- [ ] T068 [US4] 实现即时字幕更新 `src/content/subtitle-renderer.ts` (接收标记成功响应, 重新渲染当前字幕片段)

### 集成测试

- [ ] T069 [US4] 实现交互式标记E2E测试 `tests/e2e/interactive-marking.test.ts` (打开视频→暂停→点击×→验证翻译消失→恢复播放→验证后续字幕)

**检查点 US4**:
- ✅ 交互流畅，响应时间<500ms
- ✅ 标记持久化，重新打开视频时生效
- ✅ E2E测试通过

---

## 阶段 7: 完善与横切关注点

**目标**: 性能优化、错误处理、用户体验提升

### Popup快速访问

- [ ] T070 [P] 创建Popup页面 `src/popup/popup.html` (扩展开关, 当前视频统计, 快速跳转设置)
- [ ] T071 [P] 创建Popup样式 `src/popup/popup.css`
- [ ] T072 实现Popup逻辑 `src/popup/popup.ts` (读取扩展状态, 切换开关, 显示统计数据)

### 性能优化

- [ ] T073 实现缓存清理 `src/background/service-worker.ts` (定期清理过期缓存, onStartup事件)
- [ ] T074 实现存储配额监控 `src/lib/storage-manager.ts` (checkStorageQuota, cleanupOldestCaches)
- [ ] T075 实现LLM速率限制 `src/background/llm-service.ts` (RateLimiter类, 请求队列)

### 错误处理与通知

- [ ] T076 [P] 实现错误提示UI `src/content/notification.ts` (showNotification, 错误/警告/成功类型)
- [ ] T077 [P] 实现错误提示样式 `src/content/content.css` (notification toast样式)
- [ ] T078 实现边界情况处理 `src/content/youtube-injector.ts` (无字幕提示, 自动生成字幕警告, 网络错误处理)

### 图标与资源

- [ ] T079 [P] 准备扩展图标 `src/assets/icons/` (icon-16.png, icon-48.png, icon-128.png)
- [ ] T080 更新manifest图标引用 `wxt.config.ts` (icons配置)

### 文档与发布

- [ ] T081 [P] 编写README.md (功能介绍, 安装说明, 使用指南, API配置教程)
- [ ] T082 [P] 编写CHANGELOG.md (版本历史, 功能变更)
- [ ] T083 准备Chrome Web Store资源 (截图, 宣传图, 详细描述)
- [ ] T084 运行最终测试套件 `npm run test && npm run test:e2e` (确保100%测试通过)
- [ ] T085 检查测试覆盖率 `npm run test:coverage` (确保≥60%, 核心逻辑≥80%)
- [ ] T086 构建生产版本 `npm run build`
- [ ] T087 打包发布 `npm run zip`

**检查点 Final**:
- ✅ 所有测试通过，覆盖率达标
- ✅ 性能指标符合要求 (<3s字幕处理, <200ms同步延迟)
- ✅ 发布包准备完成

---

## 并行执行示例

### 阶段3 (US1) 并行任务

可以同时执行的任务组:

**组1: Service Worker组件**
```bash
# 开发者A
- T026 字幕下载服务
- T027 字幕下载测试
```

**组2: LLM服务**
```bash
# 开发者B
- T030 OpenAI服务
- T031 Claude服务
- T032 LLM服务测试
```

**组3: Content Script**
```bash
# 开发者C
- T035 字幕渲染器
- T036 字幕样式
```

### 阶段4 (US2) 并行任务

**组1: UI开发**
```bash
- T041 Options页面样式
- T042 设置表单组件
```

**组2: 后端逻辑**
```bash
- T044 API密钥验证
- T046 词汇服务
- T047 词汇服务测试
```

---

## 任务统计

| 阶段 | 任务数 | 并行任务 | 用户故事 | 完成标准 |
|------|--------|----------|----------|----------|
| 阶段1 设置 | 12 | 7 | - | 开发环境就绪 |
| 阶段2 基础设施 | 12 | 10 | - | 基础测试通过 |
| 阶段3 US1 (MVP) | 15 | 7 | P1 | E2E测试通过，可发布 |
| 阶段4 US2 | 11 | 4 | P2 | Options页面功能完整 |
| 阶段5 US3 | 11 | 5 | P3 | CSV导入导出工作 |
| 阶段6 US4 | 8 | 3 | P4 | 交互式标记流畅 |
| 阶段7 完善 | 18 | 6 | - | 发布就绪 |
| **总计** | **87** | **42** | **4个故事** | **完整产品** |

---

## MVP发布检查清单

完成以下任务即可发布MVP (用户故事1):

- [x] T001-T012: 项目设置
- [x] T013-T024: 基础设施
- [x] T025-T039: 用户故事1完整实现
- [ ] 测试覆盖率 ≥ 60% (核心逻辑 ≥ 80%)
- [ ] 在真实YouTube视频上手动测试
- [ ] Chrome Web Store提交材料准备

**MVP预计工时**: 3-5天 (单人开发)

---

## 下一步行动

执行实施命令:
```bash
/speckit.implement
```

这将自动执行所有任务，或者您可以手动按顺序实施每个任务。

---

**文档版本**: 1.0.0  
**最后更新**: 2026-01-20  
**准备实施**: ✅
