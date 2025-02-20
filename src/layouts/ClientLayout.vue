<template>
  <div class="client-layout">
    <el-header class="header">
      <div class="logo">
        餐厅点餐系统
      </div>
      <el-menu
        mode="horizontal"
        :router="true"
        :default-active="activeMenu"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/menu">点餐</el-menu-item>
        <el-menu-item index="/orders">我的订单</el-menu-item>
      </el-menu>
      <div class="user-actions">
        <router-link to="/cart" class="cart-link">
          <el-badge :value="cartCount" class="cart-badge">
            <el-icon><ShoppingCart /></el-icon>
          </el-badge>
        </router-link>
        
        <el-dropdown class="theme-dropdown" trigger="click">
          <el-button plain>
            <el-icon><Brush /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="switchTheme('light')">
                <el-icon><Sunny /></el-icon>
                <span>浅色模式</span>
              </el-dropdown-item>
              <el-dropdown-item @click="switchTheme('dark')">
                <el-icon><Moon /></el-icon>
                <span>深色模式</span>
              </el-dropdown-item>
              <el-dropdown-item @click="switchTheme('auto')">
                <el-icon><Monitor /></el-icon>
                <span>跟随系统</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        
        <template v-if="userStore.user">
          <el-dropdown>
            <span class="user-dropdown">
              <el-avatar :size="32" :icon="UserFilled" />
              <span>{{ userStore.user.username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <router-link to="/profile" class="edit-profile">
                    <el-icon><User /></el-icon>
                    <span>编辑资料</span>
                  </router-link>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login">
            <el-button type="primary">登录</el-button>
          </router-link>
        </template>
      </div>
    </el-header>
    
    <el-main>
      <router-view></router-view>
    </el-main>
    
    <el-footer class="footer">
      <p>© 2024 餐厅点餐系统 版权所有</p>
    </el-footer>
    <customer-service />

   
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useThemeStore } from '../stores/theme'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { 
  Sunny, 
  Moon, 
  Monitor, 
  Brush, 
  ShoppingCart,
  UserFilled,
  User
} from '@element-plus/icons-vue'
import CustomerService from '../components/CustomerService.vue'
import request from '../utils/request'
import { API } from '../config/api'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const themeStore = useThemeStore()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const cartCount = computed(() => cartStore.count)

const showUserInfoDialog = ref(false)
const userFormRef = ref(null)
const userForm = ref({
  username: '',
  nickname: '',
  phone: '',
  email: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const userRules = {
  nickname: [
    { max: 20, message: '昵称长度不能超过20个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  newPassword: [
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    {
      validator: (rule, value, callback) => {
        if (userForm.value.newPassword && value !== userForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleLogout = async () => {
  try {
    // 调用退出登录接口
    const res = await request(API.USER.LOGOUT)

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

// 切换主题
const switchTheme = (mode) => {
  themeStore.setTheme({
    ...themeStore.$state,
    mode
  })
  localStorage.setItem('theme', JSON.stringify(themeStore.$state))
}

// 更新用户信息
const handleUpdateUserInfo = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    const updateData = {
      nickname: userForm.value.nickname,
      phone: userForm.value.phone,
      email: userForm.value.email
    }

    if (userForm.value.newPassword) {
      updateData.old_password = userForm.value.oldPassword
      updateData.new_password = userForm.value.newPassword
    }

    await userStore.updateUserInfo(updateData)
    ElMessage.success('更新成功')
    showUserInfoDialog.value = false
  } catch (error) {
    console.error('更新失败:', error)
    ElMessage.error(error.message || '更新失败')
  }
}
</script>

<style scoped>
.client-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: var(--card-bg);
  border-color: var(--border-color);
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.cart-link {
  font-size: 20px;
  color: #333;
  text-decoration: none;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.footer {
  margin-top: auto;
  text-align: center;
  background-color: var(--card-bg);
  padding: 20px 0;
  color: var(--text-color-secondary);
}

.theme-dropdown {
  margin-right: 20px;
}

.el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
  padding: 8px;
  min-width: 200px;
}

.info-item {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  color: var(--el-text-color-secondary);
  width: 60px;
}

.role-tag {
  margin-right: 4px;
}

.edit-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--el-text-color-regular);
}

.edit-profile:hover {
  color: var(--el-color-primary);
}
</style> 