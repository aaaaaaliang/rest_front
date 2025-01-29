import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: 'light',
    primaryColor: '#409EFF',
    menuStyle: 'dark'
  }),

  actions: {
    setTheme(config) {
      this.mode = config.mode
      this.primaryColor = config.primaryColor
      this.menuStyle = config.menuStyle
      
      // 应用主题
      this.applyTheme()
    },

    applyTheme() {
      const html = document.documentElement
      
      // 设置主题模式
      if (this.mode === 'auto') {
        // 跟随系统
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        html.classList.toggle('dark', prefersDark)
      } else {
        html.classList.toggle('dark', this.mode === 'dark')
      }

      // 设置主题色
      const style = document.createElement('style')
      style.innerHTML = `
        :root {
          --el-color-primary: ${this.primaryColor};
          --el-color-primary-light-3: ${this.primaryColor}4D;
          --el-color-primary-light-5: ${this.primaryColor}80;
          --el-color-primary-light-7: ${this.primaryColor}B3;
          --el-color-primary-light-8: ${this.primaryColor}CC;
          --el-color-primary-light-9: ${this.primaryColor}E6;
          --el-color-primary-dark-2: ${this.darkenColor(this.primaryColor, 0.2)};
        }
      `
      document.head.appendChild(style)
    },

    // 辅助方法：加深颜色
    darkenColor(hex, factor) {
      let r = parseInt(hex.slice(1, 3), 16)
      let g = parseInt(hex.slice(3, 5), 16)
      let b = parseInt(hex.slice(5, 7), 16)
      
      r = Math.floor(r * (1 - factor))
      g = Math.floor(g * (1 - factor))
      b = Math.floor(b * (1 - factor))
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    },

    setupThemeListener() {
      // 监听系统主题变化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        if (this.mode === 'auto') {
          document.documentElement.classList.toggle('dark', e.matches)
        }
      })
    }
  }
}) 