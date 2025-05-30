import { useUserStore } from '../stores/user'

// export const hasPermission = (code) => {
//   const userStore = useUserStore()
  
//   // 递归查找权限
//   const findPermission = (items, targetCode) => {
//     for (const item of items) {
//       if (item.code === targetCode && item.checked) {
//         return true
//       }
//       if (item.children && item.children.length > 0) {
//         if (findPermission(item.children, targetCode)) {
//           return true
//         }
//       }
//     }
//     return false
//   }

//   return findPermission(userStore.permissions, code)
// } 

export const hasPermission = (code) => {
  const userStore = useUserStore()
  
  if (userStore.roles.includes('admin')) return true  // ✅ 管理员默认放行

  // 递归查找权限
  const findPermission = (items, targetCode) => {
    for (const item of items) {
      if (item.code === targetCode && item.checked) return true
      if (item.children?.length > 0 && findPermission(item.children, targetCode)) return true
    }
    return false
  }

  return findPermission(userStore.permissions, code)
}
