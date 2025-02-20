import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'
import { API } from '../config/api'
import { useUserStore } from './user'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    permissions: [], // 存储权限树
    permissionList: [], // 扁平化的权限列表，用于快速查找
  }),
  
  actions: {
    setPermissions(permissionTree) {
      this.permissions = permissionTree
      this.permissionList = this.flattenPermissions(permissionTree)
    },
    
    // 将权限树扁平化，方便查找
    flattenPermissions(tree) {
      const list = []
      const flatten = (items) => {
        items.forEach(item => {
          if (item.checked) {
            if (item.method && item.path) {
              list.push({
                method: item.method,
                path: item.path,
                code: item.code
              })
            }
            if (item.children) {
              flatten(item.children)
            }
          }
        })
      }
      flatten(tree)
      return list
    },
    
    // 检查是否有某个权限
    hasPermission(method, path) {
      return this.permissionList.some(
        p => p.method === method && p.path === path
      )
    }
  }
}) 