/**
 * 主应用模块
 * 应用入口，负责初始化和协调各个模块
 */

import { CONFIG } from './config.js'
import { debounce, isMobileDevice } from './utils.js'
import { stateManager } from './stateManager.js'
import { CardManager } from './cardManager.js'
import { themeManager } from './themeManager.js'
import { fullscreenManager } from './fullscreenManager.js'

/**
 * 应用类
 */
class App {
	constructor() {
		this.board = document.getElementById('board')
		this.cardManager = new CardManager(this.board)
		this.isMobile = isMobileDevice()
		this.spawnTimer = null
		this.spawnTimerType = null // 'timeout' | 'idle'
		this.isRunning = false
		this.dynamicSpawnInterval = 0
		this.spawnBurst = 1
		this._fpsRafId = null
		this._fpsState = { last: performance.now(), frames: 0, acc: 0 }
	}

	/**
	 * 初始化应用
	 */
	init() {
		if (CONFIG.DEBUG) console.log('初始化便签墙应用')
		this.isRunning = true

		// 初始化主题管理器（必须在创建卡片之前初始化）
		themeManager.init()

		// 初始化全屏管理器
		fullscreenManager.init()

		// 初始化动态节奏
		const base = this.isMobile
			? CONFIG.ANIMATION.SPAWN_INTERVAL_MOBILE
			: CONFIG.ANIMATION.SPAWN_INTERVAL_DESKTOP
		this.dynamicSpawnInterval = base
		this.spawnBurst = 1
		if (CONFIG.PERF?.ADAPTIVE_SPAWN) this.startFpsMonitor()

		// 设置移动端样式
		document.body.classList.toggle('is-mobile', this.isMobile)

		// 初始化卡片
		this.createInitialCards()

		// 启动自动创建卡片
		this.startAutoSpawn()

		// 绑定窗口事件（使用防抖优化）
		this.bindEvents()

	}

	startFpsMonitor() {
		const lower = CONFIG.PERF.FPS_LOWER ?? 48
		const upper = CONFIG.PERF.FPS_UPPER ?? 58
		const min = this.isMobile
			? (CONFIG.PERF.SPAWN_INTERVAL_MIN_MOBILE ?? 200)
			: (CONFIG.PERF.SPAWN_INTERVAL_MIN_DESKTOP ?? 140)
		const max = this.isMobile
			? (CONFIG.PERF.SPAWN_INTERVAL_MAX_MOBILE ?? 1400)
			: (CONFIG.PERF.SPAWN_INTERVAL_MAX_DESKTOP ?? 1200)
		const base = this.isMobile
			? CONFIG.ANIMATION.SPAWN_INTERVAL_MOBILE
			: CONFIG.ANIMATION.SPAWN_INTERVAL_DESKTOP

		const loop = (now) => {
			if (!this.isRunning) return
			const s = this._fpsState
			const dt = now - s.last
			s.last = now
			s.frames++
			s.acc += dt
			// 每约1秒评估一次
			if (s.acc >= 1000) {
				const fps = (s.frames * 1000) / s.acc
				// 调整动态间隔
				if (fps < lower) {
					// 掉帧：放慢且取消突发
					this.dynamicSpawnInterval = Math.min(max, Math.ceil(this.dynamicSpawnInterval * 1.25))
					this.spawnBurst = 1
				} else if (fps > upper) {
					// 余量：加速；高余量时允许一次2个
					this.dynamicSpawnInterval = Math.max(min, Math.floor(this.dynamicSpawnInterval * 0.85))
					this.spawnBurst = (this.dynamicSpawnInterval <= base * 1.1)
						? Math.min(CONFIG.PERF.SPAWN_BURST_MAX ?? 2, 2)
						: 1
				} else {
					// 稳定区：缓慢向基础靠拢
					if (this.dynamicSpawnInterval > base) this.dynamicSpawnInterval = Math.max(base, Math.floor(this.dynamicSpawnInterval * 0.96))
					if (this.dynamicSpawnInterval < base) this.dynamicSpawnInterval = Math.min(base, Math.ceil(this.dynamicSpawnInterval * 1.04))
				}
				// 重置统计
				s.frames = 0
				s.acc = 0
				if (CONFIG.DEBUG) console.log(`FPS=${fps.toFixed(1)}, interval=${this.dynamicSpawnInterval}ms, burst=${this.spawnBurst}`)
			}
			this._fpsRafId = requestAnimationFrame(loop)
		}

		this._fpsRafId = requestAnimationFrame(loop)
	}

	/**
	 * 创建初始卡片
	 */
	createInitialCards() {
		const initialCount = this.isMobile
			? CONFIG.LIMITS.INITIAL_CARDS_MOBILE
			: CONFIG.LIMITS.INITIAL_CARDS_DESKTOP

		const batchSize = this.isMobile
			? (CONFIG.PERF?.INITIAL_BATCH_SIZE_MOBILE ?? 4)
			: (CONFIG.PERF?.INITIAL_BATCH_SIZE_DESKTOP ?? 5)

		if (CONFIG.DEBUG) console.log(`创建初始卡片: ${initialCount}张，批量：${batchSize}/帧`)

		let created = 0
		const spawnBatch = () => {
			const toCreate = Math.min(batchSize, initialCount - created)
			for (let i = 0; i < toCreate; i++) {
				this.cardManager.createCard()
			}
			created += toCreate
			if (created < initialCount) {
				requestAnimationFrame(spawnBatch)
			}
		}

		requestAnimationFrame(spawnBatch)
	}

	/**
	 * 启动自动创建卡片（修复：条件化创建，避免无效操作）
	 */
	startAutoSpawn() {
		this.stopAutoSpawn()

		const spawnInterval = this.isMobile
			? CONFIG.ANIMATION.SPAWN_INTERVAL_MOBILE
			: CONFIG.ANIMATION.SPAWN_INTERVAL_DESKTOP

		const scheduleNext = () => {
			if (!this.isRunning) return

			// 计算当前间隔，最后10张卡片逐渐变慢营造"呼吸感"
			const maxCards = this.isMobile
				? CONFIG.LIMITS.MAX_CARDS_MOBILE
				: CONFIG.LIMITS.MAX_CARDS_DESKTOP
			const currentCount = stateManager.getActiveCardCount()
			const remainingCards = maxCards - currentCount

			let currentInterval = this.dynamicSpawnInterval || spawnInterval

			// 最后10张卡片，逐渐放慢速度
			if (remainingCards <= 10 && remainingCards > 0) {
				// 根据剩余卡片数量，间隔从1.5倍逐渐增加到3倍
				const slowdownFactor = 1.5 + (10 - remainingCards) * 0.15
				currentInterval = Math.floor(currentInterval * slowdownFactor)
			}

			const wow = !!(CONFIG.PERF && CONFIG.PERF.WOW_MODE)
			if (!wow && CONFIG.PERF && CONFIG.PERF.USE_IDLE_SPAWN && 'requestIdleCallback' in window) {
				this.spawnTimerType = 'idle'
				this.spawnTimer = window.requestIdleCallback(
					(deadline) => {
						if (!this.isRunning) return
						// 仅在线程空闲时尝试创建
						if (deadline.timeRemaining() > 6) {
							this.trySpawnOnce()
						}
						// 用 setTimeout 控制节奏，避免 requestIdleCallback 过于频繁
						this.spawnTimerType = 'timeout'
						this.spawnTimer = setTimeout(scheduleNext, currentInterval)
					},
					{ timeout: currentInterval }
				)
			} else {
				this.spawnTimerType = 'timeout'
				this.spawnTimer = setTimeout(() => {
					this.trySpawnOnce()
					scheduleNext()
				}, currentInterval)
			}
		}

		scheduleNext()

		if (CONFIG.DEBUG) {
			const maxCards = this.isMobile
				? CONFIG.LIMITS.MAX_CARDS_MOBILE
				: CONFIG.LIMITS.MAX_CARDS_DESKTOP
			console.log(`自动生成卡片已启动，间隔: ${spawnInterval}ms, 最大卡片数: ${maxCards}`)
		}
	}

	trySpawnOnce() {
		const maxCards = this.isMobile
			? CONFIG.LIMITS.MAX_CARDS_MOBILE
			: CONFIG.LIMITS.MAX_CARDS_DESKTOP
		const currentCount = stateManager.getActiveCardCount()
		if (CONFIG.DEBUG) {
			console.log(`当前卡片数: ${currentCount}, 最大限制: ${maxCards}`)
		}
		if (currentCount < maxCards) {
			// 小突发：在高FPS时一次生成最多2张
			const canCreate = Math.min(this.spawnBurst || 1, maxCards - currentCount)
			for (let i = 0; i < canCreate; i++) {
				this.cardManager.createCard()
			}
		} else if (CONFIG.DEBUG) {
			console.log('已达到卡片上限，跳过创建')
		}
	}

	/**
	 * 停止自动创建卡片
	 */
	stopAutoSpawn() {
		if (this.spawnTimer) {
			try {
				if (this.spawnTimerType === 'idle' && 'cancelIdleCallback' in window) {
					window.cancelIdleCallback(this.spawnTimer)
				} else {
					clearTimeout(this.spawnTimer)
				}
			} catch (_) {
				clearTimeout(this.spawnTimer)
			}
			this.spawnTimer = null
			this.spawnTimerType = null
			if (CONFIG.DEBUG) console.log('自动生成卡片已停止')
		}
	}

	/**
	 * 绑定事件监听器
	 */
	bindEvents() {
		// 窗口大小变化（使用防抖优化性能）
		const handleResize = debounce(() => {
			const wasMobile = this.isMobile
			this.isMobile = isMobileDevice()

			// 更新body class
			document.body.classList.toggle('is-mobile', this.isMobile)

			// 更新卡片管理器状态
			this.cardManager.handleResize()

			// 如果移动端状态改变，重启自动生成
			if (wasMobile !== this.isMobile) {
				if (CONFIG.DEBUG) console.log(`设备模式切换: ${this.isMobile ? '移动端' : '桌面端'}`)
				this.startAutoSpawn()
			}
		}, CONFIG.ANIMATION.RESIZE_DEBOUNCE)

		window.addEventListener('resize', handleResize)

		// 页面可见性变化（性能优化：隐藏时暂停生成）
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				if (CONFIG.DEBUG) console.log('页面隐藏，暂停卡片生成')
				this.stopAutoSpawn()
			} else {
				if (CONFIG.DEBUG) console.log('页面可见，恢复卡片生成')
				this.startAutoSpawn()
			}
		})
	}

	/**
	 * 销毁应用
	 */
	destroy() {
		this.stopAutoSpawn()
		this.isRunning = false
		if (this._fpsRafId) cancelAnimationFrame(this._fpsRafId)
		if (CONFIG.DEBUG) console.log('应用已销毁')
	}
}

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		window.app = new App()
		window.app.init()
	})
} else {
	window.app = new App()
	window.app.init()
}
