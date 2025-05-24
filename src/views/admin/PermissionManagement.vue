<template>
  <div class="permission-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>权限管理</span>
            <el-input
              v-model="queryParams.keyword"
              placeholder="搜索权限名称、路径、描述"
              clearable
              @input="handleSearch"
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <!-- 权限列表 -->
      <el-table
        :data="tableData"
        border
        v-loading="loading"
        class="table-list"
      >
        <el-table-column prop="name" label="权限名称" min-width="150">
          <template #default="{ row }">
            <div :class="['permission-name', { 'is-parent': !row.parent_code }]">
              <el-icon v-if="!row.parent_code"><Menu /></el-icon>
              {{ row.name }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="path" label="请求路径" min-width="200" />
        
        <el-table-column prop="method" label="请求方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.method" :type="getMethodTagType(row.method)">
              {{ row.method }}
            </el-tag>
            <span v-else class="no-method">无</span>
          </template>
        </el-table-column>

        <el-table-column prop="public" label="公开级别" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getPublicTagType(row.public)">
              {{ getPublicLabel(row.public) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />

        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              @click="handleEdit(row)"
              class="edit-btn"
            >
              编辑
            </el-button>
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

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑权限"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input 
            v-model="form.name"
            placeholder="请输入权限名称"
          />
        </el-form-item>

        <el-form-item label="请求路径" prop="path">
          <el-input 
            v-model="form.path"
            placeholder="请输入请求路径"
          />
        </el-form-item>

        <el-form-item label="请求方式" prop="method">
          <el-select v-model="form.method" placeholder="请选择请求方式">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>

        <el-form-item label="公开级别" prop="public">
          <el-select v-model="form.public" placeholder="请选择公开级别">
            <el-option label="公开" :value="0" />
            <el-option label="登录" :value="1" />
            <el-option label="授权" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="父权限" prop="parent_code">
          <el-select v-model="form.parent_code" placeholder="请选择父权限">
            <el-option label="无" :value="null" />
            <el-option v-for="permission in tableData" :key="permission.code" :label="permission.name" :value="permission.code" />
          </el-select>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
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
import { Search, Menu } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { API } from '../../config/api'

const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref()
const tableData = ref([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  index: 1,
  size: 10,
  keyword: ''
})

// 表单数据
const form = ref({
  code: '',
  name: '',
  path: '',
  method: '',
  description: '',
  public: 2,
  parent_code: null
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { max: 50, message: '权限名称不能超过50个字符', trigger: 'blur' }
  ],
  // path: [
  //   { required: true, message: '请输入请求路径', trigger: 'blur' }
  // ],
  // method: [
  //   { required: true, message: '请选择请求方式', trigger: 'change' }
  // ],
  public: [
    { required: true, message: '请选择公开级别', trigger: 'change' }
  ]
}

// 获取权限列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      index: queryParams.index,
      size: queryParams.size
    })
    if (queryParams.keyword) {
      params.append('keyword', queryParams.keyword)
    }
    
    const res = await request(`${API.PERMISSION.LIST}?${params}`)
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

// 编辑权限
const handleEdit = (row) => {
  form.value = {
    code: row.code,
    name: row.name,
    path: row.path || '',
    method: row.method || '',
    description: row.description,
    public: row.public,
    parent_code: row.parent_code
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
        const res = await request(API.PERMISSION.UPDATE, {
          method: 'PUT',
          data: form.value
        })
        
        if (res.data && res.data.code === 200) {
          ElMessage.success('更新成功')
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

// 获取请求方式标签类型
const getMethodTagType = (method) => {
  const types = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger'
  }
  return types[method] || 'info'
}

// 获取公开级别标签类型
const getPublicTagType = (publicLevel) => {
  const types = {
    0: 'success',
    1: 'warning',
    2: 'danger'
  }
  return types[publicLevel] || 'info'
}

// 获取公开级别标签文本
const getPublicLabel = (publicLevel) => {
  const labels = {
    0: '公开',
    1: '登录',
    2: '授权'
  }
  return labels[publicLevel] || '未知'
}

// 初始化
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.permission-management {
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
  width: 300px;
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

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .permission-management {
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

  .search-input {
    width: 100%;
  }
}

/* 编辑按钮样式 */
.edit-btn {
  font-weight: 500;
  padding: 4px 8px !important;
}

.edit-btn:hover {
  color: var(--el-color-primary-dark-2) !important;
  background-color: var(--el-color-primary-light-9) !important;
}

/* 无请求方式样式 */
.no-method {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

/* 权限名称样式 */
.permission-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.permission-name.is-parent {
  color: var(--el-color-primary);
  font-weight: 600;
}

.permission-name.is-parent .el-icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

/* 顶级权限行样式 */
:deep(.el-table__row.is-parent) {
  background-color: var(--el-color-primary-light-9);
}

:deep(.el-table__row.is-parent:hover) {
  background-color: var(--el-color-primary-light-8) !important;
}
</style> 