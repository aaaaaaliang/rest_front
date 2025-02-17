<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>今日订单</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="statistics.todayOrders">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  订单数量
                  <el-icon style="margin-left: 4px"><Tickets /></el-icon>
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>今日营收</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="statistics.todayRevenue" :precision="2">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  营业额（元）
                  <el-icon style="margin-left: 4px"><Money /></el-icon>
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>新增用户</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="statistics.newUsers">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  用户数
                  <el-icon style="margin-left: 4px"><User /></el-icon>
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>热销菜品</span>
            </div>
          </template>
          <div class="card-content">
              <el-statistic :value="statistics.hotDishes?.length || 0">

              <template #title>
                <div style="display: inline-flex; align-items: center">
                  销量
                  <el-icon style="margin-left: 4px"><Food /></el-icon>
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>营收趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="revenueChartRef" style="height: 300px"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>热销菜品排行</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="dishesChartRef" style="height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import * as echarts from 'echarts'
import { useChartTheme } from '../../hooks/useChartTheme'
import request from '../../utils/request'
import { API } from '../../config/api'

const statistics = reactive({
  todayOrders: 0,
  todayRevenue: 0,
  newUsers: 0,
  hotDishes: [],
  dailySales: {}
})

const revenueChartRef = ref(null)
const dishesChartRef = ref(null)

const { chartTheme } = useChartTheme()

// 获取后端数据
onMounted(() => {
  request(API.DASHBOARD.LIST)
      .then(response => {
        if (response.code === 200) {
          const data = response.data

          // 更新统计数据
          statistics.todayOrders = data.orders
          statistics.todayRevenue = data.total_amount
          statistics.newUsers = data.users
          statistics.hotDishes = data.products
          statistics.dailySales = data.daily_sales

          // 更新图表
          updateCharts(data.daily_sales)
        } else {
          console.error('请求数据失败', response.message)
        }
      })
      .catch(error => {
        console.error('请求错误', error)
      })
})

// 更新图表
function updateCharts(dailySales) {
  const revenueChart = echarts.init(revenueChartRef.value)
  const dishesChart = echarts.init(dishesChartRef.value)

  // 营收趋势图配置
  revenueChart.setOption({
    ...chartTheme.value,
    title: {
      text: '近7天营收趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: Object.keys(dailySales)
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: Object.values(dailySales),
      type: 'line',
      smooth: true
    }]
  })

  // 热销菜品排行图配置
  dishesChart.setOption({
    ...chartTheme.value,
    title: {
      text: '热销菜品TOP5'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },

    yAxis: {
      type: 'category',
      data: statistics.hotDishes.map(dish => dish.product_name)
    },
    series: [{
      type: 'bar',
      data: statistics.hotDishes.map(dish => dish.quantity)
    }]
  })

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    revenueChart.resize()
    dishesChart.resize()
  })
}
</script>

<style scoped>
.dashboard {
  padding: 20px;

  .el-card {
    background-color: var(--card-bg);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-content {
    text-align: center;
    color: var(--text-color);
  }

  .chart-container {
    margin-top: 20px;
    background-color: var(--card-bg);
  }
}
</style>
