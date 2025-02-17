import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', {
  state: () => ({
    username: '',    // 初始值为空字符串
    user_code: '',   // 初始值为空字符串
    roles: [],        // 初始值为空数组
    permissions: []   // 存储权限
  }),
  actions: {
    setUserInfo(info) {
      this.username = info.username
      this.user_code = info.user_code
      this.roles = info.roles
    },
    setPermissions(permissions) {
      this.permissions = permissions
    },
    isAdmin() {
      return this.user_code === 'admin' // 根据 user_code 判断
    }
  }
}) 