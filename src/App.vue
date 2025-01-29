<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from './stores/theme'
import HelloWorld from './components/HelloWorld.vue'

const themeStore = useThemeStore()

onMounted(() => {
  // 初始化主题
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    themeStore.setTheme(JSON.parse(savedTheme))
  } else {
    themeStore.applyTheme()
  }
  
  // 设置主题监听
  themeStore.setupThemeListener()
})
</script>

<template>
  <router-view></router-view>
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
</style>
