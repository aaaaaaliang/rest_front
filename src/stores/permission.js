import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'
import { API } from '../config/api'
import { useUserStore } from './user'

export const usePermissionStore = defineStore('permission', () => {
  const permissions = ref([]) // 权限树
  const permissionMap = ref(new Map()) // 扁平化的权限映射，用于快速查找
  const userStore = useUserStore()

  // 初始化权限数据
  const initPermissions = async () => {
    try {
      const roleRes = await request(API.USER.GET_ROLE)
      if (!roleRes?.data?.roles) {
        console.error('获取角色信息失败')
        return
      }
      
      // 如果是 admin 用户，手动设置所有权限为 true
      if (userStore.userInfo?.user_code === 'admin') {
        const res = await request(API.ROLE.LIST_PERMISSIONS)
        const allPermissions = res.data.map(p => ({
          ...p,
          checked: true,
          children: p.children?.map(c => ({
            ...c,
            checked: true
          }))
        }))
        permissions.value = allPermissions
        buildPermissionMap(allPermissions)
        return
      }

      // 非 admin 用户走正常的权限判断逻辑
      const roleIds = roleRes.data.roles
      const permissionPromises = roleIds.map(roleId => 
        request(`${API.ROLE.GET_PERMISSIONS}?role_code=${roleId}`)
      )
      const permissionResults = await Promise.all(permissionPromises)
      
      const mergedPermissions = mergePermissionTrees(
        permissionResults
          .filter(res => res?.data)
          .map(res => res.data)
      )
      permissions.value = mergedPermissions
      buildPermissionMap(mergedPermissions)
    } catch (error) {
      console.error('初始化权限失败:', error)
    }
  }

  // 合并多个权限树
  const mergePermissionTrees = (trees) => {
    const result = []
    const moduleMap = new Map()

    trees.forEach(tree => {
      tree.forEach(module => {
        const existingModule = moduleMap.get(module.code)
        if (!existingModule) {
          moduleMap.set(module.code, { ...module })
        } else {
          // 合并子权限
          module.children?.forEach(child => {
            const existingChild = existingModule.children?.find(c => c.code === child.code)
            if (existingChild) {
              existingChild.checked = existingChild.checked || child.checked
            } else {
              existingModule.children = existingModule.children || []
              existingModule.children.push(child)
            }
          })
          existingModule.checked = existingModule.checked || module.checked
        }
      })
    })

    return Array.from(moduleMap.values())
  }

  // 构建扁平化的权限映射
  const buildPermissionMap = (tree) => {
    const map = new Map()
    
    const traverse = (node) => {
      map.set(node.code, {
        ...node,
        checked: node.checked || (node.children?.some(child => child.checked) ?? false)
      })
      node.children?.forEach(traverse)
    }

    tree.forEach(traverse)
    permissionMap.value = map
  }

  // 检查是否有某个权限
  const hasPermission = (code) => {
    // 增加容错处理
    if (!userStore.userInfo?.user_code) {
      return false
    }
    
    // 根据 user_code 判断是否是管理员
    if (userStore.userInfo.user_code === 'admin') {
      return true
    }
    return permissionMap.value.get(code)?.checked ?? false
  }

  // 检查是否有某个模块的权限
  const hasModulePermission = (moduleCode) => {
    // 增加容错处理
    if (!userStore.userInfo?.user_code) {
      return false
    }

    // 根据 user_code 判断是否是管理员
    if (userStore.userInfo.user_code === 'admin') {
      return true
    }

    const module = permissionMap.value.get(moduleCode)
    if (!module) return false
    
    if (module.children?.length) {
      return module.children.some(child => permissionMap.value.get(child.code)?.checked)
    }
    return module.checked
  }

  return {
    permissions,
    permissionMap,
    initPermissions,
    hasPermission,
    hasModulePermission
  }
}) 