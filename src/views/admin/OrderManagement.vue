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
        </div>
      </template>

      <!-- 订单表格 -->
      <el-table v-loading="loading" :data="orders" style="width: 100%">
        <!-- 订单编号 -->
        <el-table-column label="订单编号" prop="code" width="120" />
        <!-- 用户 -->
        <el-table-column label="用户" prop="user_name" width="120" />
        <!-- 状态 -->
        <el-table-column label="订单状态" prop="status" width="150">
          <template #default="{ row }">
            <el-tag :type="ORDER_STATUS_MAP[row.status]?.type || 'info'">
              {{ ORDER_STATUS_MAP[row.status]?.label || '未知状态' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 订单详情 -->
        <el-table-column label="订单详情" min-width="200">
          <template #default="{ row }">
            <div v-for="item in row.order_detail" :key="item.product_code">
              <div class="product-info">
                <div class="product-name">{{ item.product_name }}</div>
                <div class="product-meta">
                  ¥{{ item.price.toFixed(2) }} × {{ item.quantity }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 订单创建时间 -->
        <el-table-column label="订单创建时间" width="200">
          <template #default="{ row }">
            <span>{{ formatDate(row.created) }}</span>
          </template>
        </el-table-column>
        <!-- 实付款 -->
        <el-table-column label="实付款" prop="total_price" width="120" align="center">
          <template #default="{ row }">
            <span class="price">¥{{ row.total_price.toFixed(2) }}</span>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <!-- 1 => 已下单: [开始制作(=2), 编辑] -->
            <el-button
                v-if="row.status === ORDER_STATUS.PLACED"
                type="primary"
                link
                @click="handleUpdateStatus(row, ORDER_STATUS.PROCESSING)"
            >
              开始制作
            </el-button>
            <el-button
                v-if="row.status === ORDER_STATUS.PLACED"
                type="primary"
                link
                @click="handleEdit(row)"
            >
              编辑
            </el-button>

            <!-- 2 => 制作中: [完成制作(=3), 编辑] -->
            <el-button
                v-if="row.status === ORDER_STATUS.PROCESSING"
                type="success"
                link
                @click="handleUpdateStatus(row, ORDER_STATUS.COMPLETED)"
            >
              完成制作
            </el-button>
            <el-button
                v-if="row.status === ORDER_STATUS.PROCESSING"
                type="primary"
                link
                @click="handleEdit(row)"
            >
              编辑
            </el-button>

            <!-- 3 => 已完成: [编辑] -->
            <el-button
                v-if="row.status === ORDER_STATUS.COMPLETED"
                type="primary"
                link
                @click="handleEdit(row)"
            >
              编辑
            </el-button>

            <!-- 4 => 取消订单: [编辑] -->
            <el-button
                v-if="row.status === ORDER_STATUS.CANCELLED"
                type="primary"
                link
                @click="handleEdit(row)"
            >
              编辑
            </el-button>

            <!-- 5 => 待支付: [取消支付(=4), 编辑] -->
            <el-button
                v-if="row.status === ORDER_STATUS.PENDING"
                type="danger"
                link
                @click="handleUpdateStatus(row, ORDER_STATUS.CANCELLED)"
            >
              取消支付
            </el-button>
            <el-button
                v-if="row.status === ORDER_STATUS.PENDING"
                type="primary"
                link
                @click="handleEdit(row)"
            >
              编辑
            </el-button>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

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

// 生命周期函数
onMounted(() => {
  fetchOrders()
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

    // 更新成功后重新获取列表
    await fetchOrders()
  } catch (error) {
    console.error(error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 点击“编辑”按钮 => 弹窗
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

    // 编辑成功后，自动刷新列表
    await fetchOrders()
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .el-select {
      width: 150px;
    }
  }
}

.product-info {
  margin: 6px 0;

  .product-name {
    font-size: 14px;
    margin-bottom: 4px;
    font-weight: 500;
  }

  .product-meta {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.price {
  color: var(--el-color-danger);
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
