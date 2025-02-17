import { useUserStore } from '../stores/user'

export const hasPermission = (code) => {
  const userStore = useUserStore()
  return userStore.permissions.some(p => p.code === code)
} 