/**
 * 音乐控制管理模块
 * 负责音乐播放/暂停控制和UI更新
 */

import { CONFIG } from './config.js'
import { audioManager } from './audioManager.js'

/**
 * 音乐控制管理器
 */
export class MusicControlManager {
	constructor() {
		this.musicToggleBtn = null
		this.musicIcon = null
	}

	/**
	 * 初始化音乐控制
	 */
	init() {
		this.musicToggleBtn = document.getElementById('musicToggle')
		this.musicIcon = this.musicToggleBtn?.querySelector('.music-toggle-icon')

		// 根据初始播放状态更新图标
		this.updateIcon(audioManager.isPlaying)

		// 绑定切换事件
		if (this.musicToggleBtn) {
			this.musicToggleBtn.addEventListener('click', async () => {
				await this.toggleMusic()
			})
		}
	}

	/**
	 * 切换音乐播放/暂停
	 */
	async toggleMusic() {
		const isPlaying = await audioManager.toggle()
		this.updateIcon(isPlaying)
	}

	/**
	 * 更新音乐图标和动画状态
	 * @param {boolean} isPlaying - 是否正在播放
	 */
	updateIcon(isPlaying) {
		if (!this.musicToggleBtn) return

		if (isPlaying) {
			// 播放中：移除暂停状态，添加播放状态
			this.musicToggleBtn.classList.remove('paused')
			this.musicToggleBtn.classList.add('playing')
		} else {
			// 暂停：保持 playing 类（保留动画），添加 paused 类（暂停动画）
			this.musicToggleBtn.classList.add('paused')
		}
	}

	/**
	 * 同步更新UI状态（当音乐在其他地方被控制时调用）
	 */
	syncUIState() {
		this.updateIcon(audioManager.isPlaying)
	}
}

// 创建单例实例
export const musicControlManager = new MusicControlManager()
