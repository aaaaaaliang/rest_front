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
            <el-statistic :value="statistics.hotDishes">
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

const statistics = reactive({
  todayOrders: 156,
  todayRevenue: 8234.50,
  newUsers: 24,
  hotDishes: 389
})

const revenueChartRef = ref(null)
const dishesChartRef = ref(null)

const { chartTheme } = useChartTheme()

onMounted(() => {
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
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [5600, 6780, 7800, 8900, 9200, 12000, 8234.5],
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
      data: ['红烧肉', '糖醋排骨', '水煮鱼', '宫保鸡丁', '麻婆豆腐']
    },
    series: [{
      type: 'bar',
      data: [158, 142, 125, 98, 82]
    }]
  })
  
  window.addEventListener('resize', () => {
    revenueChart.resize()
    dishesChart.resize()
  })
})
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