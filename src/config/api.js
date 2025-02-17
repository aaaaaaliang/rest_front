import { List } from "echarts";

export const API = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  
  USER: {
    LOGIN: '/api/user/login',
    REGISTER: '/api/user',
    CAPTCHA: '/api/user/captcha',
    GITHUB_LOGIN: '/api/user/oauth/github/login',
    LIST: '/api/user/list',           // 获取用户列表
    CREATE: '/api/user/add',             // 新增用户(默认密码)
    UPDATE: '/api/user',              // 更新用户
    DELETE: '/api/user',              // 删除用户
    GET_ROLES: '/api/user/roles',     // 获取用户角色
    ASSIGN_ROLES: '/api/user/assign', // 分配角色
    RESET_PASSWORD: '/api/user/reset', // 重置用户密码
    GET_ROLE: '/api/user/role',  // 添加获取用户角色的接口
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
    LIST: '/api/order',    // GET    获取订单列表
    CREATE: '/api/order',  // POST   创建订单
    UPDATE: '/api/order',  // PUT    更新订单
    DELETE: '/api/order'   // DELETE 删除订单
  },

  BANNER: {
    LIST: '/api/banner',    // GET    获取轮播图列表
    CREATE: '/api/banner',  // POST   创建轮播图
    UPDATE: '/api/banner',  // PUT    更新轮播图
    DELETE: '/api/banner'   // DELETE 删除轮播图
  },


  ROLE: {
    LIST: '/api/role',  // 获取角色列表
    CREATE: '/api/role',  // 创建角色
    UPDATE: '/api/role',  // 更新角色
    DELETE: '/api/role',  // 删除角色
    GET_PERMISSIONS: '/api/role/permission',  // 获取某个角色权限
    LIST_PERMISSIONS: '/api/role/permissions',  // 获取所有权限
    ASSIGN_PERMISSIONS: '/api/role/assign'  // 分配权限
  },

  SALARY:{
    CREATE: '/api/salary',  // 分配工资
    DELETE: '/api/salary', // 根据code删除记录
    LIST:"/api/salary"   // 展示所有记录
  },

  DASHBOARD:{
    LIST:"/api/dashboard"
  },
  WS:{
    GET:"/api/ws"
  }
} 