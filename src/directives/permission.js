import { useUserStore } from '../stores/user'

export const permission = {
  mounted(el, binding) {
    const userStore = useUserStore()
    const { method, path } = binding.value

    if (!userStore.hasPermission(method, path)) {
      el.parentNode?.removeChild(el)
    }
  }
} 