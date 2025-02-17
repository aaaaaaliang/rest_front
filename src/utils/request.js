import { API } from '../config/api'
import axios from 'axios'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  baseURL: 'http://localhost:8888/api',
  timeout: 5000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    const userPermissions = userStore.permissions

    // 检查用户是否有权限访问该 API
    const hasAccess = userPermissions.some(p => 
      p.method === config.method.toUpperCase() && p.path === config.url
    )

    if (!hasAccess) {
      ElMessage.error('无权限访问该接口')
      return Promise.reject(new Error('无权限访问'))
    }

    return config
  },
  error => Promise.reject(error)
)

// 创建请求实例
const request = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include', // 允许发送 cookie
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  }

  // 如果是 DELETE 请求，直接使用 query 参数
  if (options.method === 'DELETE') {
    // 不需要处理 body，因为已经在 URL 中包含了参数
    delete options.body
  }

  try {
    const response = await fetch(API.BASE_URL + url, finalOptions)
    // 对于 204 状态码，直接返回成功
    if (response.status === 204) {
      return { code: 200, message: '操作成功' }
    }
    const data = await response.json()
    if (data.code === 200) {
      return data
    } else {
      throw new Error(data.message || '请求失败')
    }
  } catch (error) {
    throw error
  }
}

export default service 