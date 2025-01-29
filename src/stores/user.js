import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: null
  }),

  actions: {
    setUserInfo(info) {
      this.userInfo = info
    },

    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    async getUserInfo() {
      try {
        // TODO: 调用获取用户信息API
        const response = await fetch('/api/user/info')
        const data = await response.json()
        this.setUserInfo(data)
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },

    logout() {
      this.userInfo = null
      this.token = null
      localStorage.removeItem('token')
    }
  }
}) 