# Configuration Guide

本文档说明如何配置 YouTube Subtitle Enhancer 的 LLM API。

## 支持的 LLM 提供商

扩展支持三种 LLM 提供商：

1. **DeepSeek** (默认) - 性价比高，API 兼容 OpenAI 格式
2. **OpenAI** - GPT-4o-mini 模型
3. **Claude** - Claude-3.5-haiku 模型

## 配置方法

### 方法 1：环境变量（推荐用于开发）

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入您的 API Key：

```bash
# DeepSeek API Key (默认提供商)
# 获取地址: https://platform.deepseek.com/
OPENAI_API_KEY=sk-your_deepseek_api_key_here

# 可选：指定其他提供商
# LLM_PROVIDER=deepseek  # 可选: openai, claude
# LLM_MODEL=deepseek-chat
```

**注意**：DeepSeek 使用 `OPENAI_API_KEY` 环境变量（因为 API 格式兼容）。

3. 构建或运行扩展：
```bash
make dev    # 开发模式
# 或
make build  # 生产构建
```

环境变量会自动注入到扩展配置中。

### 方法 2：扩展设置页面（推荐用于最终用户）

1. 安装扩展后，点击扩展图标
2. 选择 "设置" 或 "Options"
3. 在设置页面：
   - 选择 LLM 提供商（DeepSeek / OpenAI / Claude）
   - 输入对应的 API Key
   - 选择模型（可选，使用默认即可）
4. 点击 "保存"

## 获取 API Key

### DeepSeek (推荐)

1. 访问 [DeepSeek 平台](https://platform.deepseek.com/)
2. 注册账号
3. 在 API Keys 页面创建新的 API Key
4. 复制 Key（格式：`sk-...`）

**优势**：
- 价格实惠（比 OpenAI 便宜约 90%）
- API 兼容 OpenAI 格式
- 中文支持良好

### OpenAI

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册账号并绑定支付方式
3. 在 API Keys 页面创建新的 API Key
4. 复制 Key（格式：`sk-...`）

**使用模型**：`gpt-4o-mini`

### Claude (Anthropic)

1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册账号并绑定支付方式
3. 在 API Keys 页面创建新的 API Key
4. 复制 Key（格式：`sk-ant-...`）

**使用模型**：`claude-3-5-haiku-20241022`

## 环境变量详解

### OPENAI_API_KEY

用于 DeepSeek 和 OpenAI 提供商的 API Key。

```bash
# DeepSeek
OPENAI_API_KEY=sk-70858861a9124612b6b304944ba9582c

# OpenAI
OPENAI_API_KEY=sk-proj-abcdefg...
```

### CLAUDE_API_KEY

用于 Claude 提供商的 API Key（仅当使用 Claude 时需要）。

```bash
CLAUDE_API_KEY=sk-ant-api03-...
```

### LLM_PROVIDER

指定默认使用的 LLM 提供商。

```bash
LLM_PROVIDER=deepseek  # 默认
# LLM_PROVIDER=openai
# LLM_PROVIDER=claude
```

### LLM_MODEL

指定使用的具体模型（可选）。

```bash
# DeepSeek
LLM_MODEL=deepseek-chat         # 默认

# OpenAI
LLM_MODEL=gpt-4o-mini          # 默认
# LLM_MODEL=gpt-4o
# LLM_MODEL=gpt-3.5-turbo

# Claude
LLM_MODEL=claude-3-5-haiku-20241022  # 默认
# LLM_MODEL=claude-3-5-sonnet-20241022
```

## 配置示例

### 示例 1：DeepSeek (默认配置)

```bash
# .env
OPENAI_API_KEY=sk-70858861a9124612b6b304944ba9582c
LLM_PROVIDER=deepseek
LLM_MODEL=deepseek-chat
```

### 示例 2：OpenAI

```bash
# .env
OPENAI_API_KEY=sk-proj-abcdefghijklmnop...
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
```

### 示例 3：Claude

```bash
# .env
CLAUDE_API_KEY=sk-ant-api03-xyz...
LLM_PROVIDER=claude
LLM_MODEL=claude-3-5-haiku-20241022
```

## 开发工作流

### 本地开发

```bash
# 1. 设置环境变量
cp .env.example .env
# 编辑 .env 填入 API Key

# 2. 启动开发服务器
make dev

# 3. 扩展会自动加载配置
```

### 切换 LLM 提供商

```bash
# 方法1：修改 .env
vim .env
# 修改 LLM_PROVIDER=openai

# 方法2：临时覆盖
LLM_PROVIDER=openai make dev

# 方法3：在扩展设置中切换（推荐）
```

## 配置文件

### src/config/env.ts (自动生成)

此文件由 `scripts/inject-env.cjs` 自动生成，**请勿手动编辑**。

```typescript
export const ENV_CONFIG = {
  LLM_PROVIDER: 'deepseek',
  LLM_API_KEY: 'sk-...',
  LLM_MODEL: 'deepseek-chat',
} as const;

export const HAS_API_KEY = true;
```

要更新配置：

```bash
# 自动（构建时）
make build

# 手动
npm run inject-env
```

## 安全注意事项

### ⚠️ API Key 安全

1. **永远不要**提交 `.env` 文件到 Git
2. **永远不要**提交 `src/config/env.ts` 到 Git
3. `.gitignore` 已配置忽略这些文件

### 检查 .gitignore

确保以下内容在 `.gitignore` 中：

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Generated config (contains API keys)
src/config/env.ts
```

### 团队协作

每个开发者应该：

1. 复制 `.env.example` 到 `.env`
2. 使用自己的 API Key
3. **不要**分享 `.env` 文件

## 故障排除

### 问题 1：扩展提示 "API key not configured"

**原因**：环境变量未设置或未正确注入。

**解决方案**：
```bash
# 检查 .env 文件是否存在
ls -la .env

# 手动运行注入脚本
npm run inject-env

# 检查生成的配置
cat src/config/env.ts

# 重新构建
make build
```

### 问题 2：翻译失败 "API error"

**原因**：API Key 无效或已过期。

**解决方案**：
1. 检查 API Key 是否正确
2. 登录提供商平台验证 Key 状态
3. 确认账户余额充足
4. 尝试重新生成 API Key

### 问题 3：DeepSeek API 调用失败

**原因**：可能是 API 端点或格式问题。

**解决方案**：
```bash
# 测试 API Key
curl https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 问题 4：环境变量不生效

**原因**：`.env` 文件未被读取或构建缓存。

**解决方案**：
```bash
# 清理并重新构建
make clean
make build

# 或强制重新注入
rm src/config/env.ts
npm run inject-env
make build
```

## 成本估算

### 翻译成本（每 1000 次翻译）

| 提供商 | 模型 | 输入成本 | 输出成本 | 每次翻译约 |
|--------|------|---------|---------|-----------|
| DeepSeek | deepseek-chat | $0.14/M | $0.28/M | ~$0.0004 |
| OpenAI | gpt-4o-mini | $0.15/M | $0.60/M | ~$0.001 |
| Claude | haiku-3.5 | $0.80/M | $4.00/M | ~$0.005 |

**估算**：观看 1 小时视频，约 100-200 个生词翻译
- DeepSeek: $0.04-0.08
- OpenAI: $0.10-0.20
- Claude: $0.50-1.00

## 高级配置

### 使用代理

如果需要通过代理访问 API：

```typescript
// 修改 src/background/llm-service.ts
const response = await fetch(this.baseUrl, {
  // ... 其他配置
  agent: new HttpsProxyAgent('http://proxy:port'),
});
```

### 自定义 API 端点

修改服务类的 `baseUrl`：

```typescript
// src/background/llm-service.ts
export class DeepSeekService implements LLMService {
  private baseUrl = 'https://your-proxy.com/v1/chat/completions';
  // ...
}
```

### 批处理大小调整

修改批处理大小以平衡性能和成本：

```typescript
// src/background/llm-service.ts
// 默认：每批 5 个词，批次间延迟 100ms
const batchSize = 10;  // 增加批处理大小
await new Promise(resolve => setTimeout(resolve, 200));  // 增加延迟
```

## 相关文档

- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [Claude API 文档](https://docs.anthropic.com/claude/reference)
- [Makefile 使用指南](./MAKEFILE_USAGE.md)
