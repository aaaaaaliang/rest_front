<template>
  <div class="category-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分类管理</span>
          <el-button type="primary" @click="handleAdd(null)">
            新增顶级分类
          </el-button>
        </div>
      </template>

      <!-- 分类树形表格 -->
      <el-table
        :data="sortedCategories"
        row-key="code"
        border
        :tree-props="{ children: 'sub_categories' }"
        v-loading="categoryStore.loading"
      >
        <el-table-column prop="CategoryName" label="分类名称" min-width="200" />
        <el-table-column prop="Sort" label="排序" width="100" align="center" />
        <el-table-column label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatTime(row.created) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link
              @click="handleAdd(row.code)"
            >
              添加子分类
            </el-button>
            <el-button 
              type="primary" 
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除此分类吗？"
              @confirm="handleDelete(row.code)"
            >
              <template #reference>
                <el-button 
                  type="danger" 
                  link
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增分类' : '编辑分类'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="category_name">
          <el-input v-model="form.category_name" />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="1" />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useCategoryStore } from '../../stores/category'

const categoryStore = useCategoryStore()
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitting = ref(false)
const formRef = ref()

// 计算总分类数
const totalCategories = computed(() => {
  let count = 0
  const countCategories = (categories) => {
    categories.forEach(category => {
      count++
      if (category.sub_categories?.length) {
        countCategories(category.sub_categories)
      }
    })
  }
  countCategories(categoryStore.categories)
  return count
})

// 排序分类
const sortedCategories = computed(() => {
  const sortCategories = (categories) => {
    return [...categories].sort((a, b) => {
      if (a.Sort !== b.Sort) {
        return a.Sort - b.Sort
      }
      // 如果排序值相同，按创建时间排序
      return b.created - a.created
    }).map(category => ({
      ...category,
      sub_categories: category.sub_categories ? sortCategories(category.sub_categories) : []
    }))
  }
  return sortCategories(categoryStore.categories)
})

// 表单数据
const form = ref({
  code: '',
  parent_code: '',
  category_name: '',
  sort: 1
})

// 表单验证规则
const rules = {
  category_name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 255, message: '分类名称不能超过255个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
}

// 格式化时间戳
const formatTime = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString()
}

// 新增分类
const handleAdd = (parentCode) => {
  dialogType.value = 'add'
  form.value = {
    code: '',
    parent_code: parentCode || '',
    category_name: '',
    sort: 1
  }
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.value = {
    code: row.code,
    category_name: row.CategoryName,
    sort: row.Sort
  }
  dialogVisible.value = true
}

// 删除分类
const handleDelete = async (code) => {
  try {
    await categoryStore.deleteCategory(code)
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'add') {
          await categoryStore.createCategory(form.value)
          ElMessage.success('创建成功')
        } else {
          await categoryStore.updateCategory(form.value)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
      } catch (error) {
        ElMessage.error(error.message)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 初始化获取分类列表
onMounted(() => {
  categoryStore.fetchCategories()
})
</script>

<style scoped>
.category-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-table__row) {
  .cell {
    .el-button {
      padding: 4px 8px;
    }
  }
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}
</style> 