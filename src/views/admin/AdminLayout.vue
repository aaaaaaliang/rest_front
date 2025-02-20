<script setup>
import { ref, computed, reactive, onMounted, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  // ... 其他图标导入保持不变 ...
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { API } from '../config/api'
import request from '../utils/request'

// ... 其他代码保持不变 ...

// 处理退出登录
const handleLogout = async () => {
  try {
    // 调用退出登录接口
    const res = await request(API.USER.LOGOUT, {
      method: 'POST'
    })

    if (res.data && res.data.code === 200) {
      // 清除用户状态
      userStore.logout()
      ElMessage.success('退出成功')
      // 跳转到登录页
      router.push('/login')
    } else {
      ElMessage.error(res.data?.message || '退出失败')
    }
  } catch (error) {
    console.error('退出失败:', error)
    // 即使接口调用失败，也清除本地状态并跳转
    userStore.logout()
    router.push('/login')
  }
}

// ... 其他代码保持不变 ...
</script> 