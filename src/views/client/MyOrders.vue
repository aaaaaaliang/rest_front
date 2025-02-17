<template>
  <div class="my-orders">
    <el-card class="orders-content">
      <template #header>
        <div class="page-header">
          <h3>我的订单</h3>
        </div>
      </template>

      <!-- 订单列表 -->
      <el-table 
        v-loading="loading"
        :data="orders" 
        style="width: 100%"
      >
        <el-table-column label="订单详情" min-width="500">
          <template #default="{ row }">
            <div class="order-products">
              <div v-for="item in row.order_detail" :key="item.product_code" class="product-item">
                <el-image
                  :src="getImageUrl(item.picture?.code, IMAGE_SIZE.THUMBNAIL)"
                  fit="cover"
                  class="product-image"
                >
                  <template #error>
                    <div class="image-placeholder">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="product-info">
                  <div class="product-name">{{ item.product_name }}</div>
                  <div class="product-meta">
                    ¥{{ item.price.toFixed(2) }} × {{ item.quantity }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="total_price" label="实付款" width="120" align="center">
          <template #default="{ row }">
            <span class="price">¥{{ row.total_price.toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="订单状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="ORDER_STATUS_MAP[row.status].type">
              {{ ORDER_STATUS_MAP[row.status].label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === ORDER_STATUS.PENDING"
              type="danger" 
              link
              @click="handleCancel(row)"
            >
              取消订单
            </el-button>
            <el-button 
              v-if="row.status === ORDER_STATUS.COMPLETED"
              type="danger" 
              link
              @click="handleDelete(row)"
            >
              删除订单
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useOrderStore } from '../../stores/order'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { ORDER_STATUS, ORDER_STATUS_MAP } from '../../config/constants'
import { IMAGE_SIZE, getImageUrl } from '../../config/constants'

const orderStore = useOrderStore()
const loading = ref(false)
const orders = ref([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  index: 1,
  size: 10
})

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    await orderStore.fetchOrders(queryParams)
    orders.value = orderStore.orders
    total.value = orderStore.total
  } finally {
    loading.value = false
  }
}

// 取消订单
const handleCancel = async (order) => {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const success = await orderStore.updateOrder({
      code: order.code,
      status: ORDER_STATUS.FAILED,
      remark: '用户取消订单'
    })
    if (success) {
      fetchOrders()
    }
  } catch {
    // 用户取消操作
  }
}

// 删除订单
const handleDelete = async (order) => {
  try {
    await ElMessageBox.confirm('确定要删除这个订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const success = await orderStore.deleteOrder(order.code)
    if (success) {
      fetchOrders()
    }
  } catch {
    // 用户取消操作
  }
}

// 处理分页
const handleSizeChange = (val) => {
  queryParams.size = val
  queryParams.index = 1
  fetchOrders()
}

const handleCurrentChange = (val) => {
  queryParams.index = val
  fetchOrders()
}

// 初始化
onMounted(() => {
  fetchOrders()
})
</script>

<style scoped lang="scss">
.my-orders {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: #f5f5f5;
}

.orders-content {
  max-width: 1200px;
  margin: 0 auto;

  .page-header {
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.order-products {
  .product-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .product-image {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      overflow: hidden;
    }

    .product-info {
      flex: 1;
      min-width: 0;

      .product-name {
        font-size: 14px;
        margin-bottom: 4px;
      }

      .product-meta {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
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

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}
</style> 