import axios from 'axios'
import {useUserStore} from '../stores/user'

// // 白名单接口列表
// const whiteList = [
//   { method: 'GET', path: '/api/user/captcha' },
//   { method: 'POST', path: '/api/user/login' },
//   { method: 'POST', path: '/api/user/register' },
//   { method: 'GET', path: '/api/user/role' },
//   { method: 'GET', path: '/api/user/oauth/github/login' },
//   { method: 'GET', path: '/api/user/oauth/callback' },
//   { method: 'GET', path: '/api/banner' },
//   { method: 'GET', path: '/api/cart' },
//   { method: 'POST', path: '/api/cart' },
//   { method: 'GET', path: '/api/category' },
//   { method: 'GET', path: '/api/product' },
//   { method: 'GET', path: '/api/role/public' },
//   { method: 'GET', path: '/api/role/permission' },
//   { method: 'POST', path: '/api/order' },
//   { method: 'GET', path: '/api/order' },
//   { method: 'PUT', path: '/api/order' },
//   { method: 'DELETE', path: '/api/order' },
//   { method: 'POST', path: '/api/cart/delete' },
// ]

// 创建一个全局的路由实例引用
let router = null

// 添加设置路由实例的方法
export const setRouter = (routerInstance) => {
  router = routerInstance
}

// 创建 axios 实例
const axiosInstance = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL,
  baseURL: "http://localhost:8888",
  timeout: 5000,
  withCredentials: true
})

// 响应拦截器
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const requestHandler = async (url, options = {}) => {
  console.log('Received options:', options);  // 打印 options
  try {
    const method = (options.method || 'GET').toUpperCase();
    const config = {
      url,
      method,
      headers: options.headers || {}
    };

    // 处理请求数据
    if (options.data) {
      if (method === 'GET') {
        // GET 请求转换为查询参数
        config.params = options.data;
        console.log("1", config.params, "1.1", options.data);
      } else {
        // JSON 数据
        config.headers['Content-Type'] = 'application/json';
        config.data = options.data;
        console.log("2", config.params, options.data);
      }
    }

    console.log('Request config:', config);
    return await axiosInstance(config);
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};


// const requestHandler = async (url, options = {}) => {
//   try {
//     const method = (options.method || 'GET').toUpperCase()
//     const config = {
//       url,
//       method,
//       headers: options.headers || {}
//     }
//
//     // // 处理请求数据
//     // if (options.data) {
//     //   if (method === 'GET') {
//     //     // GET 请求转换为查询参数
//     //     config.params = options.data
//     //   } else if (options.data instanceof FormData) {
//     //     // FormData 不设置 Content-Type
//     //     config.data = options.data
//     //   } else {
//     //     // JSON 数据
//     //     config.headers['Content-Type'] = 'application/json'
//     //     config.data = options.data
//     //   }
//     // }
//     console.log("开始11",config)
//
//     // 处理请求数据
//     if (options.data) {
//       if (method === 'GET') {
//         // GET 请求转换为查询参数
//         config.params = options.data
//         console.log("1",config.params,"1.1",options.data)
//       } else {
//         // JSON 数据
//         config.headers['Content-Type'] = 'application/json'
//         config.data = options.data
//         console.log("2",config.params,options.data)
//       }
//     }
//
//     console.log('Request config:', config)
//     return await axiosInstance(config)
//   } catch (error) {
//     console.error('Request failed:', error)
//     throw error
//   }
// }

export default requestHandler