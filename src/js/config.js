/**
 * 应用配置常量
 */
export const CONFIG = {
	// 调试开关（避免大量日志拖慢页面）
	DEBUG: false,
	// 便签墙消息
	MESSAGES: [
		'保持好心情',
		'多喝水哦',
		'今天辛苦啦',
		'早点休息',
		'记得吃水果',
		'加油，你可以的',
		'祝你顺利',
		'保持微笑呀',
		'愿所有烦恼都消失',
		'期待下一次见面',
		'梦想总会实现',
		'天气冷了，多穿衣服',
		'记得给自己放松',
		'每天都要元气满满',
		'今天也要好好爱自己',
		'适当休息一下',
		'你真的很棒',
		'相信自己',
		'一切都会好起来的',
		'今天也是特别的一天',
		'慢慢来，不着急',
		'你值得更好的',
		'保持热爱，奔赴山海',
		'做自己就好',
		'珍惜当下',
		'温柔对待世界',
		'别忘了吃早餐',
		'注意安全哦',
		'要开心呀',
		'好好睡一觉',
		'别太累了',
		'给自己一个拥抱',
		'今天也很美好',
		'生活需要仪式感',
		'慢慢变好',
		'心情要像花儿一样',
		'保持善良',
		'记得晒太阳',
		'听听喜欢的音乐',
		'出去走走吧',
		'想吃什么就吃吧',
		'做喜欢的事',
		'别想太多',
		'享受当下',
		'你已经很努力了',
		'给自己点时间',
		'不必太完美',
		'按自己的节奏来',
		'好运会降临的',
		'未来可期',
		'保持热情',
		'温暖常在',
		'平安喜乐',
		'岁岁常欢愉',
		'万事皆可期',
		'一切安好',
		'心想事成',
		'前路浩浩荡荡',
		'笑口常开',
		'健康快乐',
		'顺遂无忧',
		'轻松一点',
		'别忘了喝奶茶',
		'今天要快乐哦',
		'做个好梦'
	],

	// 卡片颜色
	COLORS: [
		'#ffe0e3',
		'#c7f0ff',
		'#ffd8a8',
		'#d9f2d9',
		'#e5d7ff',
		'#f9f7d9',
		'#d2f0f8',
		'#ffd4f5'
	],

	// 卡片尺寸
	CARD: {
		DESKTOP_WIDTH: 220,
		DESKTOP_HEIGHT: 140,
		MOBILE_WIDTH: 140, // 缩小移动端卡片
		MOBILE_HEIGHT: 100,
		BORDER_RADIUS: 12,
		MOBILE_BORDER_RADIUS: 10
	},

	// 间距
	SPACING: {
		DESKTOP_HORIZONTAL: 16,
		DESKTOP_VERTICAL: 20,
		MOBILE_HORIZONTAL: 12,
		MOBILE_VERTICAL: 12
	},

	// 动画时长 (ms)
	ANIMATION: {
		TRANSITION_DURATION: 350,
		INITIAL_SPAWN_DELAY_DESKTOP: 20,
		INITIAL_SPAWN_DELAY_MOBILE: 30,
		SPAWN_INTERVAL_DESKTOP: 96, // 加快20%: 120 * 0.8 = 96
		SPAWN_INTERVAL_MOBILE: 144, // 加快20%: 180 * 0.8 = 144
		RESIZE_DEBOUNCE: 300
	},

	// 卡片数量限制
	LIMITS: {
		MAX_CARDS_DESKTOP: 161, // 减少30%: 230 * 0.7 ≈ 161
		MAX_CARDS_MOBILE: 161,
		INITIAL_CARDS_DESKTOP: 0, // 爱心形状不需要初始卡片
		INITIAL_CARDS_MOBILE: 0
	},

	// 旋转角度范围
	ROTATION: {
		DESKTOP_RANGE: 10,
		MOBILE_RANGE: 6
	},

	// z-index管理
	Z_INDEX: {
		BASE: 1,
		MAXIMIZED: 10000,
		MAX_NORMAL: 9999 // 普通卡片最大z-index
	},

	// 边界约束
	BOUNDARY: {
		OVERFLOW_RATIO: 0.15 // 允许卡片超出屏幕的比例
	},

	// 初始缩放
	SCALE: {
		INITIAL_DESKTOP: 0.7,
		INITIAL_MOBILE: 0.85,
		NORMAL: 1,
		MINIMIZED: 0.1
	},

	// 移动端检测断点
	MOBILE_BREAKPOINT: 768,

	// 性能策略
	PERF: {
		USE_IDLE_SPAWN: true, // 使用 requestIdleCallback 在空闲时生成卡片
		WOW_MODE: true, // 惊艳模式：更快的生成、更高的上限
		INITIAL_BATCH_SIZE_DESKTOP: 4,
		INITIAL_BATCH_SIZE_MOBILE: 3,
		ADAPTIVE_SPAWN: true, // 自适应生成，基于FPS
		TARGET_FPS: 55,
		FPS_LOWER: 48,
		FPS_UPPER: 58,
		SPAWN_BURST_MAX: 2,
		SPAWN_INTERVAL_MIN_DESKTOP: 140,
		SPAWN_INTERVAL_MIN_MOBILE: 200,
		SPAWN_INTERVAL_MAX_DESKTOP: 1200,
		SPAWN_INTERVAL_MAX_MOBILE: 1400
	},

	// 爱心形状布局
	LAYOUT: {
		USE_HEART_SHAPE: true, // 是否使用爱心形状布局
		EASTER_EGG_MESSAGES: [
			'先把爱涂上喜欢的颜色',
			'为自己的人生鲜艳上色'
		], // 彩蛋：最后两张卡片的固定文案
		// 爱心形状的参数化坐标点（基于数学公式）
		// 使用归一化坐标 [0, 1]，将在实际使用时根据屏幕大小缩放
		getHeartPositions: () => {
			const positions = []
			const numPoints = 161 // 减少到161个点

			for (let i = 0; i < numPoints; i++) {
				const t = (i / numPoints) * 2 * Math.PI
				// 爱心参数方程
				const x = 16 * Math.pow(Math.sin(t), 3)
				const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))

				// 归一化到 [0, 1] 范围
				// x 范围大约是 [-16, 16], y 范围大约是 [-16, 13]
				const normalizedX = (x + 16) / 32
				const normalizedY = (y + 16) / 29

				positions.push({ x: normalizedX, y: normalizedY })
			}

			return positions
		}
	}
}
