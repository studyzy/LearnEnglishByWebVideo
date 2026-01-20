# YouTube Subtitle Enhancer - Makefile
# 快速构建、测试、发布工具

# 变量定义
SHELL := /bin/bash
PROJECT_NAME := youtube-subtitle-enhancer
VERSION := $(shell node -p "require('./package.json').version")
BUILD_DIR := .output/chrome-mv3
ZIP_NAME := $(PROJECT_NAME)-v$(VERSION).zip
DIST_DIR := dist

# 颜色输出
COLOR_RESET := \033[0m
COLOR_BOLD := \033[1m
COLOR_GREEN := \033[32m
COLOR_YELLOW := \033[33m
COLOR_BLUE := \033[34m

# 默认目标
.DEFAULT_GOAL := help

# ============================================================================
# 帮助信息
# ============================================================================

.PHONY: help
help: ## 显示帮助信息
	@echo "$(COLOR_BOLD)$(PROJECT_NAME) - 构建工具$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_BOLD)可用命令:$(COLOR_RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(COLOR_BLUE)%-20s$(COLOR_RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(COLOR_BOLD)示例:$(COLOR_RESET)"
	@echo "  make dev          # 启动开发服务器"
	@echo "  make build        # 构建生产版本"
	@echo "  make test         # 运行所有测试"
	@echo "  make zip          # 打包发布版本"

# ============================================================================
# 开发环境
# ============================================================================

.PHONY: install
install: ## 安装依赖
	@echo "$(COLOR_GREEN)正在安装依赖...$(COLOR_RESET)"
	pnpm install
	@echo "$(COLOR_GREEN)✓ 依赖安装完成$(COLOR_RESET)"

.PHONY: dev
dev: sync-locales ## 启动开发服务器 (热重载)
	@echo "$(COLOR_GREEN)正在启动开发服务器...$(COLOR_RESET)"
	pnpm run dev

.PHONY: dev-chrome
dev-chrome: ## 启动开发服务器并打开Chrome
	@echo "$(COLOR_GREEN)正在启动开发服务器 (Chrome)...$(COLOR_RESET)"
	pnpm run dev --browser chrome

.PHONY: dev-firefox
dev-firefox: ## 启动开发服务器 (Firefox)
	@echo "$(COLOR_GREEN)正在启动开发服务器 (Firefox)...$(COLOR_RESET)"
	pnpm run dev --browser firefox

# ============================================================================
# 构建
# ============================================================================

.PHONY: build
build: clean sync-locales ## 构建生产版本
	@echo "$(COLOR_GREEN)正在构建生产版本...$(COLOR_RESET)"
	pnpm run build
	@echo "$(COLOR_GREEN)✓ 构建完成: $(BUILD_DIR)$(COLOR_RESET)"
	@ls -lh $(BUILD_DIR)

.PHONY: build-firefox
build-firefox: clean ## 构建Firefox版本
	@echo "$(COLOR_GREEN)正在构建Firefox版本...$(COLOR_RESET)"
	pnpm run build --browser firefox
	@echo "$(COLOR_GREEN)✓ Firefox构建完成$(COLOR_RESET)"

.PHONY: watch
watch: ## 监听文件变化并自动构建
	@echo "$(COLOR_GREEN)正在启动监听模式...$(COLOR_RESET)"
	pnpm run build --watch

# ============================================================================
# 测试
# ============================================================================

.PHONY: test
test: ## 运行所有单元测试
	@echo "$(COLOR_GREEN)正在运行单元测试...$(COLOR_RESET)"
	pnpm run test

.PHONY: test-watch
test-watch: ## 监听模式运行测试
	@echo "$(COLOR_GREEN)正在启动测试监听模式...$(COLOR_RESET)"
	pnpm run test:watch

.PHONY: test-ui
test-ui: ## 打开测试UI界面
	@echo "$(COLOR_GREEN)正在打开测试UI...$(COLOR_RESET)"
	pnpm run test:ui

.PHONY: test-coverage
test-coverage: ## 运行测试并生成覆盖率报告
	@echo "$(COLOR_GREEN)正在生成测试覆盖率报告...$(COLOR_RESET)"
	pnpm run test:coverage
	@echo "$(COLOR_GREEN)✓ 覆盖率报告已生成: coverage/index.html$(COLOR_RESET)"

.PHONY: test-e2e
test-e2e: ## 运行E2E测试
	@echo "$(COLOR_GREEN)正在运行E2E测试...$(COLOR_RESET)"
	pnpm run test:e2e

.PHONY: test-all
test-all: test test-e2e test-coverage ## 运行所有测试（单元测试+E2E+覆盖率）
	@echo "$(COLOR_GREEN)✓ 所有测试完成$(COLOR_RESET)"

# ============================================================================
# 代码质量
# ============================================================================

.PHONY: lint
lint: ## 运行ESLint检查
	@echo "$(COLOR_GREEN)正在运行代码检查...$(COLOR_RESET)"
	pnpm run lint || true

.PHONY: lint-fix
lint-fix: ## 自动修复ESLint问题
	@echo "$(COLOR_GREEN)正在自动修复代码问题...$(COLOR_RESET)"
	pnpm run lint:fix || true

.PHONY: format
format: ## 格式化代码 (Prettier)
	@echo "$(COLOR_GREEN)正在格式化代码...$(COLOR_RESET)"
	pnpm run format || npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"

.PHONY: typecheck
typecheck: ## 运行TypeScript类型检查
	@echo "$(COLOR_GREEN)正在进行类型检查...$(COLOR_RESET)"
	pnpm run typecheck || npx tsc --noEmit

.PHONY: check
check: lint typecheck ## 运行所有代码检查（lint + typecheck）
	@echo "$(COLOR_GREEN)✓ 代码检查完成$(COLOR_RESET)"

# ============================================================================
# 发布准备
# ============================================================================

.PHONY: zip
zip: build ## 打包扩展为ZIP文件
	@echo "$(COLOR_GREEN)正在打包扩展...$(COLOR_RESET)"
	@mkdir -p $(DIST_DIR)
	@cd $(BUILD_DIR) && zip -r ../../$(DIST_DIR)/$(ZIP_NAME) . -x "*.map"
	@echo "$(COLOR_GREEN)✓ 打包完成: $(DIST_DIR)/$(ZIP_NAME)$(COLOR_RESET)"
	@ls -lh $(DIST_DIR)/$(ZIP_NAME)

.PHONY: zip-firefox
zip-firefox: build-firefox ## 打包Firefox扩展
	@echo "$(COLOR_GREEN)正在打包Firefox扩展...$(COLOR_RESET)"
	@mkdir -p $(DIST_DIR)
	@cd .output/firefox-mv2 && zip -r ../../$(DIST_DIR)/$(PROJECT_NAME)-firefox-v$(VERSION).zip . -x "*.map"
	@echo "$(COLOR_GREEN)✓ Firefox打包完成$(COLOR_RESET)"

.PHONY: release
release: clean check test-all zip ## 完整发布流程（检查+测试+打包）
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_GREEN)========================================$(COLOR_RESET)"
	@echo "$(COLOR_BOLD)$(COLOR_GREEN)  发布准备完成！$(COLOR_RESET)"
	@echo "$(COLOR_BOLD)$(COLOR_GREEN)========================================$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_BOLD)版本信息:$(COLOR_RESET)"
	@echo "  版本号: v$(VERSION)"
	@echo "  发布包: $(DIST_DIR)/$(ZIP_NAME)"
	@echo ""
	@echo "$(COLOR_BOLD)下一步:$(COLOR_RESET)"
	@echo "  1. 在Chrome Web Store上传 $(DIST_DIR)/$(ZIP_NAME)"
	@echo "  2. 填写版本更新说明"
	@echo "  3. 提交审核"
	@echo ""

# ============================================================================
# 清理
# ============================================================================

.PHONY: clean
clean: ## 清理构建产物
	@echo "$(COLOR_YELLOW)正在清理构建产物...$(COLOR_RESET)"
	@rm -rf .output
	@rm -rf $(DIST_DIR)
	@rm -rf coverage
	@echo "$(COLOR_GREEN)✓ 清理完成$(COLOR_RESET)"

.PHONY: clean-all
clean-all: clean ## 清理所有文件（包括依赖）
	@echo "$(COLOR_YELLOW)正在清理所有文件...$(COLOR_RESET)"
	@rm -rf node_modules
	@rm -rf .wxt
	@rm -rf pnpm-lock.yaml
	@echo "$(COLOR_GREEN)✓ 完全清理完成$(COLOR_RESET)"

# ============================================================================
# 工具命令
# ============================================================================

.PHONY: sync-locales
sync-locales: ## 同步国际化文件到public目录
	@echo "$(COLOR_GREEN)正在同步 _locales...$(COLOR_RESET)"
	@./scripts/sync-locales.sh

.PHONY: info
info: ## 显示项目信息
	@echo "$(COLOR_BOLD)项目信息:$(COLOR_RESET)"
	@echo "  名称: $(PROJECT_NAME)"
	@echo "  版本: v$(VERSION)"
	@echo "  Node: $$(node --version)"
	@echo "  pnpm: $$(pnpm --version)"
	@echo ""
	@echo "$(COLOR_BOLD)构建目录:$(COLOR_RESET)"
	@echo "  Chrome: $(BUILD_DIR)"
	@echo "  发布包: $(DIST_DIR)"
	@echo ""
	@if [ -d "$(BUILD_DIR)" ]; then \
		echo "$(COLOR_BOLD)构建状态:$(COLOR_RESET)"; \
		echo "  状态: $(COLOR_GREEN)已构建$(COLOR_RESET)"; \
		echo "  大小: $$(du -sh $(BUILD_DIR) | cut -f1)"; \
	else \
		echo "$(COLOR_BOLD)构建状态:$(COLOR_RESET)"; \
		echo "  状态: $(COLOR_YELLOW)未构建$(COLOR_RESET)"; \
	fi

.PHONY: size
size: ## 显示构建产物大小
	@echo "$(COLOR_BOLD)构建产物大小:$(COLOR_RESET)"
	@if [ -d "$(BUILD_DIR)" ]; then \
		du -sh $(BUILD_DIR)/*; \
		echo ""; \
		echo "$(COLOR_BOLD)总大小:$(COLOR_RESET) $$(du -sh $(BUILD_DIR) | cut -f1)"; \
	else \
		echo "$(COLOR_YELLOW)尚未构建，请先运行 'make build'$(COLOR_RESET)"; \
	fi

.PHONY: deps-update
deps-update: ## 更新所有依赖到最新版本
	@echo "$(COLOR_GREEN)正在更新依赖...$(COLOR_RESET)"
	pnpm update
	@echo "$(COLOR_GREEN)✓ 依赖更新完成$(COLOR_RESET)"

.PHONY: deps-check
deps-check: ## 检查过期依赖
	@echo "$(COLOR_GREEN)正在检查过期依赖...$(COLOR_RESET)"
	pnpm outdated

# ============================================================================
# 快捷命令
# ============================================================================

.PHONY: start
start: dev ## 启动开发服务器 (dev的别名)

.PHONY: b
b: build ## 构建 (build的别名)

.PHONY: t
t: test ## 测试 (test的别名)

.PHONY: c
c: clean ## 清理 (clean的别名)

# ============================================================================
# 持续集成
# ============================================================================

.PHONY: ci
ci: install check test build ## CI流程（安装+检查+测试+构建）
	@echo "$(COLOR_GREEN)✓ CI流程完成$(COLOR_RESET)"

.PHONY: ci-test
ci-test: install test-coverage ## CI测试（带覆盖率）
	@echo "$(COLOR_GREEN)✓ CI测试完成$(COLOR_RESET)"

# ============================================================================
# 开发辅助
# ============================================================================

.PHONY: setup
setup: install build ## 初始化项目（安装依赖+首次构建）
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_GREEN)========================================$(COLOR_RESET)"
	@echo "$(COLOR_BOLD)$(COLOR_GREEN)  项目初始化完成！$(COLOR_RESET)"
	@echo "$(COLOR_BOLD)$(COLOR_GREEN)========================================$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_BOLD)开始开发:$(COLOR_RESET)"
	@echo "  make dev          # 启动开发服务器"
	@echo "  make test-watch   # 运行测试（监听模式）"
	@echo ""
	@echo "$(COLOR_BOLD)常用命令:$(COLOR_RESET)"
	@echo "  make help         # 查看所有命令"
	@echo ""

.PHONY: load-chrome
load-chrome: build ## 构建并显示Chrome加载说明
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_GREEN)构建完成！请按以下步骤加载扩展:$(COLOR_RESET)"
	@echo ""
	@echo "  1. 打开 Chrome 浏览器"
	@echo "  2. 访问 chrome://extensions/"
	@echo "  3. 启用右上角的「开发者模式」"
	@echo "  4. 点击「加载已解压的扩展程序」"
	@echo "  5. 选择目录: $$(pwd)/$(BUILD_DIR)"
	@echo ""
	@echo "$(COLOR_BOLD)扩展位置:$(COLOR_RESET) $(BUILD_DIR)"
	@echo ""

# ============================================================================
# 特殊目标
# ============================================================================

.PHONY: version
version: ## 显示版本号
	@echo "v$(VERSION)"

.PHONY: bump-patch
bump-patch: ## 升级补丁版本号 (x.x.1)
	@echo "$(COLOR_GREEN)正在升级补丁版本...$(COLOR_RESET)"
	pnpm version patch
	@echo "$(COLOR_GREEN)✓ 新版本: v$$(node -p "require('./package.json').version")$(COLOR_RESET)"

.PHONY: bump-minor
bump-minor: ## 升级次版本号 (x.1.x)
	@echo "$(COLOR_GREEN)正在升级次版本...$(COLOR_RESET)"
	pnpm version minor
	@echo "$(COLOR_GREEN)✓ 新版本: v$$(node -p "require('./package.json').version")$(COLOR_RESET)"

.PHONY: bump-major
bump-major: ## 升级主版本号 (1.x.x)
	@echo "$(COLOR_GREEN)正在升级主版本...$(COLOR_RESET)"
	pnpm version major
	@echo "$(COLOR_GREEN)✓ 新版本: v$$(node -p "require('./package.json').version")$(COLOR_RESET)"
