<template>
  <div class="image-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-input
              v-model="searchQuery"
              placeholder="搜索图片名称"
              style="width: 300px"
              clearable
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-select 
              v-model="categoryFilter" 
              placeholder="分类" 
              clearable
              style="margin-left: 16px; width: 120px"
              @change="handleSearch"
            >
              <el-option 
                v-for="item in categories"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          
          <el-button type="primary" @click="handleUpload">
            上传图片
          </el-button>
        </div>
      </template>

      <div class="image-list">
        <el-row :gutter="20">
          <el-col 
            v-for="image in imageList" 
            :key="image.id" 
            :span="6"
          >
            <el-card 
              :body-style="{ padding: '0px' }" 
              shadow="hover"
              class="image-card"
            >
              <el-image 
                :src="image.url" 
                fit="cover"
                class="image"
                :preview-src-list="[image.url]"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              
              <div class="image-info">
                <div class="info-content">
                  <h4>{{ image.name }}</h4>
                  <p>{{ image.category }}</p>
                  <p>{{ image.createTime }}</p>
                </div>
                
                <div class="image-actions">
                  <el-button 
                    type="primary" 
                    link
                    @click="handleCopy(image)"
                  >
                    复制链接
                  </el-button>
                  <el-button 
                    type="danger" 
                    link
                    @click="handleDelete(image)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 36, 48]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

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
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Picture, Plus } from '@element-plus/icons-vue'

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

// 处理上传
const handleUpload = () => {
  uploadDialogVisible.value = true
  uploadForm.name = ''
  uploadForm.category = ''
  uploadForm.url = ''
  uploadForm.file = null
}

const handleUploadSuccess = (response) => {
  uploadForm.url = response.url
  uploadForm.file = response.url
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
</script>

<style scoped>
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