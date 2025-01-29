import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

export function useChartTheme() {
  const themeStore = useThemeStore()
  
  const chartTheme = computed(() => ({
    backgroundColor: 'transparent',
    textStyle: {
      color: themeStore.mode === 'dark' ? '#e5eaf3' : '#303133'
    },
    title: {
      textStyle: {
        color: themeStore.mode === 'dark' ? '#e5eaf3' : '#303133'
      }
    },
    legend: {
      textStyle: {
        color: themeStore.mode === 'dark' ? '#e5eaf3' : '#303133'
      }
    },
    xAxis: {
      axisLine: {
        lineStyle: {
          color: themeStore.mode === 'dark' ? '#363637' : '#e4e7ed'
        }
      },
      axisLabel: {
        color: themeStore.mode === 'dark' ? '#a3a6ad' : '#909399'
      },
      splitLine: {
        lineStyle: {
          color: themeStore.mode === 'dark' ? '#363637' : '#e4e7ed'
        }
      }
    },
    yAxis: {
      axisLine: {
        lineStyle: {
          color: themeStore.mode === 'dark' ? '#363637' : '#e4e7ed'
        }
      },
      axisLabel: {
        color: themeStore.mode === 'dark' ? '#a3a6ad' : '#909399'
      },
      splitLine: {
        lineStyle: {
          color: themeStore.mode === 'dark' ? '#363637' : '#e4e7ed'
        }
      }
    }
  }))

  return {
    chartTheme
  }
} 