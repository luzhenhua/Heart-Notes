/**
 * 卡片管理模块
 * 负责卡片的创建、交互、动画等核心功能
 */

import { CONFIG } from './config.js'
import { randomFrom, clamp, applyTransform, isMobileDevice } from './utils.js'
import { stateManager } from './stateManager.js'

/**
 * 卡片管理器
 */
export class CardManager {
	constructor(boardElement) {
		this.board = boardElement
		this.isMobile = isMobileDevice()
		this.heartPositions = CONFIG.LAYOUT.getHeartPositions()
		this.currentPositionIndex = 0
	}

	/**
	 * 创建新卡片
	 */
    createCard() {
        if (CONFIG.DEBUG) {
            console.log(`创建卡片前: 活动卡片数 = ${stateManager.getActiveCardCount()}`)
        }

		const card = document.createElement('div')
		card.className = 'card'

		// 彩蛋：判断是否是最后两张卡片（第160和161张）
		const currentCount = stateManager.getActiveCardCount()
		const maxCards = CONFIG.LIMITS.MAX_CARDS_DESKTOP
		const isSecondLastCard = currentCount === maxCards - 2
		const isLastCard = currentCount === maxCards - 1

		// 随机选择颜色和消息，最后两张卡片使用彩蛋文案
		const color = randomFrom(CONFIG.COLORS)
		let message
		if (isSecondLastCard) {
			message = CONFIG.LAYOUT.EASTER_EGG_MESSAGES[0]
		} else if (isLastCard) {
			message = CONFIG.LAYOUT.EASTER_EGG_MESSAGES[1]
		} else {
			message = randomFrom(CONFIG.MESSAGES)
		}

		// 计算位置参数
		const cardWidth = this.isMobile
			? CONFIG.CARD.MOBILE_WIDTH
			: CONFIG.CARD.DESKTOP_WIDTH
		const cardHeight = this.isMobile
			? CONFIG.CARD.MOBILE_HEIGHT
			: CONFIG.CARD.DESKTOP_HEIGHT
		const horizontalMargin = this.isMobile
			? CONFIG.SPACING.MOBILE_HORIZONTAL
			: CONFIG.SPACING.DESKTOP_HORIZONTAL
		const verticalMargin = this.isMobile
			? CONFIG.SPACING.MOBILE_VERTICAL
			: CONFIG.SPACING.DESKTOP_VERTICAL

		let left, top

		// 使用爱心形状布局或随机布局
		if (CONFIG.LAYOUT.USE_HEART_SHAPE) {
			// 获取当前位置索引对应的爱心坐标点
			const position = this.heartPositions[this.currentPositionIndex % this.heartPositions.length]

			// 计算可用区域（考虑卡片尺寸和边距）
			const availableWidth = window.innerWidth - cardWidth - horizontalMargin * 2
			const availableHeight = window.innerHeight - cardHeight - verticalMargin * 2 - 60 // 减去footer高度

			// 计算爱心的缩放比例（取较小值以确保完整显示）
			// 移动端使用更小的缩放比例以确保爱心完整显示
			const scaleRatio = this.isMobile ? 0.7 : 0.85
			const scale = Math.min(availableWidth, availableHeight) * scaleRatio

			// 将归一化坐标转换为实际像素坐标（居中显示）
			left = horizontalMargin + (availableWidth - scale) / 2 + position.x * scale
			top = verticalMargin + (availableHeight - scale) / 2 + position.y * scale

			// 添加一些随机偏移，让卡片看起来更自然、更密集
			const randomOffset = this.isMobile ? 8 : 15
			left += (Math.random() - 0.5) * randomOffset
			top += (Math.random() - 0.5) * randomOffset

			// 循环使用位置
			this.currentPositionIndex++
		} else {
			// 随机生成位置
			left =
				horizontalMargin +
				Math.random() *
					Math.max(window.innerWidth - cardWidth - horizontalMargin * 2, 0)
			top =
				verticalMargin +
				Math.random() *
					Math.max(window.innerHeight - cardHeight - verticalMargin * 2, 0)
		}

		// 不旋转，保持水平以便识别爱心形状
		const angle = 0

		// 设置样式
		card.style.background = color
		card.style.left = `${left}px`
		card.style.top = `${top}px`

		// 设置HTML内容
		card.innerHTML = `
			<div class="card-header">
				<div class="window-controls">
					<button class="control close" type="button" aria-label="关闭"></button>
					<span class="control minimize"></span>
					<span class="control maximize"></span>
				</div>
				<div class="card-title">温馨提示</div>
			</div>
			<div class="card-body">${message}</div>
		`

		// 初始化卡片状态
		const initialScale = this.isMobile
			? CONFIG.SCALE.INITIAL_MOBILE
			: CONFIG.SCALE.INITIAL_DESKTOP

		stateManager.initCardState(card, {
			angle,
			scale: initialScale,
			translateX: 0,
			translateY: 0,
			left,
			top,
			lastPosition: { left, top }
		})

		// 应用初始transform
		const state = stateManager.getCardState(card)
		applyTransform(card, {
			scale: state.scale,
			rotate: state.angle
		})

		// 添加到DOM
		this.board.appendChild(card)
		stateManager.bringToFront(card)

		// 存储尺寸
		stateManager.updateCardState(card, {
			width: card.offsetWidth,
			height: card.offsetHeight
		})

		// 入场动画
		requestAnimationFrame(() => {
			stateManager.updateCardState(card, { scale: CONFIG.SCALE.NORMAL })
			applyTransform(card, {
				scale: CONFIG.SCALE.NORMAL,
				rotate: state.angle
			})
			card.style.opacity = '1'
		})

		// 绑定交互事件
		this.setupInteractions(card)

		// 限制卡片数量
		this.limitCardCount()

        if (CONFIG.DEBUG) {
            console.log(`创建卡片后: 活动卡片数 = ${stateManager.getActiveCardCount()}`)
        }
	}

	/**
	 * 限制卡片数量，删除最旧的卡片
	 */
	limitCardCount() {
		const maxCards = this.isMobile
			? CONFIG.LIMITS.MAX_CARDS_MOBILE
			: CONFIG.LIMITS.MAX_CARDS_DESKTOP

		// 当卡片数量达到或超过限制时，删除最旧的卡片
		let deleted = 0
            while (stateManager.getActiveCardCount() > maxCards) {
                const oldest = this.board.firstElementChild
                if (oldest && oldest.classList.contains('card')) {
                    if (CONFIG.DEBUG) {
                        console.log(`删除最旧的卡片，当前数量: ${stateManager.getActiveCardCount()}`)
                    }
                    this.removeCard(oldest)
                    deleted++
                    if (deleted > 10) {
                        if (CONFIG.DEBUG) console.error('删除卡片过多，强制停止')
                        break // 防止无限循环
                    }
                } else {
                    break // 防止无限循环
                }
		}
	}

	/**
	 * 设置卡片交互事件
	 * @param {HTMLElement} card - 卡片元素
	 */
	setupInteractions(card) {
		const header = card.querySelector('.card-header')
		const closeBtn = card.querySelector('.control.close')

		// 防止快速重复点击
		let isProcessing = false

		closeBtn.addEventListener('click', event => {
			event.stopPropagation()
			if (!isProcessing) {
				isProcessing = true
				this.closeCard(card)
			}
		})

		// 拖拽事件（支持鼠标和触摸）
		header.addEventListener('pointerdown', event => {
			this.startDrag(event, card)
		})

		// 点击卡片置顶
		card.addEventListener('pointerdown', () => {
			stateManager.bringToFront(card)
		})
	}

	/**
	 * 开始拖拽（修复：支持触摸拖拽）
	 * @param {PointerEvent} event - 指针事件
	 * @param {HTMLElement} card - 卡片元素
	 */
	startDrag(event, card) {
		// 忽略按钮点击
		if (event.target.closest('.control')) return

		const state = stateManager.getCardState(card)
		if (!state || state.closing || state.maximized) return

		event.preventDefault()
		stateManager.bringToFront(card)

		const header = card.querySelector('.card-header')
		card.classList.add('dragging')
		header.classList.add('dragging')

		stateManager.updateCardState(card, {
			dragging: true,
			dragOffsetX: event.clientX - state.left,
			dragOffsetY: event.clientY - state.top
		})

		// 使用requestAnimationFrame节流拖拽更新
		let dragFrame = null
		let pendingLeft = state.left
		let pendingTop = state.top

		const commitDrag = () => {
			dragFrame = null
			const currentState = stateManager.getCardState(card)
			const cardWidth = currentState.width || card.offsetWidth
			const cardHeight = currentState.height || card.offsetHeight

			// 边界限制（允许少量超出）
			const overflowRatio = CONFIG.BOUNDARY.OVERFLOW_RATIO
			const maxLeft = window.innerWidth - cardWidth * (1 - overflowRatio)
			const maxTop = window.innerHeight - cardHeight * (1 - overflowRatio)
			const minLeft = -cardWidth * overflowRatio
			const minTop = -cardHeight * overflowRatio

			currentState.left = clamp(pendingLeft, minLeft, maxLeft)
			currentState.top = clamp(pendingTop, minTop, maxTop)

			card.style.left = `${currentState.left}px`
			card.style.top = `${currentState.top}px`
		}

		const handlePointerMove = moveEvent => {
			const currentState = stateManager.getCardState(card)
			if (!currentState || !currentState.dragging) return

			pendingLeft = moveEvent.clientX - currentState.dragOffsetX
			pendingTop = moveEvent.clientY - currentState.dragOffsetY

			if (dragFrame === null) {
				dragFrame = requestAnimationFrame(commitDrag)
			}
		}

		const handlePointerUp = () => {
			const currentState = stateManager.getCardState(card)
			if (currentState) {
				currentState.dragging = false
				currentState.lastPosition = {
					left: currentState.left,
					top: currentState.top
				}
			}

			card.classList.remove('dragging')
			header.classList.remove('dragging')

			if (dragFrame !== null) {
				cancelAnimationFrame(dragFrame)
				commitDrag()
			}

			document.removeEventListener('pointermove', handlePointerMove)
			document.removeEventListener('pointerup', handlePointerUp)
		}

		document.addEventListener('pointermove', handlePointerMove)
		document.addEventListener('pointerup', handlePointerUp)
	}

	/**
	 * 关闭卡片（修复：完整清理事件和状态）
	 * @param {HTMLElement} card - 卡片元素
	 */
	closeCard(card) {
		const state = stateManager.getCardState(card)
		if (!state || state.closing) return

		stateManager.updateCardState(card, { closing: true, scale: CONFIG.SCALE.MINIMIZED })

		const currentState = stateManager.getCardState(card)
		applyTransform(card, {
			scale: currentState.scale,
			rotate: currentState.angle
		})
		card.style.opacity = '0'

		const handleTransitionEnd = event => {
			if (event.propertyName === 'opacity') {
				card.removeEventListener('transitionend', handleTransitionEnd)
				this.removeCard(card)
			}
		}

		card.addEventListener('transitionend', handleTransitionEnd)
	}

	/**
	 * 移除卡片并清理资源（修复内存泄漏）
	 * @param {HTMLElement} card - 卡片元素
	 */
	removeCard(card) {
		// 清理状态管理器中的引用
		stateManager.cleanupCard(card)

		// 从DOM中移除
		card.remove()
	}

	/**
	 * 最小化卡片
	 * @param {HTMLElement} card - 卡片元素
	 */
	minimizeCard(card) {
		const state = stateManager.getCardState(card)
		if (!state || state.closing) return

		const runMinimize = () => {
			stateManager.updateCardState(card, { closing: true })
			stateManager.bringToFront(card)

			const cardWidth = state.width || card.offsetWidth
			const bottom = Math.max(window.innerHeight - 24, 0)
			const targetLeft = clamp(
				state.left,
				16,
				Math.max(window.innerWidth - cardWidth - 16, 16)
			)

			stateManager.updateCardState(card, {
				left: targetLeft,
				top: bottom,
				scale: CONFIG.SCALE.MINIMIZED,
				angle: 0
			})

			const currentState = stateManager.getCardState(card)
			card.style.left = `${currentState.left}px`
			card.style.top = `${currentState.top}px`
			card.style.opacity = '0.35'
			applyTransform(card, {
				scale: currentState.scale,
				rotate: 0
			})

			const handleTransitionEnd = event => {
				if (event.propertyName === 'transform') {
					card.removeEventListener('transitionend', handleTransitionEnd)
					this.removeCard(card)
				}
			}

			card.addEventListener('transitionend', handleTransitionEnd)
		}

		// 如果是全屏状态，先恢复再最小化
		if (state.maximized) {
			stateManager.clearMaximizedCard(card)
			card.classList.remove('maximized')
			card.style.borderRadius = `${CONFIG.CARD.BORDER_RADIUS}px`

			stateManager.updateCardState(card, {
				left: 0,
				top: 0,
				scale: CONFIG.SCALE.NORMAL,
				angle: 0
			})

			const currentState = stateManager.getCardState(card)
			applyTransform(card, {
				scale: currentState.scale,
				rotate: 0
			})

			requestAnimationFrame(() => {
				requestAnimationFrame(runMinimize)
			})
			return
		}

		runMinimize()
	}

	/**
	 * 切换全屏状态
	 * @param {HTMLElement} card - 卡片元素
	 */
	toggleMaximize(card) {
		const state = stateManager.getCardState(card)
		if (!state || state.closing) return

		if (state.maximized) {
			this.restoreFromMaximize(card)
		} else {
			this.maximizeCard(card)
		}
	}

	/**
	 * 全屏卡片
	 * @param {HTMLElement} card - 卡片元素
	 */
	maximizeCard(card) {
		const state = stateManager.getCardState(card)

		// 保存全屏前的状态
		stateManager.updateCardState(card, {
			beforeMaximize: {
				left: state.left,
				top: state.top,
				scale: state.scale ?? CONFIG.SCALE.NORMAL,
				width: card.offsetWidth,
				height: card.offsetHeight,
				angle: state.angle ?? 0
			}
		})

		card.classList.add('maximized')
		card.style.left = '0px'
		card.style.top = '0px'
		card.style.width = `${window.innerWidth}px`
		card.style.height = `${window.innerHeight}px`
		card.style.borderRadius = '0'

		stateManager.updateCardState(card, {
			left: 0,
			top: 0,
			scale: CONFIG.SCALE.NORMAL,
			angle: 0
		})

		const currentState = stateManager.getCardState(card)
		applyTransform(card, {
			scale: currentState.scale,
			rotate: 0
		})

		stateManager.setMaximizedCard(card)
	}

	/**
	 * 从全屏恢复
	 * @param {HTMLElement} card - 卡片元素
	 */
	restoreFromMaximize(card) {
		const state = stateManager.getCardState(card)
		const previous = state.beforeMaximize
		if (!previous) return

		card.classList.remove('maximized')
		card.style.left = `${previous.left}px`
		card.style.top = `${previous.top}px`
		card.style.width = `${previous.width}px`
		card.style.height = `${previous.height}px`
		card.style.borderRadius = `${CONFIG.CARD.BORDER_RADIUS}px`

		stateManager.updateCardState(card, {
			left: previous.left,
			top: previous.top,
			scale: previous.scale ?? CONFIG.SCALE.NORMAL,
			angle: previous.angle ?? 0
		})

		const currentState = stateManager.getCardState(card)
		applyTransform(card, {
			scale: currentState.scale,
			rotate: currentState.angle
		})

		stateManager.clearMaximizedCard(card)
		stateManager.bringToFront(card)
		stateManager.updateCardState(card, {
			lastPosition: { left: currentState.left, top: currentState.top }
		})

		// 恢复原始尺寸（使用正确的时间）
		setTimeout(() => {
			const latestState = stateManager.getCardState(card)
			if (latestState && !latestState.maximized) {
				card.style.width = ''
				card.style.height = ''
				stateManager.updateCardState(card, {
					width: card.offsetWidth,
					height: card.offsetHeight
				})
			}
		}, CONFIG.ANIMATION.TRANSITION_DURATION + 10)
	}

	/**
	 * 更新移动端状态
	 */
	updateMobileState() {
		this.isMobile = isMobileDevice()
	}

	/**
	 * 处理窗口大小变化
	 */
	handleResize() {
		this.updateMobileState()

		// 更新全屏卡片尺寸
		const maximizedCard = stateManager.getMaximizedCard()
		if (maximizedCard) {
			maximizedCard.style.width = `${window.innerWidth}px`
			maximizedCard.style.height = `${window.innerHeight}px`
		}
	}
}
