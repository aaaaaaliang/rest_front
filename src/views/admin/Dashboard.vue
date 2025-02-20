<template>
  <div class="dashboard" v-if="userStore.hasModule('dashboard')">
    <!-- 顶部数据卡片 -->
    <el-row :gutter="20">
      <!-- 今日订单 -->
      <el-col :span="6" v-if="userStore.hasPermission('GET', '/api/order')">
        <el-card class="data-card orders-card" shadow="hover">
          <div class="card-body">
            <div class="card-icon">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">今日订单</div>
              <div class="card-value">
                <span class="number">{{ statistics.todayOrders }}</span>
                <span class="unit">笔</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 今日营收 -->
      <el-col :span="6" v-if="userStore.hasPermission('GET', '/api/order')">
        <el-card class="data-card revenue-card" shadow="hover">
          <div class="card-body">
            <div class="card-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">今日营收</div>
              <div class="card-value">
                <span class="currency">¥</span>
                <span class="number">{{ statistics.todayRevenue.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 新增用户 -->
      <el-col :span="6" v-if="userStore.hasPermission('GET', '/api/user/list')">
        <el-card class="data-card users-card" shadow="hover">
          <div class="card-body">
            <div class="card-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">新增用户</div>
              <div class="card-value">
                <span class="number">{{ statistics.newUsers }}</span>
                <span class="unit">人</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 热销菜品 -->
      <el-col :span="6" v-if="userStore.hasPermission('GET', '/api/product')">
        <el-card class="data-card dishes-card" shadow="hover">
          <div class="card-body">
            <div class="card-icon">
              <el-icon><Food /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">热销菜品</div>
              <div class="card-value">
                <span class="number">{{ statistics.hotDishes.length }}</span>
                <span class="unit">种</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 营收趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>七日营收趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="revenueChartRef"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 热销排行图 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>热销排行榜</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="dishesChartRef"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick } from 'vue'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'
import { API } from '../../config/api'
import * as echarts from 'echarts'

const userStore = useUserStore()
const revenueChartRef = ref(null)
const dishesChartRef = ref(null)

const statistics = reactive({
  todayOrders: 0,
  todayRevenue: 0,
  newUsers: 0,
  hotDishes: [],
  dailySales: {}
})

const topThreeDishes = computed(() => {
  return statistics.hotDishes.slice(0, 3)
})

// 初始化图表
const initCharts = () => {
  if (!revenueChartRef.value || !dishesChartRef.value) return

  // 营收趋势图
  const revenueChart = echarts.init(revenueChartRef.value)
  revenueChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>营收: ¥{c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Object.keys(statistics.dailySales).map(date => date.slice(5)), // 只显示月-日
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      data: Object.values(statistics.dailySales),
      type: 'line',
      smooth: true,
      areaStyle: {
        opacity: 0.3
      },
      itemStyle: {
        color: '#67c23a'
      },
      lineStyle: {
        width: 3
      }
    }]
  })

  // 热销排行图
  const dishesChart = echarts.init(dishesChartRef.value)
  dishesChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: statistics.hotDishes.map(dish => dish.product_name).reverse()
    },
    series: [{
      type: 'bar',
      data: statistics.hotDishes.map(dish => dish.quantity).reverse(),
      itemStyle: {
        color: '#409eff'
      },
      label: {
        show: true,
        position: 'right',
        formatter: '{c}份'
      }
    }]
  })

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    revenueChart.resize()
    dishesChart.resize()
  })
}

onMounted(async () => {
  try {
    const response = await request(API.DASHBOARD.LIST)
    if (response.data && response.data.code === 200) {
      const data = response.data.data
      statistics.todayOrders = data.orders
      statistics.todayRevenue = data.total_amount
      statistics.newUsers = data.users
      statistics.hotDishes = data.products
      statistics.dailySales = data.daily_sales
      
      // 等待 DOM 更新后初始化图表
      nextTick(() => {
        initCharts()
      })
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  }
})
</script>

<style scoped lang="scss">
.dashboard {
  padding: 20px;

  .data-card {
    height: 120px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-5px);
    }

    .card-body {
      height: 100%;
      padding: 20px;
      display: flex;
      align-items: center;
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      
      .el-icon {
        font-size: 24px;
        color: #fff;
      }
    }

    .card-content {
      flex: 1;

      .card-title {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
      }

      .card-value {
        display: flex;
        align-items: baseline;

        .number {
          font-size: 28px;
          font-weight: bold;
          font-family: DIN;
          line-height: 1;
        }

        .currency, .unit {
          font-size: 14px;
          margin: 0 4px;
          color: var(--el-text-color-regular);
        }
      }
    }
  }

  // 卡片样式
  .orders-card .card-icon {
    background-color: #409eff;
  }
  .orders-card .card-value .number {
    color: #409eff;
  }

  .revenue-card .card-icon {
    background-color: #67c23a;
  }
  .revenue-card .card-value .number {
    color: #67c23a;
  }

  .users-card .card-icon {
    background-color: #f7ba2a;
  }
  .users-card .card-value .number {
    color: #f7ba2a;
  }

  .dishes-card .card-icon {
    background-color: #e6a23c;
  }
  .dishes-card .card-value .number {
    color: #e6a23c;
  }

  // 图表相关样式
  .chart-container {
    height: 400px;
    padding: 20px;

    > div {
      width: 100%;
      height: 100%;
    }
  }

  // 确保卡片内容区域有足够的高度
  :deep(.el-card__body) {
    height: calc(100% - 60px);
    padding: 0;
  }
}
</style>
