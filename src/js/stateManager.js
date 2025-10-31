/**
 * 状态管理模块
 * 负责管理卡片状态、z-index和全屏卡片
 */

import { CONFIG } from './config.js'

/**
 * 卡片状态管理器
 */
class StateManager {
	constructor() {
		// 使用WeakMap存储卡片状态，卡片删除后自动回收
		this.cardStates = new WeakMap()

		// z-index管理
		this.zIndexCursor = CONFIG.Z_INDEX.BASE

		// 当前全屏卡片
		this.activeMaximizedCard = null

		// 所有活动的卡片引用（用于清理）
		this.activeCards = new Set()
	}

	/**
	 * 初始化卡片状态
	 * @param {HTMLElement} card - 卡片元素
	 * @param {Object} initialState - 初始状态
	 */
	initCardState(card, initialState) {
		this.cardStates.set(card, {
			...initialState,
			maximized: false,
			closing: false,
			dragging: false
		})
		this.activeCards.add(card)
	}

	/**
	 * 获取卡片状态
	 * @param {HTMLElement} card - 卡片元素
	 * @returns {Object|null} 卡片状态
	 */
	getCardState(card) {
		return this.cardStates.get(card) || null
	}

	/**
	 * 更新卡片状态
	 * @param {HTMLElement} card - 卡片元素
	 * @param {Object} updates - 要更新的状态
	 */
	updateCardState(card, updates) {
		const state = this.cardStates.get(card)
		if (state) {
			Object.assign(state, updates)
		}
	}

	/**
	 * 清理卡片状态（修复内存泄漏）
	 * @param {HTMLElement} card - 卡片元素
	 */
	cleanupCard(card) {
		// 从活动卡片集合中移除
		this.activeCards.delete(card)

		// 如果是当前全屏卡片，清除引用
		if (this.activeMaximizedCard === card) {
			this.activeMaximizedCard = null
		}

		// WeakMap会自动清理，但显式删除更明确
		this.cardStates.delete(card)
	}

	/**
	 * 将卡片置于顶层（修复z-index溢出问题）
	 * @param {HTMLElement} card - 卡片元素
	 */
	bringToFront(card) {
		// 全屏卡片始终在最顶层
		if (card === this.activeMaximizedCard) {
			card.style.zIndex = CONFIG.Z_INDEX.MAXIMIZED
			return
		}

		// 递增z-index
		this.zIndexCursor++

		// 防止z-index超过最大值，重置所有卡片的z-index
		if (this.zIndexCursor >= CONFIG.Z_INDEX.MAX_NORMAL) {
			this.resetZIndexes()
		}

		card.style.zIndex = this.zIndexCursor
	}

	/**
	 * 重置所有卡片的z-index（防止溢出）
	 */
    resetZIndexes() {
        if (CONFIG.DEBUG) console.log('重置所有卡片的z-index')

		// 获取所有非全屏卡片并按当前z-index排序
		const sortedCards = Array.from(this.activeCards)
			.filter(card => card !== this.activeMaximizedCard)
			.sort((a, b) => {
				const zA = parseInt(a.style.zIndex) || 0
				const zB = parseInt(b.style.zIndex) || 0
				return zA - zB
			})

		// 重新分配z-index
		this.zIndexCursor = CONFIG.Z_INDEX.BASE
		sortedCards.forEach(card => {
			card.style.zIndex = ++this.zIndexCursor
		})
	}

	/**
	 * 设置全屏卡片
	 * @param {HTMLElement} card - 卡片元素
	 */
	setMaximizedCard(card) {
		this.activeMaximizedCard = card
		card.style.zIndex = CONFIG.Z_INDEX.MAXIMIZED
		const state = this.getCardState(card)
		if (state) {
			state.maximized = true
		}
	}

	/**
	 * 清除全屏卡片
	 * @param {HTMLElement} card - 卡片元素
	 */
	clearMaximizedCard(card) {
		if (this.activeMaximizedCard === card) {
			this.activeMaximizedCard = null
		}
		const state = this.getCardState(card)
		if (state) {
			state.maximized = false
		}
	}

	/**
	 * 获取当前全屏卡片
	 * @returns {HTMLElement|null}
	 */
	getMaximizedCard() {
		return this.activeMaximizedCard
	}

	/**
	 * 获取活动卡片数量
	 * @returns {number}
	 */
	getActiveCardCount() {
		return this.activeCards.size
	}
}

// 导出单例
export const stateManager = new StateManager()
