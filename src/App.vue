<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from './stores/theme'
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/user'
import { UserFilled, Avatar } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const themeStore = useThemeStore()
const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  // 初始化主题
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    try {
      const themeConfig = JSON.parse(savedTheme)
      themeStore.setTheme(themeConfig)
    } catch (error) {
      console.error('解析主题配置失败:', error)
      themeStore.applyTheme()
    }
  } else {
    themeStore.applyTheme()
  }
  
  // 设置主题监听
  themeStore.setupThemeListener()
})

// 处理下拉菜单命令
const handleCommand = async (command) => {
  if (command === 'logout') {
    await userStore.logout()
    ElMessage.success('退出登录成功')
    router.push('/login')
  }
}

// 获取角色名称
const getRoleName = (roleCode) => {
  const roleMap = {
    'admin': '管理员',
    'user': '普通用户',
    // 可以添加更多角色映射
  }
  return roleMap[roleCode] || roleCode
}

const handleLogout = async () => {
  await userStore.logout()
  ElMessage.success('退出登录成功')
  router.push('/login')
}
</script>

<template>
  <div class="app-container">
  

    <!-- 主内容区 -->
    <router-view></router-view>
  </div>
</template>

<style>
/* 全局主题变量 */
:root {
  /* 浅色主题默认变量 */
  --bg-color: #f0f2f5;
  --bg-color-overlay: #ffffff;
  --text-color: #303133;
  --text-color-secondary: #909399;
  --border-color: #e4e7ed;
  --card-bg: #ffffff;
  --hover-bg: #f5f7fa;
  
  /* 图表主题变量 */
  --chart-bg: var(--card-bg);
  --chart-text: var(--text-color);
  --chart-axis: var(--text-color-secondary);
  --chart-grid: var(--border-color);
}

/* 深色主题变量 */
html.dark {
  --bg-color: #141414;
  --bg-color-overlay: #1d1e1f;
  --text-color: #e5eaf3;
  --text-color-secondary: #a3a6ad;
  --border-color: #363637;
  --card-bg: #1d1e1f;
  --hover-bg: #262727;

  /* Element Plus 深色主题变量 */
  --el-bg-color: var(--bg-color);
  --el-bg-color-overlay: var(--bg-color-overlay);
  --el-text-color-primary: var(--text-color);
  --el-text-color-regular: var(--text-color);
  --el-text-color-secondary: var(--text-color-secondary);
  --el-border-color: var(--border-color);
  --el-border-color-light: var(--border-color);
  --el-fill-color-blank: var(--card-bg);
  
  /* 其他 Element Plus 变量... */
  --el-mask-color: rgba(0, 0, 0, 0.8);
  --el-mask-color-extra-light: rgba(0, 0, 0, 0.3);
  
  /* 图表深色主题变量 */
  --chart-bg: var(--card-bg);
  --chart-text: var(--text-color);
  --chart-axis: var(--text-color-secondary);
  --chart-grid: var(--border-color);

  /* 卡片深色主题 */
  --el-card-bg-color: var(--el-bg-color);
}

/* 全局基础样式 */
body {
  background-color: var(--bg-color);
  color: var(--text-color);
}

/* 卡片样式 */
.el-card {
  background-color: var(--card-bg);
  border-color: var(--border-color);
}

/* 表格样式 */
.el-table {
  --el-table-bg-color: var(--card-bg);
  --el-table-tr-bg-color: var(--card-bg);
  --el-table-header-bg-color: var(--bg-color);
  --el-table-border-color: var(--border-color);
}

.el-table th,
.el-table td {
  background-color: var(--card-bg);
}

/* 弹窗样式 */
.el-dialog {
  background-color: var(--card-bg);
}

/* 下拉菜单样式 */
.el-dropdown-menu {
  background-color: var(--card-bg);
  border-color: var(--border-color);
}

.el-dropdown-menu__item:hover {
  background-color: var(--hover-bg);
}

/* 表单样式 */
.el-input__inner,
.el-textarea__inner {
  background-color: var(--bg-color-overlay);
  border-color: var(--border-color);
  color: var(--text-color);
}

/* 按钮样式 */
.el-button--default {
  background-color: var(--card-bg);
  border-color: var(--border-color);
  color: var(--text-color);
}

/* 分页样式 */
.el-pagination {
  --el-pagination-bg-color: var(--card-bg);
  --el-pagination-hover-color: var(--el-color-primary);
}

/* 菜单样式 */
.el-menu {
  border-color: var(--border-color);
}

/* 标签样式 */
.el-tag {
  background-color: var(--hover-bg);
}

/* 过渡动画 */
* {
  transition: background-color 0.3s, border-color 0.3s, color 0.3s;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;

    img {
      height: 32px;
    }

    span {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.3s;

    &:hover {
      background: var(--el-fill-color-light);
    }

    .username {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }
}

.role-info {
  padding: 4px 0;
  min-width: 120px;

  .title {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  .role-tag {
    margin-right: 4px;
    margin-bottom: 4px;

    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
