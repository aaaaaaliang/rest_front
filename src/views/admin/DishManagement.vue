<template>
  <div class="dish-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>菜品管理</span>
            <el-select 
              v-model="queryParams.category_code" 
              placeholder="选择分类"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="item in filterCategories"
                :key="item.code"
                :label="item.CategoryName"
                :value="item.code"
              />
            </el-select>
          </div>
          <el-button 
            type="primary" 
            @click="handleAdd"
            v-if="hasPermission('api_product_post')"
          >
            新增菜品
          </el-button>
        </div>
      </template>

      <!-- 菜品列表 -->
      <el-table
        :data="tableData"
        border
        v-loading="loading"
      >
        <el-table-column label="菜品图片" width="120" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.picture?.code"
              :src="row.picture.code"
              :preview-src-list="[row.picture.code]"
              fit="cover"
              style="width: 60px; height: 60px"
            />
            <el-icon v-else><Picture /></el-icon>
          </template>
        </el-table-column>
        
        <el-table-column prop="products_name" label="菜品名称" min-width="120" />
        <el-table-column prop="category_name" label="所属分类" width="120" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="count" label="库存" width="100" align="center" />
        <el-table-column prop="describe" label="描述" min-width="200" show-overflow-tooltip />

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              link
              @click="handleEdit(row)"
              v-if="hasPermission('api_product_put')"
            >
              编辑
            </el-button>

            <el-popconfirm
              title="确定删除此菜品吗？"
              @confirm="handleDelete(row.code)"
            >
              <template #reference>
                <el-button 
                  type="danger" 
                  link
                  v-if="hasPermission('api_product_delete')"
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
      :title="dialogType === 'add' ? '新增菜品' : '编辑菜品'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="菜品图片">
          <upload-file
            v-model="form.picture.code"
            accept="image/*"
            :max-size="5"
            tip="支持 jpg、png、gif 格式，大小不超过5MB"
            @success="handleUploadSuccess"
          >
            <template #preview>
              <el-image
                v-if="form.picture.code"
                :src="form.picture.code"
                fit="cover"
                style="width: 200px; height: 200px"
              />
            </template>
          </upload-file>
        </el-form-item>

        <el-form-item label="菜品名称" prop="products_name">
          <el-input v-model="form.products_name" />
        </el-form-item>

        <el-form-item label="所属分类" prop="category_code">
          <el-select 
            v-model="form.category_code" 
            placeholder="请选择分类"
            clearable
          >
            <el-option-group
              v-for="group in categoryOptions"
              :key="group.code"
              :label="group.CategoryName"
            >
              <el-option
                v-for="item in group.sub_categories"
                :key="item.code"
                :label="item.CategoryName"
                :value="item.code"
              />
              <!-- 如果该分类没有子分类，则显示自己 -->
              <el-option
                v-if="!group.sub_categories?.length"
                :key="group.code"
                :label="group.CategoryName"
                :value="group.code"
              />
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item label="价格" prop="price">
          <el-input-number 
            v-model="form.price"
            :precision="2"
            :step="0.1"
            :min="0"
          />
        </el-form-item>

        <el-form-item label="库存" prop="count">
          <el-input-number 
            v-model="form.count"
            :min="0"
            :precision="0"
          />
        </el-form-item>

        <el-form-item label="描述" prop="describe">
          <el-input 
            v-model="form.describe"
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="特色菜品">
          <el-switch
            v-model="form.main"
            :active-value="1"
            :inactive-value="0"
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { useCategoryStore } from '../../stores/category'
import UploadFile from '../../components/UploadFile.vue'
import request from '../../utils/request'
import { API } from '../../config/api'
import { hasPermission } from '../../utils/permissions'

const categoryStore = useCategoryStore()
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
  category_code: ''
})

// 表单数据
const form = ref({
  code: '',
  products_name: '',
  category_code: '',
  price: 0,
  count: 0,
  describe: '',
  main: 0,
  picture: {
    code: '',
    name: ''
  }
})

// 表单验证规则
const rules = {
  products_name: [
    { required: true, message: '请输入菜品名称', trigger: 'blur' },
    { max: 50, message: '菜品名称不能超过50个字符', trigger: 'blur' }
  ],
  category_code: [
    { required: true, message: '请选择所属分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' }
  ],
  count: [
    { required: true, message: '请输入库存数量', trigger: 'blur' }
  ]
}

// 获取菜品列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      index: queryParams.index,
      size: queryParams.size
    })
    if (queryParams.category_code) {
      params.append('category_code', queryParams.category_code)
    }
    
    const res = await request(`${API.PRODUCT.LIST}?${params}`)
    if (res.data && res.data.code === 200) {
      console.log("res-data:",res.data)
      tableData.value = res.data.data || []  // 使用 res.data.data 作为表格数据
      total.value = res.data.total || 0      // 从响应中获取总数
    }
  } catch (error) {
    ElMessage.error(error.message || '获取列表失败')
  } finally {
    loading.value = false
  }
}

// 修改分类数据处理逻辑
const categoryOptions = computed(() => {
  return categoryStore.categories.map(category => ({
    code: category.code,
    CategoryName: category.CategoryName,
    sub_categories: category.sub_categories || []
  }))
})

// 修改搜索框的分类选择器
const filterCategories = computed(() => {
  const result = []
  const processCategories = (categories) => {
    categories.forEach(category => {
      if (category.sub_categories?.length) {
        // 如果有子分类，添加子分类
        category.sub_categories.forEach(subCategory => {
          result.push({
            code: subCategory.code,
            CategoryName: `${category.CategoryName} / ${subCategory.CategoryName}`
          })
        })
      } else {
        // 如果没有子分类，添加当前分类
        result.push({
          code: category.code,
          CategoryName: category.CategoryName
        })
      }
    })
  }
  processCategories(categoryStore.categories)
  return result
})

// 修改上传成功的处理
const handleUploadSuccess = (res) => {
  console.log('上传响应:', res)  // 添加日志
  if (res.code === 200 && res.data) {
    form.value.picture = {
      code: res.data.url,
      name: res.data.filename
    }
    console.log('更新后的表单:', form.value)  // 添加日志
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}



// 修改表单初始化
const initForm = () => ({
  code: '',
  products_name: '',
  category_code: '',
  price: 0,
  count: 0,
  describe: '',
  main: 0,
  picture: {
    code: '',  // 确保初始化时有这个字段
    name: ''
  }
})

// 新增菜品
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = initForm()
  dialogVisible.value = true
}

// 编辑菜品
const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.value = {
    ...row,
    main: row.main || 0,
    picture: {
      code: row.picture?.code || '',  // 确保有 code
      name: row.picture?.name || ''
    }
  }
  console.log('编辑表单数据:', form.value)  // 添加日志
  dialogVisible.value = true
}

// 删除菜品
const handleDelete = async (code) => {
  try {
    const res = await request(`${API.PRODUCT.DELETE}?code=${code}`, {
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
        const api = dialogType.value === 'add' ? API.PRODUCT.CREATE : API.PRODUCT.UPDATE
        const method = dialogType.value === 'add' ? 'POST' : 'PUT'
        
        // 构建提交数据
        const submitData = {
          ...form.value,
          picture: form.value.picture?.code && form.value.picture?.name ? {
            code: form.value.picture.code,
            name: form.value.picture.name
          } : undefined
        }

        const res = await request(api, {
          method,
          data: submitData
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
  categoryStore.fetchCategories()
  fetchList()
})
</script>

<style scoped>
.dish-management {
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
  gap: 20px;
}

.header-left span {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

/* 分类选择器 */
:deep(.el-select) {
  width: 200px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--border-color);
  transition: all 0.3s ease;
}

:deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

/* 表格样式 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
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

/* 图片预览 */
:deep(.el-image) {
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

:deep(.el-image:hover) {
  transform: scale(1.05);
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

/* 上传组件样式 */
:deep(.upload-component) {
  .el-upload {
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .el-upload:hover {
    border-color: var(--el-color-primary);
  }

  .preview-image {
    border-radius: 8px;
    overflow: hidden;
  }
}

/* 开关样式 */
:deep(.el-switch) {
  --el-switch-on-color: var(--el-color-primary);
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .dish-management {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-left {
    width: 100%;
    justify-content: space-between;
  }

  :deep(.el-select) {
    width: 100%;
  }
}
</style> 