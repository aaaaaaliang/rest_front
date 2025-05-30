<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
      <div class="logo-container" :class="{ 'collapsed': isCollapse }">
        <!-- <img src="/logo.png" alt="Logo" class="logo"> -->
        <span class="title">{{ isCollapse ? '系统' : '餐厅管理系统' }}</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :router="true"
        :collapse="isCollapse"
        :background-color="menuStyle.backgroundColor"
        :text-color="menuStyle.textColor"
        :active-text-color="menuStyle.activeTextColor"
      >
        <template v-for="menu in menus" :key="menu.path">
          <el-menu-item :index="menu.path" @click="handleMenuClick(menu)">
            <el-icon><component :is="menu.icon" /></el-icon>
            <span>{{ menu.name }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header>
        <div class="header-left">
          <el-icon 
            class="fold-btn"
            @click="isCollapse = !isCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
        
        <div class="header-right">
          <el-dropdown class="theme-dropdown" trigger="click">
            <el-button plain>
              <el-icon><Brush /></el-icon>
              <span>主题</span>
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

          <el-dropdown>
            <span class="el-dropdown-link">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userStore.user?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <div class="user-info">
                    <div class="info-item">
                      <span class="label">用户名：</span>
                      <span>{{ userStore.user?.username }}</span>
                    </div>
                    <div class="info-item" v-if="userStore.user?.nickname">
                      <span class="label">昵称：</span>
                      <span>{{ userStore.user.nickname }}</span>
                    </div>
                    <div class="info-item" v-if="userStore.user?.email">
                      <span class="label">邮箱：</span>
                      <span>{{ userStore.user.email }}</span>
                    </div>
                    <div class="info-item" v-if="userStore.user?.phone">
                      <span class="label">电话：</span>
                      <span>{{ userStore.user.phone }}</span>
                    </div>
                    <!-- <div class="info-item">
                      <span class="label">角色：</span>
                      <el-tag 
                        v-for="role in userStore.roles" 
                        :key="role" 
                        size="small"
                        class="role-tag"
                      >
                        {{ role }}
                      </el-tag>
                    </div> -->
                  </div>
                </el-dropdown-item>
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
        </div>
      </el-header>
      
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>

    <el-dialog
      v-model="showUserInfoDialog"
      title="个人信息"
      width="500px"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="头像">
          <el-upload
            class="avatar-upload"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="userForm.avatar" :src="userForm.avatar" class="avatar">
            <el-icon v-else class="avatar-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" disabled />
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="userForm.realName" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>

        <el-form-item label="旧密码" prop="oldPassword">
          <el-input 
            v-model="userForm.oldPassword" 
            type="password"
            show-password
            placeholder="不修改密码请留空"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="userForm.newPassword" 
            type="password"
            show-password
            placeholder="不修改密码请留空"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="userForm.confirmPassword" 
            type="password"
            show-password
            placeholder="不修改密码请留空"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUserInfoDialog = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateUserInfo">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, reactive, onMounted, markRaw, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataLine,
  UserFilled,
  User,
  Food,
  List,
  Money,
  Fold,
  Expand,
  ArrowDown,
  Service,
  Brush,
  Sunny,
  Moon,
  Monitor,
  Plus,
  SwitchButton,
  Picture,
  Menu,
  Lock,
  Setting,
  Key,
  Grid,
  Discount,
  Cpu,
  Document
  // Table,
} from '@element-plus/icons-vue'
import { useThemeStore } from '../stores/theme'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'
import request from '../utils/request'
import { API } from '../config/api'

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)

const themeStore = useThemeStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const activeMenu = computed(() => route.path)

// 计算菜单样式
const menuStyle = computed(() => {
  const isDark = themeStore.menuStyle === 'dark'
  const isSystemDark = document.documentElement.classList.contains('dark')
  
  if (isSystemDark) {
    return {
      backgroundColor: 'var(--card-bg)',
      textColor: 'var(--text-color-secondary)',
      activeTextColor: 'var(--el-color-primary)'
    }
  }
  
  return {
    backgroundColor: 'var(--card-bg)',
    textColor: 'var(--text-color)',
    activeTextColor: 'var(--el-color-primary)'
  }
})



const showUserInfoDialog = ref(false)
const userInfo = ref({
  username: '管理员',
})

const userForm = reactive({
  avatar: '',
  username: '',
  realName: '',
  phone: '',
  email: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 先声明 validatePass 函数
const validatePass = (rule, value, callback) => {
  if (userForm.newPassword && value !== userForm.newPassword) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

// 然后再声明使用它的 userRules
const userRules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  newPassword: [
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePass, trigger: 'blur' }
  ]
}

const handleLogout = async () => {
  try {
    await request(API.USER.LOGOUT) // 后端会清除 cookie
    userStore.$reset() // 清除前端状态
    router.push('/login')
  } catch (error) {
    ElMessage.error('登出失败')
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

// 监听对话框打开，初始化表单数据
watch(showUserInfoDialog, (newVal) => {
  if (newVal) {
    userForm.value = {
      username: userStore.user?.username || '',
      nickname: userStore.user?.nickname || '',
      phone: userStore.user?.phone || '',
      email: userStore.user?.email || '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  }
})

// 头像上传
const handleAvatarSuccess = (response) => {
  userForm.avatar = response.url
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 定义菜单配置，使用后端返回的模块代码
const menuConfig = [
  {
    path: '/admin/dashboard',
    name: '数据统计',
    icon: 'Odometer',
    moduleCode: 'dashboard'
  },
  {
    path: '/admin/user',
    name: '用户管理',
    icon: 'User',
    moduleCode: 'user'
  },
  {
    path: '/admin/role',
    name: '角色管理',
    icon: 'Lock',
    moduleCode: 'role'
  },
  {
    path: '/admin/permissions',
    name: '权限管理',
    icon: 'Key',
    moduleCode: 'permission'
  },
  {
    path: '/admin/categories',
    name: '分类管理',
    icon: 'Menu',
    moduleCode: 'category'
  },
  {
    path: '/admin/dishes',
    name: '菜品管理',
    icon: 'Food',
    moduleCode: 'product'
  },
  {
    path: '/admin/orders',
    name: '订单管理',
    icon: 'List',
    moduleCode: 'order'
  },
  {
    path: '/admin/tables',
    name: '餐桌管理',
    icon: 'Grid',
    moduleCode: 'table'
  },
  {
    path: '/admin/salary',
    name: '工资管理',
    icon: 'Money',
    moduleCode: 'salary'
  },
  {
    path: '/admin/customer-service',
    name: '客服管理',
    icon: 'Service',
    moduleCode: 'ws'
  },
  {
    path: '/admin/banners',
    name: '图片管理',
    icon: 'Picture',
    moduleCode: 'banner'
  },
  {
    path: '/admin/coupons',
    name: '优惠券管理',
    icon: 'Discount',
    moduleCode: 'coupon'
  },
  {
    path: '/admin/ai-model',
    name: 'AI管理',
    icon: 'Cpu',
    moduleCode: 'ai'
  },
  {
    path: '/admin/logs',
    name: '日志管理',
    icon: 'Document',
    moduleCode: 'log'
  }
]

// 过滤有权限的菜单
// const menus = computed(() => {
//   if (!userStore.permissions) return []
  
//   return menuConfig.filter(menu => {
//     const module = userStore.permissions.find(
//       m => m.code === menu.moduleCode
//     )
//     return module?.checked
//   })
// })

const menus = computed(() => {
  if (!userStore.permissions) return []

  // ✅ 如果是管理员，直接返回所有菜单
  if (userStore.roles.includes('admin')) {
    return menuConfig
  }

  return menuConfig.filter(menu => {
    const module = userStore.permissions.find(
      m => m.code === menu.moduleCode
    )
    return module?.checked
  })
})


// 处理菜单点击
const handleMenuClick = (menu) => {
  if (!menu || !menu.path) return
  router.push(menu.path)
}

// 在组件挂载时初始化权限
onMounted(() => {
  // 暂时注释掉权限初始化
  // await permissionStore.initPermissions()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background-color: var(--bg-color);
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background-color: var(--bg-color-overlay);
  transition: all 0.3s;
  overflow: hidden;
  white-space: nowrap;
}

.logo-container.collapsed {
  padding: 0 20px;
}

.logo {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.title {
  color: var(--text-color);
  font-size: 16px;
  font-weight: bold;
}

.el-menu-vertical {
  height: calc(100% - 60px);
  border-right: none;
  transition: width 0.3s;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
}

.el-menu--collapse {
  width: 64px;
}

.el-header {
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.fold-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.username {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.el-main {
  background-color: var(--bg-color);
  padding: 20px;
}

.theme-dropdown {
  margin-right: 20px;
}

.avatar-upload {
  width: 100px;
  height: 100px;
  border: 1px dashed var(--border-color);
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 28px;
  color: var(--text-color-secondary);
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.aside {
  background-color: var(--card-bg);
  border-right: 1px solid var(--border-color);
  transition: width 0.3s;
}

.el-menu {
  border-right: none;
  transition: background-color 0.3s, border-color 0.3s;
}

.el-menu-item {
  transition: color 0.3s, background-color 0.3s;
  
  &:hover {
    background-color: var(--hover-bg) !important;
  }
  
  &.is-active {
    background-color: var(--hover-bg) !important;
  }
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
  color: var(--el-text-color-regular);
}

.edit-profile:hover {
  color: var(--el-color-primary);
}
</style> 