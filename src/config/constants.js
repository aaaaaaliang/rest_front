export const IMAGE_SIZE = {
  THUMBNAIL: '120x120',  // 缩略图尺寸
  MEDIUM: '240x240',     // 中等尺寸
  LARGE: '480x480'       // 大尺寸
}

// 生成指定尺寸的图片URL
export const getImageUrl = (url, size = IMAGE_SIZE.MEDIUM) => {
  if (!url) return ''
  return `${url}?x-oss-process=image/resize,m_fill,h_${size.split('x')[0]},w_${size.split('x')[1]}`
}

export const ORDER_STATUS = {
  PENDING: 1,    // 已下单
  PROCESSING: 2, // 制作中
  COMPLETED: 3,  // 已完成
  OVERDUE: 4,    // 已逾期
  FAILED: 5      // 无法处理
}

export const ORDER_STATUS_MAP = {
  [ORDER_STATUS.PENDING]: {
    label: '已下单',
    type: 'primary'
  },
  [ORDER_STATUS.PROCESSING]: {
    label: '制作中',
    type: 'warning'
  },
  [ORDER_STATUS.COMPLETED]: {
    label: '已完成',
    type: 'success'
  },
  [ORDER_STATUS.OVERDUE]: {
    label: '已逾期',
    type: 'danger'
  },
  [ORDER_STATUS.FAILED]: {
    label: '无法处理',
    type: 'info'
  }
} 