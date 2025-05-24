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
        class="nav-menu"
        :ellipsis="false"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/menu">点餐</el-menu-item>
        <el-menu-item index="/orders">我的订单</el-menu-item>
        <el-menu-item index="/coupon-center">领券中心</el-menu-item>
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
                <el-dropdown-item @click="showUserInfoDialog = true">
                  <div class="edit-profile">
                    <el-icon><User /></el-icon>
                    <span>编辑资料</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item @click="router.push('/coupon-center')">
                  <div class="edit-profile">
                    <el-icon><Discount /></el-icon>
                    <span>我的优惠券</span>
                  </div>
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
  User,
  Discount
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
  background-color: var(--el-bg-color-page);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 72px;
  background-color: var(--el-bg-color);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .logo {
    font-size: 20px;
    max-width: 150px;
    flex-shrink: 0;
  }

  :deep(.nav-menu) {
    border: none;
    background: transparent;
    margin: 0 48px;
    display: flex;
    align-items: center;
    min-width: 300px;
    
    .el-menu-item {
      font-size: 16px;
      height: 72px;
      line-height: 72px;
      padding: 0 24px;
      font-weight: 500;
      position: relative;
      overflow: hidden;
      white-space: nowrap;
      flex-shrink: 0;

      &::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 3px;
        background: linear-gradient(45deg, var(--el-color-primary), var(--el-color-success));
        transition: width 0.3s ease;
        border-radius: 3px;
      }

      &:hover, &.is-active {
        color: var(--el-color-primary);
        background: transparent;
        
        &::before {
          width: 24px;
        }
      }
    }
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 32px;
    flex-shrink: 0;

    .cart-link {
      position: relative;
      font-size: 24px;
      color: var(--el-text-color-regular);
      text-decoration: none;
      transition: all 0.3s ease;
      padding: 8px;
      border-radius: 12px;

      &:hover {
        color: var(--el-color-primary);
        transform: translateY(-2px);
      }

      :deep(.el-badge__content) {
        background: linear-gradient(45deg, var(--el-color-danger), #ff9f43);
        border: none;
        padding: 0 6px;
        height: 18px;
        line-height: 18px;
        border-radius: 9px;
      }
    }

    .theme-dropdown {
      .el-button {
        padding: 8px;
        border-radius: 12px;
        transition: all 0.3s ease;
        border: 1px solid var(--el-border-color);

        &:hover {
          border-color: var(--el-color-primary);
          color: var(--el-color-primary);
          transform: translateY(-2px);
        }
      }
    }

    .user-dropdown {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 6px 16px;
      border-radius: 12px;
      transition: all 0.3s ease;
      border: 1px solid var(--el-border-color);

      &:hover {
        border-color: var(--el-color-primary);
        transform: translateY(-2px);

        .el-avatar {
          border-color: var(--el-color-primary);
        }

        span {
          color: var(--el-color-primary);
        }
      }

      .el-avatar {
        border: 2px solid var(--el-border-color);
        transition: all 0.3s ease;
      }

      span {
        font-size: 15px;
        font-weight: 500;
        color: var(--el-text-color-regular);
        transition: all 0.3s ease;
      }
    }

    .el-button {
      padding: 10px 24px;
      font-weight: 500;
      border-radius: 12px;
      transition: all 0.3s ease;
      background: linear-gradient(45deg, var(--el-color-primary), var(--el-color-success));
      border: none;
      color: white;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
        opacity: 0.9;
      }
    }
  }
}

:deep(.el-dropdown-menu) {
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--el-border-color-lighter);

  .el-dropdown-menu__item {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    margin: 2px 0;

    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      transform: translateX(4px);
    }

    a {
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: 100%;
    }
  }
}

:deep(.el-dropdown-menu__item a) {
  text-decoration: none !important;
  color: inherit !important;
}

.el-main {
  flex: 1;
  padding: 0;
  background-color: var(--el-bg-color-page);
}

.footer {
  margin-top: auto;
  text-align: center;
  background-color: var(--el-bg-color);
  padding: 32px 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
  letter-spacing: 0.5px;
}
</style> 