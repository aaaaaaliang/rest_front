<template>
  <div class="order-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>订单管理</span>

            <!-- 关键字搜索 -->
            <el-input
                v-model="queryParams.keyword"
                placeholder="请输入关键字搜索"
                clearable
                @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>

            <!-- 订单状态筛选 -->
            <el-select
                v-model="queryParams.status"
                placeholder="订单状态"
                clearable
                @change="handleSearch"
            >
              <el-option
                  v-for="(info, value) in ORDER_STATUS_MAP"
                  :key="value"
                  :label="info.label"
                  :value="Number(value)"
              >
              </el-option>
            </el-select>
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

      <!-- 订单表格 -->
      <el-table v-loading="loading" :data="orders" style="width: 100%">
        <!-- 订单编号 -->
        <el-table-column label="订单编号" prop="code" width="180">
          <template #default="{ row }">
            <div class="order-code">
              <el-icon><Document /></el-icon>
              <span>{{ row.code }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 用户信息 -->
        <el-table-column label="用户信息" width="200">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">
                <el-icon><User /></el-icon>
                <span>{{ row.user_name }}</span>
              </div>
              <div class="customer-name">
                <el-icon><UserFilled /></el-icon>
                <span>{{ row.customer }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 订单信息 -->
        <el-table-column label="订单信息" min-width="300">
          <template #default="{ row }">
            <div class="order-info">
              <div class="order-header">
                <div class="table-info">
                  <el-icon><Location /></el-icon>
                  <span>餐桌号：{{ row.table_no }}</span>
                </div>
                <div class="order-time">
                  <el-icon><Timer /></el-icon>
                  <span>{{ formatDate(row.created) }}</span>
                </div>
              </div>
              <div class="order-details">
                <div v-for="item in row.order_detail" :key="item.product_code" class="order-item">
                  <el-image
                    :src="item.picture"
                    fit="cover"
                    class="product-image"
                  >
                    <template #error>
                      <div class="image-placeholder">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div class="item-info">
                    <span class="product-name">{{ item.product_name }}</span>
                    <div class="item-meta">
                      <span class="price">¥{{ item.price.toFixed(2) }}</span>
                      <span class="quantity">x{{ item.quantity }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="row.remark" class="order-remark">
                <el-icon><ChatDotRound /></el-icon>
                <span>备注：{{ row.remark }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column label="订单状态" width="150">
          <template #default="{ row }">
            <el-tag :type="ORDER_STATUS_MAP[row.status]?.type || 'info'" class="status-tag">
              {{ ORDER_STATUS_MAP[row.status]?.label || '未知状态' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 实付款 -->
        <el-table-column label="实付款" width="120" align="center">
          <template #default="{ row }">
            <div class="price-info">
              <div v-if="row.coupon_amount" class="original-price">
                ¥{{ row.total_price.toFixed(2) }}
              </div>
              <div class="final-price">
                ¥{{ (row.coupon_amount || row.total_price).toFixed(2) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <!-- 1 => 已下单: [开始制作(=2), 编辑] -->
              <el-button
                v-if="row.status === ORDER_STATUS.PLACED"
                type="primary"
                link
                @click="handleUpdateStatus(row, ORDER_STATUS.PROCESSING)"
              >
                <el-icon><VideoPlay /></el-icon>
                开始制作
              </el-button>
              <el-button
                v-if="row.status === ORDER_STATUS.PLACED"
                type="primary"
                link
                @click="handleEdit(row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>

              <!-- 2 => 制作中: [完成制作(=3), 编辑] -->
              <el-button
                v-if="row.status === ORDER_STATUS.PROCESSING"
                type="success"
                link
                @click="handleUpdateStatus(row, ORDER_STATUS.COMPLETED)"
              >
                <el-icon><CircleCheck /></el-icon>
                完成制作
              </el-button>
              <el-button
                v-if="row.status === ORDER_STATUS.PROCESSING"
                type="primary"
                link
                @click="handleEdit(row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>

              <!-- 3 => 已完成: [编辑] -->
              <el-button
                v-if="row.status === ORDER_STATUS.COMPLETED"
                type="primary"
                link
                @click="handleEdit(row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>

              <!-- 4 => 取消订单: [编辑] -->
              <el-button
                v-if="row.status === ORDER_STATUS.CANCELLED"
                type="primary"
                link
                @click="handleEdit(row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>

              <!-- 5 => 待支付: [取消支付(=4), 编辑] -->
              <el-button
                v-if="row.status === ORDER_STATUS.PENDING"
                type="danger"
                link
                @click="handleUpdateStatus(row, ORDER_STATUS.CANCELLED)"
              >
                <el-icon><Close /></el-icon>
                取消支付
              </el-button>
              <el-button
                v-if="row.status === ORDER_STATUS.PENDING"
                type="primary"
                link
                @click="handleEdit(row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
            v-model:current-page="queryParams.index"
            v-model:page-size="queryParams.size"
            :total="total"
            :page-sizes="[10, 20, 30]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 编辑订单弹窗 -->
    <el-dialog v-model="dialogVisible" title="编辑订单" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <!-- 状态：只读，不允许变更 -->
        <el-form-item label="订单状态" prop="status">
          <el-input
              :value="ORDER_STATUS_MAP[form.status]?.label"
              disabled
          />
        </el-form-item>
        <!-- 备注可修改 -->
        <el-form-item label="备注" prop="remark">
          <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息"
          />
        </el-form-item>
        <!-- 乐观锁版本号(隐藏) -->
        <input type="hidden" v-model="form.version" />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Document, User, UserFilled, Location, Timer, 
  Picture, ChatDotRound, VideoPlay, Edit, 
  CircleCheck, Close, Refresh
} from '@element-plus/icons-vue'

// 根据你的项目实际，修改下面两个引入
import request from '@/utils/request'
import { API } from '@/config/api'

// 订单状态常量
const ORDER_STATUS = {
  PLACED: 1,     // 已下单
  PROCESSING: 2, // 制作中
  COMPLETED: 3,  // 已完成
  CANCELLED: 4,  // 取消订单
  PENDING: 5     // 待支付
}

// 用于界面显示标签
const ORDER_STATUS_MAP = {
  [ORDER_STATUS.PLACED]:    { label: '已下单',   type: 'primary' },
  [ORDER_STATUS.PROCESSING]:{ label: '制作中',   type: 'info' },
  [ORDER_STATUS.COMPLETED]: { label: '已完成',   type: 'success' },
  [ORDER_STATUS.CANCELLED]: { label: '取消订单', type: 'danger' },
  [ORDER_STATUS.PENDING]:   { label: '待支付',   type: 'warning' }
}

// 列表加载
const loading = ref(false)
const orders = ref([])
const total = ref(0)

// 编辑弹窗
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

// 查询参数
const queryParams = reactive({
  index: 1,
  size: 10,
  status: '',
  keyword: '',
  all: true
})

// 编辑表单
const form = ref({
  code: '',
  status: 0,
  remark: '',
  version: 1
})

const rules = {
  remark: [
    { required: false, message: '请填写备注信息', trigger: 'blur' }
  ]
}

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
    await fetchOrders()
    ElMessage.success('数据已更新')
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
    await fetchOrders()
    ElMessage.success('刷新成功')
    refreshCountdown.value = refreshInterval
  } catch (error) {
    console.error('手动刷新失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchOrders()
  startRefreshCountdown()
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})

// 获取订单列表
async function fetchOrders() {
  loading.value = true
  try {
    // 加个随机数或时间戳，排除后端缓存
    const time = new Date().getTime()
    const params = new URLSearchParams(queryParams)
    params.append('_t', time)

    const res = await request(`${API.ORDER.LIST}?${params}`)
    console.log('【fetchOrders】后端返回:', res.data)

    if (res.data?.code === 200) {
      orders.value = res.data.data || []
      total.value = res.data.total || 0
    }
    console.log('【fetchOrders】前端最终 orders:', orders.value)
  } catch (error) {
    console.error('获取订单失败', error)
  } finally {
    loading.value = false
  }
}

// 格式化时间
function formatDate(timestamp) {
  if (timestamp) {
    if (timestamp.toString().length === 10) {
      timestamp = timestamp * 1000
    }
    return new Date(timestamp).toLocaleString()
  }
  return ''
}

// 搜索
function handleSearch() {
  queryParams.index = 1
  fetchOrders()
}

// 分页
function handleSizeChange(val) {
  queryParams.size = val
  fetchOrders()
}
function handleCurrentChange(val) {
  queryParams.index = val
  fetchOrders()
}

// 操作：更新状态（开始制作/完成制作/取消支付等）
async function handleUpdateStatus(row, newStatus) {
  const data = {
    code: row.code,
    status: newStatus,
    remark: row.remark || '',
    version: row.version
  }
  try {
    submitting.value = true
    const resp = await request(API.ORDER.UPDATE, {
      method: 'PUT',
      data
    })
    console.log('【handleUpdateStatus】PUT结果:', resp.data)
    ElMessage.success('操作成功')

    // 显示倒计时提示
    const countdown = 5 // 5秒倒计时
    const timer = setInterval(() => {
      if (countdown > 0) {
        ElMessage({
          message: `${countdown}秒后刷新页面...`,
          type: 'info',
          duration: 1000
        })
        countdown--
      } else {
        clearInterval(timer)
        // 倒计时结束后刷新页面
        fetchOrders()
      }
    }, 1000)

  } catch (error) {
    console.error(error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 点击"编辑"按钮 => 弹窗
function handleEdit(row) {
  form.value = {
    code: row.code,
    status: row.status,
    remark: row.remark || '',
    version: row.version
  }
  dialogVisible.value = true
}

// 提交编辑
async function handleSubmit() {
  try {
    submitting.value = true
    // 这里只提交 remark、code、status、version，不允许修改 status
    const resp = await request(API.ORDER.UPDATE, {
      method: 'PUT',
      data: form.value
    })
    console.log('【handleSubmit】编辑结果:', resp.data)
    ElMessage.success('编辑成功')
    dialogVisible.value = false

    // 显示倒计时提示
    const countdown = 5 // 5秒倒计时
    const timer = setInterval(() => {
      if (countdown > 0) {
        ElMessage({
          message: `${countdown}秒后刷新页面...`,
          type: 'info',
          duration: 1000
        })
        countdown--
      } else {
        clearInterval(timer)
        // 倒计时结束后刷新页面
        fetchOrders()
      }
    }, 1000)

  } catch (error) {
    console.error(error)
    ElMessage.error('编辑失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.order-management {
  padding: 20px;
  background: var(--el-bg-color-page);
  min-height: calc(100vh - 60px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .el-input {
      width: 200px;
    }

    .el-select {
      width: 150px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .refresh-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--el-text-color-secondary);
      font-size: 14px;

      .el-icon {
        font-size: 16px;
        color: var(--el-color-primary);
        transition: transform 0.3s ease;

        &.is-spinning {
          animation: spin 1s linear infinite;
        }
      }
    }
  }
}

.order-code {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-primary);
  font-weight: 500;

  .el-icon {
    color: var(--el-color-primary);
  }
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .user-name, .customer-name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .customer-name {
    color: var(--el-text-color-secondary);
  }
}

.order-info {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;

  .order-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .table-info, .order-time {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--el-text-color-regular);
      font-size: 14px;

      .el-icon {
        color: var(--el-color-primary);
      }
    }
  }

  .order-details {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .order-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: var(--el-bg-color);
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      }

      .product-image {
        width: 50px;
        height: 50px;
        border-radius: 6px;
        object-fit: cover;
      }

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .product-name {
          font-size: 14px;
          color: var(--el-text-color-primary);
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;

          .price {
            color: var(--el-color-danger);
            font-weight: 600;
          }

          .quantity {
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .order-remark {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    .el-icon {
      color: var(--el-color-info);
    }
  }
}

.status-tag {
  font-weight: 500;
}

.total-price {
  font-size: 16px;
  color: var(--el-color-danger);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;

  .el-button {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  
  .original-price {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-decoration: line-through;
  }
  
  .final-price {
    font-size: 16px;
    color: var(--el-color-danger);
    font-weight: 600;
  }
}
</style>
