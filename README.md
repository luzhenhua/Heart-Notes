# 便签墙应用

一个优雅的动态便签墙应用，具有拖拽、全屏、最小化等功能。

## 项目结构

```
notes/
├── index.html              # 主HTML文件
├── src/
│   ├── css/
│   │   └── styles.css      # 样式文件
│   └── js/
│       ├── app.js          # 主应用入口
│       ├── cardManager.js  # 卡片管理模块
│       ├── stateManager.js # 状态管理模块
│       ├── config.js       # 配置常量
│       └── utils.js        # 工具函数
└── README.md
```

## 模块说明

### app.js - 主应用模块
- 应用初始化和生命周期管理
- 事件绑定（resize防抖、页面可见性）
- 性能优化：页面隐藏时暂停卡片生成

### cardManager.js - 卡片管理模块
- 卡片创建、删除、拖拽
- 卡片动画（最小化、全屏）
- 交互事件处理
- 支持触摸和鼠标拖拽

### stateManager.js - 状态管理模块
- 卡片状态存储和管理
- z-index自动管理和重置
- 全屏卡片状态维护
- 内存清理和资源管理

### config.js - 配置模块
- 集中管理所有常量
- 卡片颜色、消息、尺寸配置
- 动画时长、间隔配置
- 设备断点和限制配置

### utils.js - 工具函数模块
- 通用工具函数
- 防抖函数
- 数值限制函数
- transform应用函数

## 已修复的问题

### 1. 内存泄漏问题 ✅
- **问题**：删除卡片时未清理WeakMap状态和事件监听器
- **修复**：
  - 在 `stateManager.js` 中添加 `cleanupCard()` 方法
  - 在 `cardManager.js` 中调用 `removeCard()` 时彻底清理资源
  - 使用 `activeCards` Set 追踪所有活动卡片

### 2. 性能问题 ✅
- **问题**：resize事件频繁触发、无限创建卡片、遍历DOM低效
- **修复**：
  - 使用防抖函数处理resize事件（300ms）
  - 条件化创建卡片：只在未达到上限时创建
  - 页面隐藏时暂停卡片生成
  - 拖拽使用requestAnimationFrame节流

### 3. 移动端拖拽功能 ✅
- **问题**：触摸拖拽被完全禁用
- **修复**：
  - 移除 `if (event.pointerType === 'touch') return` 限制
  - 使用统一的 `pointerdown/pointermove/pointerup` 事件
  - 改进 `touch-action: none` CSS属性

### 4. 状态管理混乱 ✅
- **问题**：zIndex无限递增、全屏状态不一致
- **修复**：
  - 实现 `resetZIndexes()` 方法，达到上限时重置
  - 统一通过 `stateManager` 管理全屏状态
  - 设置合理的z-index范围（1-9999普通，10000全屏）

### 5. 代码质量问题 ✅
- **问题**：硬编码值、魔法数字、职责不清
- **修复**：
  - 所有常量集中在 `config.js`
  - 添加详细注释说明
  - 模块化设计，单一职责原则
  - 统一的命名规范

### 6. 边界处理 ✅
- **问题**：卡片可以拖拽到屏幕外太多
- **修复**：
  - 使用 `BOUNDARY.OVERFLOW_RATIO` 配置允许的超出比例
  - 改进为15%的合理超出范围
  - 拖拽时实时应用边界限制

### 7. 快速点击保护 ✅
- **问题**：快速重复点击按钮导致状态错误
- **修复**：
  - 添加 `isProcessing` 标志防止重复点击
  - 使用100ms的冷却时间

### 8. 时间常量一致性 ✅
- **问题**：代码中360ms与CSS的350ms不一致
- **修复**：
  - 使用 `CONFIG.ANIMATION.TRANSITION_DURATION + 10` 确保动画完成

## 功能特性

- ✨ 随机生成带有温馨提示的便签卡片
- 🎨 8种柔和的背景颜色
- 🖱️ 支持鼠标和触摸拖拽
- 📱 响应式设计，移动端和桌面端自适应
- 🪟 macOS风格的窗口控制按钮
- 🔄 平滑的动画效果
- 📊 自动限制卡片数量防止性能问题
- 💾 完善的内存管理

## 使用方法

1. 直接在浏览器中打开 `index.html`
2. 卡片会自动生成并显示
3. 拖拽卡片标题栏可以移动位置
4. 点击窗口控制按钮：
   - 🔴 红色：关闭卡片
   - 🟡 黄色：最小化卡片
   - 🟢 绿色：全屏/恢复卡片
5. 双击标题栏切换全屏

## 性能优化与“惊艳模式”

- 默认启用“惊艳模式”（WOW_MODE = true）：
  - 桌面端最多 60 张、移动端最多 36 张
  - 首屏初始卡片：桌面 8 / 移动 6（更轻首屏）
  - 初始使用逐帧批量生成（每帧 3–4 张），既快又稳
  - 持续生成节奏更快（桌面 ~360ms / 移动 ~560ms），并带自适应调速
- 若设备较弱或希望更稳，可在 `src/js/config.js` 将 `PERF.WOW_MODE` 设为 `false`：
  - 使用 requestIdleCallback 空闲生成，避免主线程繁忙时堆压
  - 可酌情调低 `LIMITS` 和拉长 `ANIMATION.SPAWN_INTERVAL_*`
- 其它优化：
  - 使用 requestAnimationFrame 优化拖拽性能
  - resize 事件防抖处理
  - 页面隐藏时暂停卡片生成
  - z-index 自动重置防止溢出
  - WeakMap 自动垃圾回收

### 自适应生成（ADAPTIVE_SPAWN）
- 基于 FPS 自动调节生成间隔与突发数量（最多每次 2 张）：
  - FPS 低于阈值（例如 <48）：放慢节奏，突发降为 1
  - FPS 高于阈值（例如 >58）：加快节奏，必要时启用 2 张突发
  - 在稳定区间会缓慢收敛回默认节奏

## 浏览器兼容性

- Chrome / Edge (推荐)
- Firefox
- Safari
- 支持触摸设备

## 技术栈

- 原生JavaScript (ES6 Modules)
- CSS3 (Flexbox, Transitions, Transforms)
- HTML5

## 开发说明

本项目使用ES6模块化开发，需要通过HTTP服务器访问（不支持file://协议）。

推荐使用：
```bash
# 使用Python启动本地服务器
python -m http.server 8000

# 或使用Node.js的http-server
npx http-server -p 8000
```

然后访问 `http://localhost:8000`

## License

MIT
