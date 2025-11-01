/**
 * 全屏管理模块
 * 负责全屏切换和状态管理
 */

/**
 * 全屏管理器
 */
export class FullscreenManager {
	constructor() {
		this.fullscreenBtn = null
		this.fullscreenIcon = null
		this.isFullscreen = false
	}

	/**
	 * 初始化全屏管理器
	 */
	init() {
		this.fullscreenBtn = document.getElementById('fullscreenToggle')
		this.fullscreenIcon = this.fullscreenBtn?.querySelector('.fullscreen-toggle-icon')

		// 绑定切换事件
		if (this.fullscreenBtn) {
			this.fullscreenBtn.addEventListener('click', () => {
				this.toggleFullscreen()
			})
		}

		// 监听全屏状态变化（用户按ESC退出全屏时）
		document.addEventListener('fullscreenchange', () => {
			this.handleFullscreenChange()
		})
		document.addEventListener('webkitfullscreenchange', () => {
			this.handleFullscreenChange()
		})
		document.addEventListener('mozfullscreenchange', () => {
			this.handleFullscreenChange()
		})
		document.addEventListener('MSFullscreenChange', () => {
			this.handleFullscreenChange()
		})
	}

	/**
	 * 切换全屏状态
	 */
	toggleFullscreen() {
		if (!this.isFullscreen) {
			this.enterFullscreen()
		} else {
			this.exitFullscreen()
		}
	}

	/**
	 * 进入全屏
	 */
	enterFullscreen() {
		const elem = document.documentElement

		if (elem.requestFullscreen) {
			elem.requestFullscreen()
		} else if (elem.webkitRequestFullscreen) {
			elem.webkitRequestFullscreen()
		} else if (elem.mozRequestFullScreen) {
			elem.mozRequestFullScreen()
		} else if (elem.msRequestFullscreen) {
			elem.msRequestFullscreen()
		}
	}

	/**
	 * 退出全屏
	 */
	exitFullscreen() {
		if (document.exitFullscreen) {
			document.exitFullscreen()
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen()
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen()
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen()
		}
	}

	/**
	 * 处理全屏状态变化
	 */
	handleFullscreenChange() {
		const isCurrentlyFullscreen = !!(
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement
		)

		this.isFullscreen = isCurrentlyFullscreen
		this.updateIcon()

		// 触发窗口 resize 事件，让卡片管理器重新布局
		// 使用 setTimeout 确保在全屏过渡完成后再执行
		setTimeout(() => {
			window.dispatchEvent(new Event('resize'))
		}, 100)
	}

	/**
	 * 更新图标
	 */
	updateIcon() {
		if (!this.fullscreenIcon) return

		if (this.isFullscreen) {
			// 全屏状态：显示退出全屏图标
			this.fullscreenIcon.textContent = '⛶'
		} else {
			// 非全屏状态：显示进入全屏图标
			this.fullscreenIcon.textContent = '⛶'
		}
	}
}

// 创建单例实例
export const fullscreenManager = new FullscreenManager()
