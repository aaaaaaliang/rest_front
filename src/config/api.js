import { List } from "echarts";

export const API = {
  // BASE_URL: import.meta.env.VITE_API_BASE_URL,
   BASE_URL: "http://localhost:8888",
  
  USER: {
    LOGIN: '/api/user/login',
    REGISTER: '/api/user',
    CAPTCHA: '/api/user/captcha',
    GITHUB_LOGIN: '/api/user/oauth/github/login',
    GITHUB_CALLBACK: '/api/user/oauth/callback',
    LIST: '/api/user/list',
    EMPLOYEE_LIST: '/api/user/employee/list',
    CREATE: '/api/user',
    UPDATE: '/api/user',
    DELETE: '/api/user',
    GET_ROLES: '/api/user/roles',
    ASSIGN_ROLES: '/api/user/assign',
    RESET_PASSWORD: '/api/user/reset',
    GET_ROLE: '/api/user/role',
    ROLES: '/api/user/roles',
    ADDUSER:"/api/user/add",
    LOGOUT: '/api/user/logout'
  },

  CATEGORY: {
    LIST: '/api/category',         // GET    获取分类列表
    CREATE: '/api/category',       // POST   创建分类
    UPDATE: '/api/category',       // PUT    更新分类
    DELETE: '/api/category'        // DELETE 删除分类
  },

  UPLOAD: {
    FILE: '/api/upload'  // 单文件上传
  },

  PRODUCT: {
    LIST: '/api/product',         // GET    获取产品列表
    CREATE: '/api/product',       // POST   创建产品
    UPDATE: '/api/product',       // PUT    更新产品
    DELETE: '/api/product'        // DELETE 删除产品
  },

  CART: {
    LIST: '/api/cart',           // GET    获取购物车列表
    ADD: '/api/cart',           // POST   添加到购物车
    DELETE: '/api/cart/delete'  // POST   删除购物车项
  },

  ORDER: {
    ADD: '/api/order',
    LIST: '/api/order',
    DELETE: '/api/order',
    UPDATE: '/api/order'
  },

  BANNER: {
    LIST: '/api/banner',      // GET    获取轮播图列表
    CREATE: '/api/banner',    // POST   创建轮播图
    UPDATE: '/api/banner',    // PUT    更新轮播图
    DELETE: '/api/banner'     // DELETE 删除轮播图
  },

  ROLE: {
    LIST: '/api/role',
    CREATE: '/api/role',
    UPDATE: '/api/role',
    DELETE: '/api/role',
    GET_PERMISSIONS: '/api/role/permission',
    ASSIGN_PERMISSIONS: '/api/role/assign'
  },

  SALARY: {
    CREATE: '/api/salary',
    DELETE: '/api/salary',
    LIST: '/api/salary',
    UPDATE: '/api/salary'
  },

  DASHBOARD:{
    LIST:"/api/dashboard"
  },
  WS:{
    GET:"ws://localhost:8888/api/ws"
  },
  PERMISSION: {
    LIST: '/api/permission',
    UPDATE: '/api/permission'
  },
  IMAGE: {
    LIST: '/api/images',
    UPLOAD: '/api/image/upload',
    DELETE: '/api/image'
  },
  PAY: {
    GET: "/api/pay", // 获取支付宝支付链接
  },
  TABLE: {
    LIST: '/api/table',         // GET    获取餐桌列表
    CREATE: '/api/table',       // POST   创建餐桌
    UPDATE: '/api/table',       // PUT    更新餐桌
    DELETE: '/api/table'        // DELETE 删除餐桌
  },
  COUPON: {
    TEMPLATE_LIST: '/api/coupon/template',
    TEMPLATE_STATUS: '/api/coupon/template/status',
    TEMPLATE_DELETE: '/api/coupon/template',
    TEMPLATE_CREATE: '/api/coupon/template',
    TEMPLATE_UPDATE: '/api/coupon/template',
    LIST_ALL: '/api/coupon/list',           // 获取所有可领取的券
    RECEIVE: '/api/coupon/receive',          // 领取优惠券
    SECKILL_RECEIVE: '/api/coupon/seckill/receive',  // 秒杀券领取
    USER_COUPONS: '/api/coupon/seckill'     // 获取用户优惠券列表
  },
  AI: {
    CHAT_FIRST: '/api/ai/chat/first', // 首次发起AI聊天
    CHAT_IN_SESSION: '/api/ai/chat/in-session', // 在已有会话中继续聊天
    SESSION_LIST: '/api/ai/chat/session', // 获取会话列表
    SESSION_DELETE: '/api/ai/chat/session', // 删除会话
    SESSION_UPDATE: '/api/ai/chat/session', // 更新会话（重命名）
    HISTORY: '/api/ai/chat/history', // 获取聊天历史
    MODEL_CONFIG: '/api/ai-model' // 获取AI模型配置
  },
  CHAT: {
    AGENT: '/api/chat/agent', // 客服发起会话
    CUSTOMER: '/api/chat/customer', // 用户自动分配客服
    WS: '/api/chat' // WebSocket 聊天（带 session_code）
  },
  LOG: {
    SEARCH: '/api/log/es'
  }
} 

