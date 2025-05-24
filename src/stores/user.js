import { defineStore } from 'pinia'
import request from '../utils/request'
import { API } from '../config/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    roles: [],
    permissions: [],
    crudPermissions: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.roles.includes('admin')
  },

  actions: {
    setPublicPermissions(permissions) {
      this.publicPermissions = permissions || []
    },

    // 登录
    async login(loginData) {
      try {
        const res = await request(API.USER.LOGIN, {
          method: 'POST',
          data: loginData
        })
        
        if (res.data && res.data.code === 200) {
          // 获取用户角色和权限
          await this.fetchUserRole()
          return res
        }
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },

    // 获取用户角色和权限
    async fetchUserRole() {
      try {
        // 1. 获取用户角色
        const roleRes = await request('/api/user/role')
        if (roleRes.data && roleRes.data.code === 200) {
          const { user, roles } = roleRes.data.data
          this.user = user
          this.roles = roles
    
          const allPermissions = []
    
          // 2. 遍历每个角色获取权限
          for (const roleCode of roles) {
            const permissionsRes = await request(`/api/role/permission?role_code=${roleCode}`)
            if (permissionsRes.data && permissionsRes.data.code === 200) {
              allPermissions.push(...permissionsRes.data.data)
            }
          }
    
          // 3. 去重合并（根据 code 去重）
          const permissionMap = new Map()
          allPermissions.forEach(p => {
            if (!permissionMap.has(p.code)) {
              permissionMap.set(p.code, p)
            }
          })

          console.log("-----------------------------permissionMap",permissionMap)
    
          const mergedPermissions = Array.from(permissionMap.values())
    
          // 4. 保存权限
          this.permissions = mergedPermissions
          this.crudPermissions = mergedPermissions.filter(p => p.method && p.path)
        }
      } catch (error) {
        console.error('获取用户角色和权限失败:', error)
        throw error
      }
    },
    

    // // 检查是否有 CRUD 权限
    // hasPermission(method, path) {
      
    //   // 递归检查权限
    //   const checkPermission = (items) => {
    //     for (const item of items) {
    //       // 如果找到匹配的权限并且是启用的
    //       if (item.method === method && item.path === path && item.checked) {
    //         return true
    //       }
    //       // 如果有子权限，递归检查
    //       if (item.children && item.children.length > 0) {
    //         if (checkPermission(item.children)) {
    //           return true
    //         }
    //       }
    //     }
    //     return false
    //   }

    //   return checkPermission(this.permissions)
    // },
    // 检查是否有 CRUD 权限
hasPermission(method, path) {
  // ✅ 管理员默认拥有所有权限
  if (this.roles.includes('admin')) return true

  // 递归检查权限
  const checkPermission = (items) => {
    for (const item of items) {
      if (item.method === method && item.path === path && item.checked) return true
      if (item.children?.length > 0 && checkPermission(item.children)) return true
    }
    return false
  }

  return checkPermission(this.permissions)
},


    // 检查模块是否启用
    // hasModule(moduleCode) {
    //   return this.permissions?.some(
    //     m => m.code === moduleCode && m.checked
    //   ) || false
    // },
    // 管理员默认拥有全部模块权限
hasModule(moduleCode) {
  return this.isAdmin || this.permissions?.some(
    m => m.code === moduleCode && m.checked
  ) || false
},


    // 更新用户信息
    async updateUserInfo(userData) {
      try {
        const res = await request('/api/user', {
          method: 'PUT',
          data: {
            code: this.user.code,
            ...userData
          }
        })
        
        if (res.data && res.data.code === 200) {
          // 更新成功后刷新用户信息
          await this.fetchUserRole()
          return res
        }
      } catch (error) {
        console.error('更新用户信息失败:', error)
        throw error
      }
    },

    // 登出
    async logout() {
      this.user = null
      this.roles = []
      this.permissions = []
      this.crudPermissions = []
    }
  }
}) 