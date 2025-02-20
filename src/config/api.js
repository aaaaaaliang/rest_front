import { List } from "echarts";

export const API = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  
  USER: {
    LOGIN: '/api/user/login',
    REGISTER: '/api/user',
    CAPTCHA: '/api/user/captcha',
    GITHUB_LOGIN: '/api/user/oauth/github/login',
    GITHUB_CALLBACK: '/api/user/oauth/callback',
    LIST: '/api/user/list',
    CREATE: '/api/user',
    UPDATE: '/api/user',
    DELETE: '/api/user',
    GET_ROLES: '/api/user/roles',
    ASSIGN_ROLES: '/api/user/assign',
    RESET_PASSWORD: '/api/user/reset',
    GET_ROLE: '/api/user/role',
    ROLES: '/api/user/roles',
    ADDUSER:"api/user/add",
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
    GET:"/api/ws"
  },
  PERMISSION: {
    LIST: '/api/role/permissions'
  },
  IMAGE: {
    LIST: '/api/images',
    UPLOAD: '/api/image/upload',
    DELETE: '/api/image'
  }
} 