// imageUtils.js - 图片处理工具函数

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}

/**
 * 获取图片格式
 * @param {string} path 图片路径
 * @returns {string} 图片格式
 */
function getImageFormat(path) {
  const extension = path.split('.').pop().toLowerCase();
  if (extension === 'jpeg') return 'jpg';
  return extension;
}

/**
 * 估算文件大小
 * @param {number} width 图片宽度
 * @param {number} height 图片高度
 * @returns {number} 估算的文件大小（字节）
 */
function estimateFileSize(width, height) {
  // 简单估算：宽 × 高 × 3字节(RGB) × 压缩系数
  return width * height * 3 * 0.5;
}

/**
 * 生成唯一文件名
 * @param {string} extension 文件扩展名
 * @returns {string} 唯一文件名
 */
function generateUniqueFileName(extension = 'jpg') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `image_${timestamp}_${random}.${extension}`;
}

/**
 * 检查图片格式是否支持
 * @param {string} format 图片格式
 * @returns {boolean} 是否支持
 */
function isSupportedFormat(format) {
  const supportedFormats = ['jpg', 'jpeg', 'png', 'webp'];
  return supportedFormats.includes(format.toLowerCase());
}

/**
 * 计算压缩比例
 * @param {number} originalSize 原始大小
 * @param {number} compressedSize 压缩后大小
 * @returns {number} 压缩比例（百分比）
 */
function calculateCompressionRatio(originalSize, compressedSize) {
  if (originalSize === 0) return 0;
  return ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
}

/**
 * 获取当前日期时间字符串
 * @returns {string} 格式化的日期时间
 */
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

module.exports = {
  formatFileSize,
  getImageFormat,
  estimateFileSize,
  generateUniqueFileName,
  isSupportedFormat,
  calculateCompressionRatio,
  getCurrentDateTime
};