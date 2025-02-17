import { usePermissionStore } from '../stores/permission'

export const vPermission = {
  mounted(el, binding) {
    const permissionStore = usePermissionStore()
    const { value } = binding

    if (value && !permissionStore.hasPermission(value)) {
      el.parentNode?.removeChild(el)
    }
  }
} 