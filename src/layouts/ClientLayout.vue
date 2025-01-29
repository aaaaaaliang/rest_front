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
        
        <template v-if="isLoggedIn">
          <el-dropdown>
            <span class="user-dropdown">
              {{ username }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <router-link to="/profile">个人信息</router-link>
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout">
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
import { Sunny, Moon, Monitor, Brush } from '@element-plus/icons-vue'
import CustomerService from '../components/CustomerService.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const themeStore = useThemeStore()

const activeMenu = computed(() => route.path)
const cartCount = computed(() => cartStore.totalCount)

// 模拟用户状态
const isLoggedIn = computed(() => localStorage.getItem('token'))
const username = ref('用户名')

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

// 切换主题
const switchTheme = (mode) => {
  themeStore.setTheme({
    ...themeStore.$state,
    mode
  })
  localStorage.setItem('theme', JSON.stringify(themeStore.$state))
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
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
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
</style> 