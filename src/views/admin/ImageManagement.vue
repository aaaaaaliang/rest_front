<template>
  <div class="image-management">
    <div class="tab-header">
      <el-button type="primary" @click="handleAddBanner">
        <el-icon><Plus /></el-icon> 添加轮播图
      </el-button>
    </div>

    <!-- 轮播图列表 -->
    <el-table 
      v-loading="bannerLoading"
      :data="banners" 
      style="width: 100%"
    >
      <el-table-column label="预览图" width="200">
        <template #default="{ row }">
          <el-image
            :src="row.image"
            fit="cover"
            class="banner-image"
            :preview-src-list="[row.image]"
          >
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>

      <el-table-column prop="title" label="标题" min-width="200" />
      <!-- <el-table-column prop="code" label="编号" min-width="200" /> -->

      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            link
            @click="handleEditBanner(row)"
          >
            编辑
          </el-button>
          <el-button 
            type="danger" 
            link
            @click="handleDeleteBanner(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 轮播图分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="bannerQuery.index"
        v-model:page-size="bannerQuery.size"
        :total="bannerTotal"
        :page-sizes="[10, 20, 30]"
        background
        layout="total, sizes, prev, pager, next"
        @size-change="handleBannerSizeChange"
        @current-change="handleBannerCurrentChange"
      />
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传图片"
      width="500px"
    >
      <el-form
        ref="uploadFormRef"
        :model="uploadForm"
        :rules="uploadRules"
        label-width="80px"
      >
        <el-form-item label="图片名称" prop="name">
          <el-input v-model="uploadForm.name" />
        </el-form-item>
        
        <el-form-item label="分类" prop="category">
          <el-select v-model="uploadForm.category" style="width: 100%">
            <el-option 
              v-for="item in categories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="图片" prop="file">
          <el-upload
            class="image-upload"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeImageUpload"
          >
            <img v-if="uploadForm.url" :src="uploadForm.url" class="preview">
            <el-icon v-else class="upload-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持 jpg、png 格式，大小不超过 2MB</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUploadSubmit">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 轮播图编辑对话框 -->
    <el-dialog
      v-model="bannerDialogVisible"
      :title="bannerForm.code ? '编辑轮播图' : '添加轮播图'"
      width="500px"
    >
      <el-form
        ref="bannerFormRef"
        :model="bannerForm"
        :rules="bannerRules"
        label-width="80px"
      >
        <el-form-item label="图片" prop="picture.code">
          <upload-file
            v-model="bannerForm.picture.code"
            accept="image/*"
            :max-size="5"
            tip="支持 jpg、png、gif 格式，大小不超过5MB"
            @success="handleUploadSuccess"
          />
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="bannerForm.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number 
            v-model="bannerForm.sort" 
            :min="1" 
            :max="99"
            controls-position="right"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bannerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmitBanner">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Picture, Plus } from '@element-plus/icons-vue'
import UploadFile from '../../components/UploadFile.vue'
import request from '../../utils/request'
import { API } from '../../config/api'

// 分类选项
const categories = [
  { label: '轮播图', value: 'banner' },
  { label: '菜品图', value: 'dish' },
  { label: '头像', value: 'avatar' },
  { label: '其他', value: 'other' }
]

// 列表数据
const imageList = ref([
  {
    id: 1,
    name: '示例图片1',
    url: 'https://via.placeholder.com/300',
    category: '轮播图',
    createTime: '2024-01-01 12:00:00'
  }
  // ... 更多图片
])

// 分页和搜索
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(100)
const searchQuery = ref('')
const categoryFilter = ref('')

// 上传相关
const uploadDialogVisible = ref(false)
const uploadFormRef = ref(null)
const uploadForm = reactive({
  name: '',
  category: '',
  url: '',
  file: null
})

const uploadRules = {
  name: [
    { required: true, message: '请输入图片名称', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  file: [
    { required: true, message: '请上传图片', trigger: 'change' }
  ]
}

// 当前激活的 tab
const activeTab = ref('banner')

// 轮播图相关
const bannerLoading = ref(false)
const submitting = ref(false)
const bannerDialogVisible = ref(false)
const bannerFormRef = ref(null)
const banners = ref([])
const bannerTotal = ref(0)

// 轮播图查询参数
const bannerQuery = reactive({
  index: 1,
  size: 10,
  category: undefined
})

// 轮播图表单数据
const bannerForm = ref({
  code: '',
  picture: {
    code: '',
    name: ''
  },
  title: '',
  sort: 1,
})

// 轮播图表单校验规则
const bannerRules = {
  'picture.code': [{ required: true, message: '请上传图片', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
}

// 获取轮播图列表
const fetchBanners = async () => {
  bannerLoading.value = true
  try {
    const params = new URLSearchParams({
      index: bannerQuery.index,
      size: bannerQuery.size,
      ...(bannerQuery.category !== undefined ? { category: bannerQuery.category } : {})
    })
    const res = await request(`${API.BANNER.LIST}?${params}`)
    banners.value = res.data || []
    bannerTotal.value = res.total || 0
  } catch (error) {
    ElMessage.error('获取轮播图列表失败')
  } finally {
    bannerLoading.value = false
  }
}

// 添加轮播图
const handleAddBanner = () => {
  bannerForm.value = {
    code: '',
    picture: {
      code: '',
      name: ''
    },
    title: '',
    sort: 1,
  }
  bannerDialogVisible.value = true
}

// 编辑轮播图
const handleEditBanner = (row) => {
  bannerForm.value = {
    code: row.code,
    picture: {
      code: row.image,
      name: ''
    },
    title: row.title,
    sort: row.sort,
  }
  bannerDialogVisible.value = true
}

// 删除轮播图
const handleDeleteBanner = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个轮播图吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request(`${API.BANNER.DELETE}?code=${row.code}`, {
      method: 'DELETE'
    })
    ElMessage.success('删除成功')
    fetchBanners()
  } catch {
    // 用户取消操作
  }
}

// 提交轮播图表单
const handleSubmitBanner = async () => {
  if (!bannerFormRef.value) return
  
  await bannerFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const method = bannerForm.value.code ? 'PUT' : 'POST'
        const url = API.BANNER.CREATE
        const submitData = {
          code: bannerForm.value.code,
          image: bannerForm.value.picture.code,
          title: bannerForm.value.title,
          sort: bannerForm.value.sort,
        }

        await request(url, {
          method,
          body: JSON.stringify(submitData)
        })
        ElMessage.success(bannerForm.value.code ? '更新成功' : '添加成功')
        bannerDialogVisible.value = false
        fetchBanners()
      } finally {
        submitting.value = false
      }
    }
  })
}

// 处理轮播图分页
const handleBannerSizeChange = (val) => {
  bannerQuery.size = val
  bannerQuery.index = 1
  fetchBanners()
}

const handleBannerCurrentChange = (val) => {
  bannerQuery.index = val
  fetchBanners()
}

// 处理上传
const handleUpload = () => {
  uploadDialogVisible.value = true
  uploadForm.name = ''
  uploadForm.category = ''
  uploadForm.url = ''
  uploadForm.file = null
}

const handleUploadSuccess = (data) => {
  bannerForm.value.picture = {
    code: data.url,
    name: data.filename
  }
}

const beforeImageUpload = (file) => {
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

// 复制图片链接
const handleCopy = (image) => {
  navigator.clipboard.writeText(image.url).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  })
}

// 删除图片
const handleDelete = (image) => {
  ElMessageBox.confirm(
    '确定要删除这张图片吗？',
    '提示',
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

// 分页方法
const handleSizeChange = (val) => {
  pageSize.value = val
  // TODO: 重新加载数据
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  // TODO: 重新加载数据
}

// 搜索方法
const handleSearch = () => {
  // TODO: 调用搜索API
}

// 初始化
fetchBanners()
</script>

<style scoped lang="scss">
.image-management {
  padding: 16px;
}

.tab-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

.banner-image {
  width: 160px;
  height: 90px;
  border-radius: 4px;
  overflow: hidden;
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
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;

  :deep(.el-pagination) {
    padding: 0;
    margin: 0;
    font-weight: normal;

    .el-pagination__total {
      margin-right: 16px;
    }

    .el-pagination__sizes {
      margin-right: 16px;
    }

    button {
      background-color: var(--el-bg-color);
      
      &:disabled {
        background-color: var(--el-disabled-bg-color);
      }
    }

    .el-pager li {
      background-color: var(--el-bg-color);
      
      &.is-active {
        background-color: var(--el-color-primary);
      }
    }
  }
}

.image-management {
  padding: 20px;
}

.image-list {
  margin: 20px 0;
}

.image-card {
  margin-bottom: 20px;
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-5px);
  }
}

.image {
  width: 100%;
  height: 200px;
}

.image-error {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 30px;
}

.image-info {
  padding: 14px;
}

.info-content {
  h4 {
    margin: 0 0 10px;
    font-size: 14px;
    color: var(--text-color);
  }

  p {
    margin: 5px 0;
    font-size: 12px;
    color: var(--text-color-secondary);
  }
}

.image-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.image-upload {
  width: 200px;
  height: 200px;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-icon {
  font-size: 28px;
  color: var(--text-color-secondary);
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-tip {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-top: 8px;
}
</style> 