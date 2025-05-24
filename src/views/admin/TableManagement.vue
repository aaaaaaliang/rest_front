<template>
  <div class="table-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>餐桌管理</span>
            <el-input
              v-model="queryParams.query"
              placeholder="搜索位置或备注"
              clearable
              @input="handleSearch"
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="queryParams.status"
              placeholder="状态筛选"
              clearable
              @change="handleSearch"
              class="status-select"
            >
              <el-option label="可用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </div>
          <el-button 
            type="primary" 
            @click="handleAdd"
            v-if="hasPermission('api_table_post')"
            
          >
            <el-icon><Plus /></el-icon>
            新增餐桌
          </el-button>
        </div>
      </template>

      <!-- 餐桌列表 -->
      <el-table
        :data="tableData"
        border
        v-loading="loading"
        class="table-list"
      >
        <el-table-column label="位置" min-width="150">
          <template #default="{ row }">
            <div class="location-cell">
              <el-icon><Location /></el-icon>
              <span>{{ row.location || '未设置' }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="座位数" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">
              {{ row.seats }} 人座
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="light">
              {{ row.status === 1 ? '可用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="default"
              link
              @click="handleEdit(row)"
              v-if="hasPermission('api_table_put')"
            >
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除此餐桌吗？"
              @confirm="handleDelete(row.code)"
            >
              <template #reference>
                <el-button 
                  type="danger" 
                  link
                  v-if="hasPermission('api_table_delete')"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.index"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增餐桌' : '编辑餐桌'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="位置" prop="location">
          <el-input 
            v-model="form.location"
            placeholder="请输入餐桌位置"
          />
        </el-form-item>

        <el-form-item label="座位数" prop="seats">
          <el-input-number 
            v-model="form.seats"
            :min="1"
            :max="20"
            :step="1"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="可用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Location } from '@element-plus/icons-vue'
import { hasPermission } from '../../utils/permissions'
import request from '../../utils/request'
import { API } from '../../config/api'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitting = ref(false)
const formRef = ref()
const tableData = ref([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  index: 1,
  size: 10,
  query: '',
  status: ''
})

// 表单数据
const form = ref({
  code: '',
  location: '',
  seats: 4,
  status: 1,
  remark: ''
})

// 表单验证规则
const rules = {
  location: [
    { required: true, message: '请输入餐桌位置', trigger: 'blur' },
    { max: 50, message: '位置描述不能超过50个字符', trigger: 'blur' }
  ],
  seats: [
    { required: true, message: '请输入座位数', trigger: 'blur' }
  ]
}

// 获取餐桌列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      index: queryParams.index,
      size: queryParams.size
    })
    if (queryParams.query) {
      params.append('query', queryParams.query)
    }
    if (queryParams.status !== '') {
      params.append('status', queryParams.status)
    }
    
    const res = await request(`${API.TABLE.LIST}?${params}`)
    if (res.data && res.data.code === 200) {
      tableData.value = res.data.data || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error(error.message || '获取列表失败')
  } finally {
    loading.value = false
  }
}

// 新增餐桌
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    code: '',
    location: '',
    seats: 4,
    status: 1,
    remark: ''
  }
  dialogVisible.value = true
}

// 编辑餐桌
const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除餐桌
const handleDelete = async (code) => {
  try {
    const res = await request(`${API.TABLE.DELETE}?code=${code}`, {
      method: 'DELETE'
    })
    if (res.data && res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchList()
    }
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const api = dialogType.value === 'add' ? API.TABLE.CREATE : API.TABLE.UPDATE
        const method = dialogType.value === 'add' ? 'POST' : 'PUT'
        
        const res = await request(api, {
          method,
          data: form.value
        })
        
        if (res.data && res.data.code === 200) {
          ElMessage.success(dialogType.value === 'add' ? '创建成功' : '更新成功')
          dialogVisible.value = false
          fetchList()
        }
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 处理搜索
const handleSearch = () => {
  queryParams.index = 1
  fetchList()
}

// 处理分页
const handleSizeChange = (val) => {
  queryParams.size = val
  fetchList()
}

const handleCurrentChange = (val) => {
  queryParams.index = val
  fetchList()
}

// 初始化
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.table-management {
  padding: 24px;
  min-height: calc(100vh - 60px);
  background-color: var(--bg-color);
}

/* 卡片样式 */
:deep(.el-card) {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left span {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.search-input {
  width: 240px;
}

.status-select {
  width: 120px;
}

/* 表格样式 */
.table-list {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: var(--bg-color) !important;
  font-weight: 600;
  color: var(--text-color);
  padding: 12px 0;
}

:deep(.el-table td) {
  padding: 16px 0;
}

:deep(.el-table__row:hover) {
  background-color: var(--hover-bg) !important;
}

.location-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: var(--el-color-primary);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: var(--el-color-primary-dark-2);
  transform: translateY(-1px);
}

:deep(.el-button--text) {
  padding: 4px 8px;
}

:deep(.el-button--text:hover) {
  background: var(--hover-bg);
  border-radius: 4px;
}

/* 分页容器 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

/* 表单样式 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--text-color);
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--border-color);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

/* 开关样式 */
:deep(.el-switch) {
  --el-switch-on-color: var(--el-color-primary);
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .table-management {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-left {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-input,
  .status-select {
    width: 100%;
  }
}
</style> 