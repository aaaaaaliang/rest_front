<template>
  <div class="log-management">
    <!-- 搜索表单 -->
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>日志管理</span>
          </div>
          <div class="header-right">
            <div class="refresh-info">
              <el-icon :class="{ 'is-spinning': isRefreshing }"><Refresh /></el-icon>
              <span>{{ refreshText }}</span>
            </div>
            <el-button type="primary" :icon="Refresh" circle @click="handleManualRefresh" />
          </div>
        </div>
      </template>
      <el-form :model="searchForm" inline>
        <el-form-item label="用户编码">
          <el-input v-model="searchForm.user_code" placeholder="请输入用户编码" clearable />
        </el-form-item>
        <el-form-item label="用户名称">
          <el-input v-model="searchForm.user_name" placeholder="请输入用户名称" clearable />
        </el-form-item>
        <el-form-item label="用户角色">
          <el-select v-model="searchForm.user_role" placeholder="请选择用户角色" clearable>
            <el-option
              v-for="role in roleList"
              :key="role.code"
              :label="role.name"
              :value="role.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日志类型">
          <el-select v-model="searchForm.log_category" placeholder="请选择日志类型" clearable>
            <el-option label="系统" value="system" />
            <el-option label="操作" value="operation" />
            <el-option label="错误" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务类型">
          <el-input v-model="searchForm.type" placeholder="请输入业务类型" clearable />
        </el-form-item>
        <el-form-item label="日志级别">
          <el-select v-model="searchForm.level" placeholder="请选择日志级别" clearable>
            <el-option label="INFO" value="info" />
            <el-option label="WARN" value="warn" />
            <el-option label="ERROR" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="日志内容">
          <el-input v-model="searchForm.message" placeholder="请输入日志内容" clearable />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss+08:00"
            @change="handleTimeRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="log-list-card">
      <el-table
        v-loading="loading"
        :data="logList"
        style="width: 100%"
        border
      >
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="fields.user_code" label="用户编码" width="120" />
        <el-table-column prop="fields.user_name" label="用户名称" width="120" />
        <el-table-column prop="fields.user_role" label="用户角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.fields.user_role === 'admin' ? 'danger' : 'info'">
              {{ row.fields.user_role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="业务类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="log_category" label="日志类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getLogCategoryTag(row.log_category)">
              {{ getLogCategoryLabel(row.log_category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="日志级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLogLevelTag(row.level)">
              {{ row.level.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="日志内容" width="150" show-overflow-tooltip />
        <el-table-column label="详细信息" min-width="200">
          <template #default="{ row }">
            <div class="fields-info">
              <template v-if="row.fields">
                <div v-if="row.fields.count !== undefined" class="field-item">
                  <span class="field-label">数量：</span>
                  <span class="field-value">{{ row.fields.count }}</span>
                </div>
                <div v-if="row.fields.trace_id" class="field-item">
                  <span class="field-label">追踪ID：</span>
                  <span class="field-value">{{ row.fields.trace_id }}</span>
                </div>
                <div v-if="row.fields.product_code" class="field-item">
                  <span class="field-label">商品编码：</span>
                  <span class="field-value">{{ row.fields.product_code }}</span>
                </div>
                <div v-if="row.fields.product_name" class="field-item">
                  <span class="field-label">商品名称：</span>
                  <span class="field-value">{{ row.fields.product_name }}</span>
                </div>
                <div v-if="row.fields.product_num !== undefined" class="field-item">
                  <span class="field-label">商品数量：</span>
                  <span class="field-value">{{ row.fields.product_num }}</span>
                </div>
                <div v-if="row.fields.product_price !== undefined" class="field-item">
                  <span class="field-label">商品价格：</span>
                  <span class="field-value">¥{{ row.fields.product_price }}</span>
                </div>
                <div v-if="row.fields.product_total !== undefined" class="field-item">
                  <span class="field-label">总价：</span>
                  <span class="field-value">¥{{ row.fields.product_total }}</span>
                </div>
                <div v-if="row.fields.stock_remain !== undefined" class="field-item">
                  <span class="field-label">库存：</span>
                  <span class="field-value">{{ row.fields.stock_remain }}</span>
                </div>
                <div v-if="row.fields.delete_num !== undefined" class="field-item">
                  <span class="field-label">删除数量：</span>
                  <span class="field-value">{{ row.fields.delete_num }}</span>
                </div>
                <div v-if="row.fields.codes" class="field-item">
                  <span class="field-label">商品编码列表：</span>
                  <span class="field-value">{{ row.fields.codes.join(', ') }}</span>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { API } from '@/config/api'

// 角色列表
const roleList = ref([])

// 获取角色列表
async function fetchRoles() {
  try {
    const res = await request(API.ROLE.LIST)
    if (res.data?.code === 200) {
      roleList.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 搜索表单
const searchForm = reactive({
  user_code: '',
  user_name: '',
  user_role: '',
  type: '',
  log_category: '',
  level: '',
  message: '',
  start_time: '',
  end_time: '',
  page: 1,
  size: 10
})

// 时间范围选择器
const timeRange = ref([])

// 日志列表数据
const logList = ref([])
const total = ref(0)
const loading = ref(false)

// 刷新相关
const refreshInterval = 30 // 30秒刷新一次
const refreshCountdown = ref(refreshInterval)
const isRefreshing = ref(false)
const refreshTimer = ref(null)

const refreshText = computed(() => {
  if (isRefreshing.value) {
    return '正在刷新...'
  }
  return `${refreshCountdown.value}秒后自动刷新`
})

// 开始倒计时
const startRefreshCountdown = () => {
  refreshCountdown.value = refreshInterval
  refreshTimer.value = setInterval(() => {
    refreshCountdown.value--
    if (refreshCountdown.value <= 0) {
      handleAutoRefresh()
    }
  }, 1000)
}

// 自动刷新
const handleAutoRefresh = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    await fetchLogs()
  } catch (error) {
    console.error('自动刷新失败:', error)
  } finally {
    isRefreshing.value = false
    startRefreshCountdown()
  }
}

// 手动刷新
const handleManualRefresh = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    await fetchLogs()
    ElMessage.success('刷新成功')
    refreshCountdown.value = refreshInterval
  } catch (error) {
    console.error('手动刷新失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

// 获取日志列表
async function fetchLogs() {
  loading.value = true
  try {
    const time = new Date().getTime()
    const params = new URLSearchParams()
    
    // 添加搜索参数
    Object.keys(searchForm).forEach(key => {
      if (searchForm[key] !== '' && searchForm[key] !== null && searchForm[key] !== undefined) {
        params.append(key, searchForm[key])
      }
    })
    params.append('_t', time)

    console.log('【fetchLogs】请求参数:', Object.fromEntries(params))
    const res = await request(`${API.LOG.SEARCH}?${params}`)
    console.log('【fetchLogs】后端返回:', res.data)

    if (res.data?.code === 200) {
      const { hits } = res.data.data
      logList.value = hits.hits.map(hit => hit._source)
      total.value = hits.total.value
    }
  } catch (error) {
    console.error('获取日志失败', error)
    ElMessage.error('获取日志失败')
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  searchForm.page = 1
  fetchLogs()
}

// 重置搜索
function handleReset() {
  Object.keys(searchForm).forEach(key => {
    if (key !== 'page' && key !== 'size') {
      searchForm[key] = ''
    }
  })
  timeRange.value = []
  searchForm.start_time = ''
  searchForm.end_time = ''
  handleSearch()
}

// 分页
function handleSizeChange(val) {
  searchForm.size = val
  fetchLogs()
}

function handleCurrentChange(val) {
  searchForm.page = val
  fetchLogs()
}

// 处理时间范围变化
const handleTimeRangeChange = (val) => {
  if (val) {
    searchForm.start_time = val[0]
    searchForm.end_time = val[1]
  } else {
    searchForm.start_time = ''
    searchForm.end_time = ''
  }
  handleSearch() // 时间变化时自动搜索
}

// 获取日志类型标签
const getLogCategoryLabel = (category) => {
  const categoryMap = {
    system: '系统',
    operation: '操作',
    error: '错误'
  }
  return categoryMap[category] || category
}

// 获取日志类型标签样式
const getLogCategoryTag = (category) => {
  const categoryMap = {
    system: '',
    operation: 'success',
    error: 'danger'
  }
  return categoryMap[category] || ''
}

// 获取日志级别标签样式
const getLogLevelTag = (level) => {
  const levelMap = {
    info: 'info',
    warn: 'warning',
    error: 'danger'
  }
  return levelMap[level.toLowerCase()] || ''
}

// 生命周期
onMounted(() => {
  fetchRoles()
  fetchLogs()
  startRefreshCountdown()
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<style scoped>
.log-management {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.log-list-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-date-editor) {
  width: 360px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.refresh-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.refresh-info .el-icon {
  font-size: 16px;
  color: var(--el-color-primary);
  transition: transform 0.3s ease;
}

.refresh-info .el-icon.is-spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fields-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.field-label {
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.field-value {
  color: var(--el-text-color-primary);
  word-break: break-all;
}
</style> 