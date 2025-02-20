<template>
  <div class="orders-page">
    <el-card class="orders-content">
      <template #header>
        <div class="orders-header">
          <h3>我的订单</h3>
        </div>
      </template>

      <div v-if="orders.length" class="orders-list">
        <el-table :data="orders" style="width: 100%">
          <el-table-column prop="code" label="订单编号" width="220" />
          
          <el-table-column label="订单详情">
            <template #default="{ row }">
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
                <span class="product-name">{{ item.product_name }}</span>
                <span class="quantity">x{{ item.quantity }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="total_price" label="总价" width="120">
            <template #default="{ row }">
              <span class="price">¥{{ row.total_price.toFixed(2) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getOrderStatusType(row.status)">
                {{ getOrderStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="created" label="下单时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 1"
                type="danger"
                link
                @click="handleCancelOrder(row)"
              >
                取消订单
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="queryParams.index"
            v-model:page-size="queryParams.size"
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <el-empty v-else description="暂无订单" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { API } from '../../config/api'

const orders = ref([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  index: 1,
  size: 10
})

// 获取订单列表
const fetchOrders = async () => {
  try {
    const res = await request(`${API.ORDER.LIST}`, {
      method: 'GET',
      data: {
        index: queryParams.index,
        size: queryParams.size
      }
    })
    
    if (res.data && res.data.code === 200) {
      orders.value = res.data.data || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
  }
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  queryParams.size = val
  queryParams.index = 1 // 切换每页条数时重置为第一页
  fetchOrders()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  queryParams.index = val
  fetchOrders()
}

// 取消订单
const handleCancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消该订单吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await request(API.ORDER.UPDATE, {
      method: 'PUT',
      data: {
        code: order.code,
        status: 4,
        remark: '用户取消订单'
      }
    })

    if (res.data && res.data.code === 200) {
      ElMessage.success('订单取消成功')
      // 刷新订单列表
      fetchOrders()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
      ElMessage.error('取消订单失败')
    }
  }
}

// 修改状态文本映射
const getOrderStatusText = (status) => {
  const statusMap = {
    1: '已下单',
    2: '制作中',
    3: '已完成',
    4: '已取消',
    5: '无法处理'
  }
  return statusMap[status] || '未知状态'
}

// 修改状态标签类型映射
const getOrderStatusType = (status) => {
  const typeMap = {
    1: 'info',
    2: 'warning',
    3: 'success',
    4: 'danger',  // 取消订单使用红色标签
    5: 'danger'
  }
  return typeMap[status] || 'info'
}

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped lang="scss">
.orders-page {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: #f5f5f5;
}

.orders-content {
  max-width: 1200px;
  margin: 0 auto;

  .orders-header {
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  .product-image {
    width: 40px;
    height: 40px;
    border-radius: 4px;
  }

  .product-name {
    flex: 1;
    font-size: 14px;
  }

  .quantity {
    color: #999;
  }
}

.price {
  color: var(--el-color-danger);
  font-weight: 600;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 