<template>
  <div class="order-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>订单管理</span>
            <el-select 
              v-model="queryParams.status" 
              placeholder="订单状态"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="(value, key) in ORDER_STATUS"
                :key="value"
                :label="ORDER_STATUS_MAP[value].label"
                :value="value"
              />
            </el-select>
          </div>
        </div>
      </template>

      <!-- 订单列表 -->
      <el-table 
        v-loading="loading"
        :data="orders" 
        style="width: 100%"
      >
        <el-table-column label="订单编号" prop="code" width="100" />
        <el-table-column label="用户" prop="user_name" width="100" />
        <el-table-column label="订单详情" min-width="200">
          <template #default="{ row }">
            <div class="order-products">
              <div v-for="item in row.order_detail" :key="item.product_code" class="product-item">

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
        
        <el-table-column label="订单创建时间" width="200">
          <template #default="{ row }">
            <span>{{ formatDate(row.created) }}</span>
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

        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === ORDER_STATUS.PENDING && hasPermission('api_order_put')"
              type="primary" 
              link
              @click="handleUpdateStatus(row, ORDER_STATUS.PROCESSING)"
            >
              开始制作
            </el-button>
            <el-button 
              v-if="row.status === ORDER_STATUS.PROCESSING && hasPermission('api_order_put')"
              type="success" 
              link
              @click="handleUpdateStatus(row, ORDER_STATUS.COMPLETED)"
            >
              完成制作
            </el-button>
            <el-button 
              v-if="row.status === ORDER_STATUS.PENDING && hasPermission('api_order_put')"
              type="danger" 
              link
              @click="handleUpdateStatus(row, ORDER_STATUS.FAILED)"
            >
              无法处理
            </el-button>
            <el-button 
              type="primary" 
              link
              @click="handleEdit(row)"
              v-if="hasPermission('api_order_put')"
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

      <!-- 编辑对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="'编辑订单'"
        width="500px"
      >
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="订单状态" prop="status">
            <el-select v-model="form.status">
              <el-option
                v-for="(value, key) in ORDER_STATUS"
                :key="value"
                :label="ORDER_STATUS_MAP[value].label"
                :value="value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息"
            />
          </el-form-item>
          <input type="hidden" v-model="form.version" />
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            确定
          </el-button>
        </template>
      </el-dialog>
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
import request from '../../utils/request'
import { API } from '../../config/api'
import { hasPermission } from '../../utils/permissions'

const orderStore = useOrderStore()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const orders = ref([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  index: 1,
  size: 10,
  status: '',
  all: true
})

// 表单数据
const form = ref({
  code: '',
  status: '',
  remark: '',
  version: 1
})

// const formatDate = (timestamp) => {
//   if (timestamp) {
//     const date = new Date(timestamp);  // 将时间戳转为 Date 对象
//     return date.toLocaleString();  // 返回格式化后的日期（根据用户的本地设置）
//   }
//   return '';
// };
const formatDate = (timestamp) => {
  if (timestamp) {
    // 如果传入的是秒级时间戳，需要乘以 1000 转换为毫秒级时间戳
    if (timestamp.toString().length === 10) {
      timestamp *= 1000; // 转换为毫秒级
    }
    const date = new Date(timestamp);
    return date.toLocaleString();  // 格式化为本地时间
  }
  return '';
};


// 表单校验规则
const rules = {
  status: [{ required: true, message: '请选择订单状态', trigger: 'change' }]
}

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      index: queryParams.index,
      size: queryParams.size,
      all: true
    })
    if (queryParams.status) {
      params.append('status', queryParams.status)
    }
    
    const res = await request(`${API.ORDER.LIST}?${params}`)
    if (res.data && res.data.code === 200) {
      orders.value = res.data.data || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error(error.message || '获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 更新订单状态
const handleUpdateStatus = async (order, status) => {
  try {
    const res = await request(API.ORDER.UPDATE, {
      method: 'PUT',
      data: {
        code: order.code,
        status,
        version: order.version
      }
    })
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('更新成功')
      fetchOrders()
    }
  } catch (error) {
    if (error.response?.data?.message === '数据已被其他操作修改') {
      ElMessage.error('订单状态已被其他操作修改，请刷新后重试')
      fetchOrders()
    } else {
      ElMessage.error(error.message || '更新失败')
    }
  }
}

// 编辑订单
const handleEdit = (row) => {
  form.value = {
    code: row.code,
    status: row.status,
    remark: row.remark || '',
    version: row.version
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const res = await request(API.ORDER.UPDATE, {
          method: 'PUT',
          data: form.value
        })
        
        if (res.data && res.data.code === 200) {
          ElMessage.success('更新成功')
          dialogVisible.value = false
          fetchOrders()
        }
      } catch (error) {
        if (error.response?.data?.message === '数据已被其他操作修改') {
          ElMessage.error('订单信息已被其他操作修改，请刷新后重试')
          dialogVisible.value = false
          fetchOrders()
        } else {
          ElMessage.error(error.message || '更新失败')
        }
      } finally {
        submitting.value = false
      }
    }
  })
}

// 处理搜索
const handleSearch = () => {
  queryParams.index = 1
  fetchOrders()
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