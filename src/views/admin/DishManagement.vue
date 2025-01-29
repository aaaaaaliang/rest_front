<template>
  <div class="dish-management">
    <!-- 左侧分类列表 -->
    <el-card class="category-card">
      <template #header>
        <div class="card-header">
          <span>菜品分类</span>
          <el-button type="primary" size="small" @click="handleAddCategory">
            新增分类
          </el-button>
        </div>
      </template>
      
      <el-tree
        :data="categories"
        :props="{ label: 'name' }"
        @node-click="handleCategoryClick"
        default-expand-all
      >
        <template #default="{ node, data }">
          <div class="category-node">
            <span>{{ node.label }}</span>
            <div class="category-actions">
              <el-button 
                type="primary" 
                link
                @click.stop="handleEditCategory(data)"
              >
                编辑
              </el-button>
              <el-button 
                type="danger" 
                link
                @click.stop="handleDeleteCategory(data)"
              >
                删除
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </el-card>

    <!-- 右侧菜品列表 -->
    <el-card class="dish-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>菜品列表</span>
            <el-tag style="margin-left: 8px" v-if="currentCategory">
              {{ currentCategory.name }}
            </el-tag>
          </div>
          <el-button type="primary" @click="handleAddDish">
            新增菜品
          </el-button>
        </div>
      </template>

      <el-table :data="dishes" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="图片" width="100">
          <template #default="scope">
            <el-image
              style="width: 50px; height: 50px"
              :src="scope.row.image"
              :preview-src-list="[scope.row.image]"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="菜品名称" />
        <el-table-column prop="price" label="价格">
          <template #default="scope">
            ¥{{ scope.row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="120">
          <template #default="scope">
            <el-input-number 
              v-model="scope.row.stock" 
              :min="0"
              :max="999"
              size="small"
              @change="handleStockChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEditDish(scope.row)">
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDeleteDish(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分类对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="categoryDialogType === 'add' ? '新增分类' : '编辑分类'"
      width="500px"
    >
      <el-form
        :model="categoryForm"
        :rules="categoryRules"
        ref="categoryFormRef"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="categoryForm.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitCategory">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 菜品对话框 -->
    <el-dialog
      v-model="dishDialogVisible"
      :title="dishDialogType === 'add' ? '新增菜品' : '编辑菜品'"
      width="600px"
    >
      <el-form
        :model="dishForm"
        :rules="dishRules"
        ref="dishFormRef"
        label-width="80px"
      >
        <el-form-item label="菜品名称" prop="name">
          <el-input v-model="dishForm.name" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="dishForm.categoryId" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number 
            v-model="dishForm.price" 
            :precision="2" 
            :step="0.1" 
            :min="0"
          />
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <el-upload
            class="dish-image-upload"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
          >
            <img v-if="dishForm.image" :src="dishForm.image" class="uploaded-image">
            <el-icon v-else class="upload-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="dishForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number
            v-model="dishForm.stock"
            :min="0"
            :max="999"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dishDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitDish">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 分类数据
const categories = ref([
  {
    id: 1,
    name: '热菜',
    sort: 1,
    children: [
      { id: 11, name: '川菜', sort: 1 },
      { id: 12, name: '粤菜', sort: 2 }
    ]
  },
  {
    id: 2,
    name: '凉菜',
    sort: 2
  },
  {
    id: 3,
    name: '主食',
    sort: 3
  }
])

// 菜品数据
const dishes = ref([
  {
    id: 1,
    name: '宫保鸡丁',
    price: 38.00,
    image: 'https://via.placeholder.com/100',
    categoryId: 11,
    categoryName: '川菜',
    status: 1,
    description: '经典川菜，口感麻辣鲜香'
  },
  {
    id: 2,
    name: '白切鸡',
    price: 48.00,
    image: 'https://via.placeholder.com/100',
    categoryId: 12,
    categoryName: '粤菜',
    status: 1,
    description: '鲜嫩多汁，配以姜葱酱'
  }
])

const currentCategory = ref(null)
const categoryDialogVisible = ref(false)
const categoryDialogType = ref('add')
const dishDialogVisible = ref(false)
const dishDialogType = ref('add')
const categoryFormRef = ref(null)
const dishFormRef = ref(null)

const categoryForm = reactive({
  name: '',
  sort: 0
})

const dishForm = reactive({
  name: '',
  categoryId: '',
  price: 0,
  image: '',
  description: '',
  stock: 0
})

const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' }
  ]
}

const dishRules = {
  name: [
    { required: true, message: '请输入菜品名称', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' }
  ],
  image: [
    { required: true, message: '请上传图片', trigger: 'change' }
  ]
}

// 分类相关方法
const handleAddCategory = () => {
  categoryDialogType.value = 'add'
  categoryForm.name = ''
  categoryForm.sort = 0
  categoryDialogVisible.value = true
}

const handleEditCategory = (category) => {
  categoryDialogType.value = 'edit'
  categoryForm.name = category.name
  categoryForm.sort = category.sort
  categoryDialogVisible.value = true
}

const handleDeleteCategory = (category) => {
  ElMessageBox.confirm(
    `确定要删除分类"${category.name}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // TODO: 调用删除API
    ElMessage.success('删除成功')
  })
}

const handleSubmitCategory = async () => {
  if (!categoryFormRef.value) return
  
  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      // TODO: 调用新增/编辑API
      categoryDialogVisible.value = false
      ElMessage.success('保存成功')
    }
  })
}

const handleCategoryClick = (category) => {
  currentCategory.value = category
  // TODO: 根据分类加载菜品列表
}

// 菜品相关方法
const handleAddDish = () => {
  dishDialogType.value = 'add'
  Object.keys(dishForm).forEach(key => {
    dishForm[key] = key === 'price' ? 0 : ''
  })
  dishDialogVisible.value = true
}

const handleEditDish = (dish) => {
  dishDialogType.value = 'edit'
  Object.keys(dishForm).forEach(key => {
    dishForm[key] = dish[key]
  })
  dishDialogVisible.value = true
}

const handleDeleteDish = (dish) => {
  ElMessageBox.confirm(
    `确定要删除菜品"${dish.name}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // TODO: 调用删除API
    ElMessage.success('删除成功')
  })
}

const handleStatusChange = (dish) => {
  // TODO: 调用状态更新API
  ElMessage.success(`菜品${dish.name}状态已${dish.status === 1 ? '上架' : '下架'}`)
}

const handleStockChange = (dish) => {
  // TODO: 调用库存更新API
  ElMessage.success(`菜品${dish.name}库存已更新为${dish.stock}`)
}

const handleSubmitDish = async () => {
  if (!dishFormRef.value) return
  
  await dishFormRef.value.validate(async (valid) => {
    if (valid) {
      // TODO: 调用新增/编辑API
      dishDialogVisible.value = false
      ElMessage.success('保存成功')
    }
  })
}

// 图片上传相关方法
const handleUploadSuccess = (response) => {
  dishForm.image = response.url
  ElMessage.success('上传成功')
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}
</script>

<style scoped>
.dish-management {
  padding: 20px;
  display: flex;
  gap: 20px;
}

.category-card {
  width: 300px;
  flex-shrink: 0;
}

.dish-card {
  flex-grow: 1;
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

.category-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-actions {
  display: none;
}

.category-node:hover .category-actions {
  display: flex;
  gap: 8px;
}

.dish-image-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
}
</style> 