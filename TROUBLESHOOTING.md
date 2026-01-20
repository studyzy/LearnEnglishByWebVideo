# 故障排查指南

## 如果扩展没有工作：

### 1. 检查扩展是否正确加载
- 打开 `chrome://extensions/`
- 确认 "YouTube Subtitle Enhancer" 显示为启用状态
- 点击 "详细信息"，检查：
  - "Service Worker" 是否显示 "活跃"
  - 点击 "Service Worker" 链接查看后台日志

### 2. 检查 Content Script 注入
在 YouTube 页面：
- 按 F12 打开开发者工具
- 切换到 Console 标签
- 刷新页面 (F5)
- 应该看到：
  ```
  YouTube Subtitle Enhancer: Content script loaded
  YouTube Subtitle Enhancer: Initializing...
  ```

### 3. 检查 API Key 配置
```bash
cd /Users/devinzeng/Code/studyzy/LearnEnglishByWebVideo
cat .env
```

确保有：
```
OPENAI_API_KEY=sk-你的密钥
```

然后重新构建：
```bash
npm run build
```

### 4. 查看详细日志

#### Service Worker 日志：
1. `chrome://extensions/` 
2. 找到扩展的 "Service Worker"
3. 点击查看后台日志

#### Content Script 日志：
1. 在 YouTube 页面按 F12
2. Console 标签
3. 查找 "YouTube Subtitle Enhancer" 消息

### 5. 常见问题

**问题：看不到绿色指示器**
- 检查扩展是否启用
- 检查是否在 /watch 页面（必须是观看视频页面）
- 尝试禁用其他扩展（可能有冲突）

**问题：看到指示器但没有字幕**
- 检查视频是否有英文字幕（点击 YouTube 的 CC 按钮）
- 检查 Console 是否有错误
- 检查 API Key 是否正确配置

**问题：API Key 错误**
- 确保 .env 文件在项目根目录
- 确保 API Key 以 sk- 开头
- 重新运行 `npm run build`

### 6. 手动测试步骤

```bash
# 1. 重新构建
cd /Users/devinzeng/Code/studyzy/LearnEnglishByWebVideo
npm run build

# 2. 在 Chrome 重新加载扩展
# chrome://extensions/ -> 点击刷新按钮

# 3. 打开 YouTube 测试视频
# https://www.youtube.com/watch?v=5MuIMqhT8DM

# 4. 检查控制台日志 (F12)
```

### 7. 获取帮助

如果以上步骤都无效，请收集以下信息：
1. Chrome 版本号
2. Service Worker 日志截图
3. Content Script 控制台截图
4. 是否看到绿色指示器
