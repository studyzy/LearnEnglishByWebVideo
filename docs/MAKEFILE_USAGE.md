# Makefile 使用指南

本项目使用 Makefile 来简化常用的开发、测试、构建和发布操作。

## 快速开始

### 查看所有可用命令

```bash
make help
```

### 首次设置项目

```bash
make setup
# 这将自动安装依赖并进行首次构建
```

## 常用命令

### 开发相关

| 命令 | 说明 | 示例 |
|------|------|------|
| `make dev` | 启动开发服务器（热重载） | `make dev` |
| `make dev-chrome` | 启动开发服务器并打开Chrome | `make dev-chrome` |
| `make dev-firefox` | 启动开发服务器（Firefox） | `make dev-firefox` |
| `make start` | 启动开发服务器（dev的别名） | `make start` |

**开发工作流：**
```bash
# 1. 启动开发服务器
make dev

# 2. 代码会自动热重载
# 3. 在浏览器中测试扩展
```

### 构建相关

| 命令 | 说明 | 输出目录 |
|------|------|---------|
| `make build` | 构建Chrome生产版本 | `.output/chrome-mv3/` |
| `make build-firefox` | 构建Firefox版本 | `.output/firefox-mv2/` |
| `make watch` | 监听文件变化自动构建 | `.output/chrome-mv3/` |
| `make b` | 构建（build的别名） | `.output/chrome-mv3/` |

**构建工作流：**
```bash
# 1. 清理旧构建
make clean

# 2. 构建新版本
make build

# 3. 查看构建产物
make size
```

### 测试相关

| 命令 | 说明 |
|------|------|
| `make test` | 运行所有单元测试 |
| `make test-watch` | 测试监听模式（代码变化自动运行） |
| `make test-ui` | 打开测试UI界面 |
| `make test-coverage` | 生成测试覆盖率报告 |
| `make test-e2e` | 运行E2E测试 |
| `make test-all` | 运行所有测试（单元+E2E+覆盖率） |
| `make t` | 测试（test的别名） |

**测试工作流：**
```bash
# 开发时：使用监听模式
make test-watch

# 提交前：运行完整测试
make test-all

# 查看覆盖率报告
make test-coverage
# 然后打开 coverage/index.html
```

### 代码质量

| 命令 | 说明 |
|------|------|
| `make lint` | 运行ESLint检查 |
| `make lint-fix` | 自动修复ESLint问题 |
| `make format` | 格式化代码（Prettier） |
| `make typecheck` | TypeScript类型检查 |
| `make check` | 运行所有检查（lint + typecheck） |

**代码质量工作流：**
```bash
# 提交代码前
make check          # 检查代码问题
make lint-fix       # 自动修复
make format         # 格式化代码
```

### 发布相关

| 命令 | 说明 | 输出 |
|------|------|------|
| `make zip` | 打包Chrome扩展为ZIP | `dist/youtube-subtitle-enhancer-v0.1.0.zip` |
| `make zip-firefox` | 打包Firefox扩展 | `dist/youtube-subtitle-enhancer-firefox-v0.1.0.zip` |
| `make release` | 完整发布流程 | 包含检查、测试、打包 |

**发布工作流：**
```bash
# 方式1：一键发布（推荐）
make release
# 这会自动执行：
# - 清理旧文件
# - 代码检查
# - 运行所有测试
# - 构建生产版本
# - 打包ZIP文件

# 方式2：手动步骤
make clean          # 1. 清理
make check          # 2. 代码检查
make test-all       # 3. 测试
make build          # 4. 构建
make zip            # 5. 打包
```

### 清理相关

| 命令 | 说明 |
|------|------|
| `make clean` | 清理构建产物 |
| `make clean-all` | 清理所有文件（包括依赖） |
| `make c` | 清理（clean的别名） |

**清理说明：**
```bash
# 清理构建产物（保留node_modules）
make clean

# 完全清理（重新开始）
make clean-all
make install
```

### 工具命令

| 命令 | 说明 |
|------|------|
| `make info` | 显示项目信息 |
| `make size` | 显示构建产物大小 |
| `make version` | 显示当前版本号 |
| `make load-chrome` | 显示Chrome加载扩展的说明 |
| `make deps-check` | 检查过期依赖 |
| `make deps-update` | 更新所有依赖 |

### 版本管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `make bump-patch` | 升级补丁版本（0.1.0 → 0.1.1） | Bug修复 |
| `make bump-minor` | 升级次版本（0.1.0 → 0.2.0） | 新功能 |
| `make bump-major` | 升级主版本（0.1.0 → 1.0.0） | 破坏性更新 |

**版本升级工作流：**
```bash
# 1. 确认当前版本
make version

# 2. 升级版本（根据语义化版本选择）
make bump-minor     # 新增功能

# 3. 发布新版本
make release

# 4. 提交版本变更
git add package.json
git commit -m "chore: bump version to v0.2.0"
git tag v0.2.0
git push && git push --tags
```

### CI/CD 相关

| 命令 | 说明 | 适用场景 |
|------|------|---------|
| `make ci` | CI完整流程 | GitHub Actions |
| `make ci-test` | CI测试（带覆盖率） | 测试报告生成 |

**.github/workflows/ci.yml 示例：**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: make ci
```

## 完整工作流示例

### 日常开发

```bash
# 1. 启动开发服务器
make dev

# 2. 修改代码...

# 3. 运行测试（另一个终端）
make test-watch

# 4. 提交前检查
make check
make lint-fix
```

### 新功能开发

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发功能
make dev

# 3. 编写测试
make test-watch

# 4. 提交前完整测试
make test-all

# 5. 代码检查和格式化
make check
make lint-fix
make format

# 6. 本地构建验证
make build
make load-chrome

# 7. 提交代码
git add .
git commit -m "feat: add new feature"
```

### 发布新版本

```bash
# 1. 确认所有测试通过
make test-all

# 2. 升级版本号
make bump-minor

# 3. 完整发布流程
make release

# 4. 查看生成的发布包
ls -lh dist/

# 5. 上传到Chrome Web Store
# 使用 dist/youtube-subtitle-enhancer-v0.2.0.zip

# 6. 提交版本变更
git add .
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push && git push --tags
```

### 修复线上Bug

```bash
# 1. 创建修复分支
git checkout -b hotfix/fix-bug

# 2. 修复Bug并测试
make dev
make test

# 3. 升级补丁版本
make bump-patch

# 4. 快速发布
make release

# 5. 部署修复
# 上传到Chrome Web Store
```

## 常见问题

### Q: 构建失败怎么办？

```bash
# 1. 清理构建缓存
make clean

# 2. 重新构建
make build

# 3. 如果还是失败，清理所有依赖
make clean-all
make install
make build
```

### Q: 测试失败怎么办？

```bash
# 1. 查看详细测试输出
make test

# 2. 使用UI界面调试
make test-ui

# 3. 检查覆盖率
make test-coverage
```

### Q: 如何在Chrome中加载开发版本？

```bash
# 1. 构建扩展
make build

# 2. 查看加载说明
make load-chrome

# 3. 按照说明在Chrome中加载
# chrome://extensions/ -> 开发者模式 -> 加载已解压的扩展程序
```

### Q: 如何验证发布包？

```bash
# 1. 打包
make zip

# 2. 解压验证
cd /tmp
unzip ~/path/to/dist/youtube-subtitle-enhancer-v0.1.0.zip -d test-extension
cd test-extension
ls -la

# 3. 在Chrome中加载测试
```

## 性能优化建议

### 加快构建速度

```bash
# 使用监听模式避免重复完整构建
make watch

# 开发时使用dev模式（更快的热重载）
make dev
```

### 加快测试速度

```bash
# 只运行相关测试
make test-watch

# 跳过E2E测试（开发时）
make test
```

## 进阶用法

### 并行执行多个命令

```bash
# 在不同终端运行
make dev          # 终端1：开发服务器
make test-watch   # 终端2：测试监听
```

### 自定义环境变量

```bash
# 使用环境变量
NODE_ENV=production make build

# 设置Chrome路径
CHROME_PATH=/path/to/chrome make dev-chrome
```

### 集成到IDE

**VSCode tasks.json：**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Dev Server",
      "type": "shell",
      "command": "make dev",
      "problemMatcher": []
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "make test",
      "problemMatcher": []
    },
    {
      "label": "Build",
      "type": "shell",
      "command": "make build",
      "problemMatcher": []
    }
  ]
}
```

## 总结

Makefile 提供了以下主要功能分类：

- **开发**: `dev`, `start`, `watch`
- **构建**: `build`, `build-firefox`
- **测试**: `test`, `test-watch`, `test-coverage`, `test-all`
- **质量**: `lint`, `format`, `typecheck`, `check`
- **发布**: `zip`, `release`
- **清理**: `clean`, `clean-all`
- **工具**: `info`, `size`, `version`
- **CI/CD**: `ci`, `ci-test`

最常用的命令：
```bash
make dev          # 日常开发
make test-watch   # 测试驱动开发
make check        # 提交前检查
make release      # 发布新版本
```

更多帮助：
```bash
make help         # 查看所有命令
```
