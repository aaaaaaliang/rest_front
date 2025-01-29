<template>
  <div class="order-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-input
              v-model="searchQuery"
              placeholder="搜索订单号/用户名"
              style="width: 200px"
              clearable
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-select 
              v-model="statusFilter" 
              placeholder="订单状态" 
              clearable
              style="margin-left: 16px; width: 120px"
              @change="handleSearch"
            >
              <el-option label="待付款" value="pending" />
              <el-option label="待接单" value="paid" />
              <el-option label="制作中" value="processing" />
              <el-option label="待配送" value="ready" />
              <el-option label="配送中" value="delivering" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
            
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-left: 16px; width: 300px"
              @change="handleSearch"
            />
          </div>
          
          <el-button type="primary" @click="handleSearch">
            搜索
          </el-button>
        </div>
      </template>

      <el-table :data="orders" style="width: 100%">
        <el-table-column prop="id" label="订单号" width="180" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="createTime" label="下单时间" width="180" />
        <el-table-column prop="amount" label="金额">
          <template #default="scope">
            ¥{{ scope.row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button 
              size="small"
              @click="handleViewDetails(scope.row)"
            >
              查看详情
            </el-button>
            <el-button
              v-if="scope.row.status === 'paid'"
              size="small"
              type="primary"
              @click="handleAcceptOrder(scope.row)"
            >
              接单
            </el-button>
            <el-button
              v-if="scope.row.status === 'processing'"
              size="small"
              type="success"
              @click="handleCompleteOrder(scope.row)"
            >
              完成制作
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="订单详情"
      width="700px"
    >
      <template v-if="currentOrder">
        <div class="order-info">
          <div class="info-item">
            <span class="label">订单号：</span>
            <span>{{ currentOrder.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">下单时间：</span>
            <span>{{ currentOrder.createTime }}</span>
          </div>
          <div class="info-item">
            <span class="label">用户名：</span>
            <span>{{ currentOrder.username }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话：</span>
            <span>{{ currentOrder.phone }}</span>
          </div>
          <div class="info-item">
            <span class="label">配送地址：</span>
            <span>{{ currentOrder.address }}</span>
          </div>
          <div class="info-item">
            <span class="label">订单状态：</span>
            <el-tag :type="getStatusType(currentOrder.status)">
              {{ getStatusText(currentOrder.status) }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <el-table :data="currentOrder.items" style="width: 100%">
          <el-table-column label="菜品图片" width="100">
            <template #default="scope">
              <el-image
                style="width: 50px; height: 50px"
                :src="scope.row.image"
                :preview-src-list="[scope.row.image]"
              />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="菜品名称" />
          <el-table-column prop="price" label="单价">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column label="小计">
            <template #default="scope">
              ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="order-total">
          <span>订单总额：</span>
          <span class="amount">¥{{ currentOrder.amount.toFixed(2) }}</span>
        </div>

        <div class="order-remarks" v-if="currentOrder.remarks">
          <span class="label">备注：</span>
          <span>{{ currentOrder.remarks }}</span>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索条件
const searchQuery = ref('')
const statusFilter = ref('')
const dateRange = ref(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 订单数据
const orders = ref([
  {
    id: 'DD20240101001',
    username: '张三',
    createTime: '2024-01-01 12:30:00',
    amount: 128.00,
    status: 'paid',
    phone: '13800138000',
    address: '北京市朝阳区xxx街道xxx小区',
    remarks: '不要辣',
    items: [
      {
        name: '宫保鸡丁',
        price: 38.00,
        quantity: 2,
        image: 'https://via.placeholder.com/100'
      },
      {
        name: '白切鸡',
        price: 52.00,
        quantity: 1,
        image: 'https://via.placeholder.com/100'
      }
    ]
  },
  {
    id: 'DD20240101002',
    username: '李四',
    createTime: '2024-01-01 13:00:00',
    amount: 156.00,
    status: 'processing',
    phone: '13800138001',
    address: '北京市海淀区xxx街道xxx小区',
    remarks: '',
    items: [
      {
        name: '水煮鱼',
        price: 88.00,
        quantity: 1,
        image: 'https://via.placeholder.com/100'
      },
      {
        name: '青椒肉丝',
        price: 34.00,
        quantity: 2,
        image: 'https://via.placeholder.com/100'
      }
    ]
  }
])

const detailsDialogVisible = ref(false)
const currentOrder = ref(null)

// 状态相关方法
const getStatusType = (status) => {
  const statusMap = {
    pending: 'info',
    paid: 'warning',
    processing: 'primary',
    ready: 'success',
    delivering: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return statusMap[status]
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待付款',
    paid: '待接单',
    processing: '制作中',
    ready: '待配送',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status]
}

// 搜索和分页方法
const handleSearch = () => {
  // TODO: 实现搜索功能
  console.log('搜索条件:', {
    query: searchQuery.value,
    status: statusFilter.value,
    dateRange: dateRange.value
  })
}

const handleSizeChange = (val) => {
  pageSize.value = val
  // TODO: 重新加载数据
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  // TODO: 重新加载数据
}

// 订单操作方法
const handleViewDetails = (order) => {
  currentOrder.value = order
  detailsDialogVisible.value = true
}

const handleAcceptOrder = (order) => {
  ElMessageBox.confirm(
    `确定接受订单 ${order.id} 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // TODO: 调用接单API
    order.status = 'processing'
    ElMessage.success('接单成功')
  })
}

const handleCompleteOrder = (order) => {
  ElMessageBox.confirm(
    `确定完成订单 ${order.id} 的制作吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // TODO: 调用完成制作API
    order.status = 'ready'
    ElMessage.success('已完成制作')
  })
}
</script>

<style scoped>
.order-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.order-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  color: #606266;
  margin-right: 8px;
}

.order-total {
  margin-top: 20px;
  text-align: right;
  font-size: 16px;
}

.order-total .amount {
  color: #f56c6c;
  font-weight: bold;
  margin-left: 8px;
}

.order-remarks {
  margin-top: 16px;
  color: #606266;
}

.order-remarks .label {
  margin-right: 8px;
}
</style> 