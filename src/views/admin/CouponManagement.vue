<template>
  <div class="coupon-management">
    <div class="page-header">
      <h2>优惠券管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>创建优惠券
      </el-button>
    </div>

    <!-- 优惠券列表 -->
    <el-card class="coupon-list">
      <el-table :data="couponList" v-loading="loading" border stripe>
        <el-table-column prop="code" label="券码" width="120" />
        <el-table-column prop="name" label="券名称" min-width="150" />
        <el-table-column label="券类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getCouponTypeTag(row.type)">
              {{ getCouponTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" width="150">
          <template #default="{ row }">
            {{ getCouponQuotaText(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="total" label="发放数量" width="100" />
        <el-table-column label="发放方式" width="100">
          <template #default="{ row }">
            <el-tag :type="getGrantTypeTag(row.grant_type)">
              {{ getGrantTypeText(row.grant_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="200">
          <template #default="{ row }">
            {{ getValidTimeText(row) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" link @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button type="danger" link @click="handleDelete(row)">
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建优惠券' : '编辑优惠券'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="coupon-form"
      >
        <el-form-item label="券名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入券名称" />
        </el-form-item>

        <el-form-item label="券类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择券类型">
            <el-option label="满减券" value="full" />
            <el-option label="折扣券" value="discount" />
            <el-option label="代金券" value="cash" />
          </el-select>
        </el-form-item>

        <el-form-item label="优惠内容" prop="quota">
          <el-input-number
            v-model="form.quota"
            :min="0"
            :precision="form.type === 'discount' ? 2 : 0"
            :step="form.type === 'discount' ? 0.1 : 1"
          />
          <span class="unit-text">
            {{ form.type === 'discount' ? '折' : '元' }}
          </span>
        </el-form-item>

        <el-form-item label="使用门槛" prop="min_amount">
          <el-input-number
            v-model="form.min_amount"
            :min="0"
            :precision="0"
            :step="10"
          />
          <span class="unit-text">元</span>
        </el-form-item>

        <el-form-item label="发放数量" prop="total">
          <el-input-number
            v-model="form.total"
            :min="1"
            :precision="0"
            :step="100"
          />
        </el-form-item>

        <el-form-item label="发放方式" prop="grant_type">
          <el-select v-model="form.grant_type" placeholder="请选择发放方式">
            <el-option label="登录发放" value="login" />
            <el-option label="手动发放" value="manual" />
            <el-option label="秒杀发放" value="seckill" />
          </el-select>
        </el-form-item>

        <el-form-item label="有效期" prop="valid_type">
          <el-radio-group v-model="form.valid_type">
            <el-radio label="relative">相对时间</el-radio>
            <el-radio label="fixed">固定时间</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.valid_type === 'relative'">
          <el-form-item label="有效天数" prop="valid_days">
            <el-input-number
              v-model="form.valid_days"
              :min="1"
              :precision="0"
              :step="1"
            />
            <span class="unit-text">天</span>
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item label="开始时间" prop="start_time">
            <el-date-picker
              v-model="form.start_time"
              type="datetime"
              placeholder="选择开始时间"
            />
          </el-form-item>
          <el-form-item label="结束时间" prop="end_time">
            <el-date-picker
              v-model="form.end_time"
              type="datetime"
              placeholder="选择结束时间"
            />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { API } from '../../config/api'

// 列表数据
const loading = ref(false)
const couponList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('create')
const formRef = ref(null)
const form = reactive({
  name: '',
  type: 'full',
  quota: 0,
  min_amount: 0,
  total: 100,
  grant_type: 'manual',
  valid_type: 'relative',
  valid_days: 7,
  start_time: null,
  end_time: null
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入券名称', trigger: 'blur' },
    { max: 50, message: '券名称不能超过50个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择券类型', trigger: 'change' }
  ],
  quota: [
    { required: true, message: '请输入优惠内容', trigger: 'blur' }
  ],
  total: [
    { required: true, message: '请输入发放数量', trigger: 'blur' }
  ],
  grant_type: [
    { required: true, message: '请选择发放方式', trigger: 'change' }
  ],
  valid_days: [
    { required: true, message: '请输入有效天数', trigger: 'blur' }
  ],
  start_time: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  end_time: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ]
}

// 获取优惠券列表
const fetchCoupons = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      index: currentPage.value,
      size: pageSize.value
    })
    
    const res = await request(`${API.COUPON.TEMPLATE_LIST}?${params}`)
    if (res.data && res.data.code === 200) {
      couponList.value = res.data.data || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取优惠券列表失败:', error)
    ElMessage.error('获取优惠券列表失败')
  } finally {
    loading.value = false
  }
}

// 创建优惠券
const handleCreate = () => {
  dialogType.value = 'create'
  Object.assign(form, {
    name: '',
    type: 'full',
    quota: 0,
    min_amount: 0,
    total: 100,
    grant_type: 'manual',
    valid_type: 'relative',
    valid_days: 7,
    start_time: null,
    end_time: null
  })
  dialogVisible.value = true
}

// 编辑优惠券
const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.assign(form, {
    ...row,
    valid_type: row.valid_days ? 'relative' : 'fixed'
  })
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    const submitData = {
      ...form,
      start_time: form.valid_type === 'fixed' ? form.start_time.getTime() : undefined,
      end_time: form.valid_type === 'fixed' ? form.end_time.getTime() : undefined,
      valid_days: form.valid_type === 'relative' ? form.valid_days : undefined
    }

    const url = dialogType.value === 'create' 
      ? API.COUPON.TEMPLATE_CREATE
      : `${API.COUPON.TEMPLATE_UPDATE}/${form.code}`

    const res = await request(url, {
      method: dialogType.value === 'create' ? 'POST' : 'PUT',
      data: submitData
    })

    if (res.data && res.data.code === 200) {
      ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功')
      dialogVisible.value = false
      fetchCoupons()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(error.message || '提交失败')
  }
}

const handleStatusChange = async (row) => {
  if (typeof row.status !== 'number') {
    ElMessage.warning('状态无效，无法提交')
    return
  }

  try {
    const res = await request(`${API.COUPON.TEMPLATE_STATUS}/${row.code}`, {
      method: 'PUT',
      data: {
        status: row.status
      }
    })
    if (res.data && res.data.code === 200) {
      ElMessage.success(row.status === 1 ? '启用成功' : '禁用成功')
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    row.status = row.status === 1 ? 0 : 1 // 恢复状态
  }
}


// 删除优惠券
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该优惠券吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request(`${API.COUPON.TEMPLATE_DELETE}/${row.code}`, {
        method: 'DELETE'
      })
      if (res.data && res.data.code === 200) {
        ElMessage.success('删除成功')
        fetchCoupons()
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 分页相关
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchCoupons()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchCoupons()
}

// 工具函数
const getCouponTypeTag = (type) => {
  const map = {
    full: 'success',
    discount: 'warning',
    cash: 'info'
  }
  return map[type] || 'info'
}

const getCouponTypeText = (type) => {
  const map = {
    full: '满减券',
    discount: '折扣券',
    cash: '代金券'
  }
  return map[type] || type
}

const getCouponQuotaText = (row) => {
  if (row.type === 'discount') {
    return `${row.quota}折`
  }
  return `${row.quota}元`
}

const getGrantTypeTag = (type) => {
  const map = {
    login: 'success',
    manual: 'info',
    seckill: 'warning'
  }
  return map[type] || 'info'
}

const getGrantTypeText = (type) => {
  const map = {
    login: '登录发放',
    manual: '手动发放',
    seckill: '秒杀发放'
  }
  return map[type] || type
}

const getValidTimeText = (row) => {
  if (row.valid_days) {
    return `领取后${row.valid_days}天有效`
  }
  return `${new Date(row.start_time).toLocaleString()} 至 ${new Date(row.end_time).toLocaleString()}`
}

onMounted(() => {
  fetchCoupons()
})
</script>

<style scoped>
.coupon-management {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.coupon-list {
  margin-bottom: 24px;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.coupon-form {
  .unit-text {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
  }

  :deep(.el-input-number) {
    width: 180px;
  }

  :deep(.el-select) {
    width: 100%;
  }
}

:deep(.el-table) {
  .el-tag {
    text-transform: capitalize;
  }
}
</style> 