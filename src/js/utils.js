/**
 * 工具函数模块
 */

/**
 * 从数组中随机选择一个元素
 * @param {Array} array - 源数组
 * @returns {*} 随机选中的元素
 */
export function randomFrom(array) {
	return array[Math.floor(Math.random() * array.length)]
}

/**
 * 限制数值在指定范围内
 * @param {number} value - 要限制的值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
export function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max)
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间(ms)
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
	let timeout
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout)
			func(...args)
		}
		clearTimeout(timeout)
		timeout = setTimeout(later, wait)
	}
}

/**
 * 检测是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export function isMobileDevice() {
	return (
		window.matchMedia('(pointer: coarse)').matches ||
		window.innerWidth <= 768
	)
}

/**
 * 应用CSS transform
 * @param {HTMLElement} element - DOM元素
 * @param {Object} transform - transform参数
 * @param {number} transform.translateX - X轴偏移
 * @param {number} transform.translateY - Y轴偏移
 * @param {number} transform.scale - 缩放比例
 * @param {number} transform.rotate - 旋转角度
 */
export function applyTransform(
	element,
	{ translateX = 0, translateY = 0, scale = 1, rotate = 0 }
) {
	element.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotate}deg)`
}
