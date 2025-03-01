<template>
  <div class="banner-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>轮播图管理</span>
          <el-button 
            type="primary" 
            @click="handleAdd"
            v-if="hasPermission('api_banner_post')"
          >
            <el-icon><Plus /></el-icon> 添加轮播图
          </el-button>
        </div>
      </template>

      <!-- 轮播图列表 -->
      <el-table 
        v-loading="loading"
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
        <el-table-column prop="code" label="编号" min-width="200" />

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link
              @click="handleEdit(row)"
              v-if="hasPermission('api_banner_put')"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              link
              @click="handleDelete(row)"
              v-if="hasPermission('api_banner_delete')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="page.index"
          v-model:page-size="page.size"
          :total="page.total"
          :page-sizes="[10, 20, 30]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 编辑对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="form.code ? '编辑轮播图' : '添加轮播图'"
        width="500px"
      >
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="80px"
        >
          <el-form-item label="图片" prop="image">
            <div class="upload-container">
              <el-upload
                class="image-uploader"
                :action="`${baseUrl}/api/upload`"
                :show-file-list="false"
                :before-upload="beforeUpload"
                :on-success="handleUploadSuccess"
                :on-error="handleUploadError"
                :headers="{
                  'Accept': 'application/json'
                }"
                name="file"
                :data="{
                  _t: Date.now() // 添加时间戳防止缓存
                }"
              >
                <img v-if="form.image" :src="form.image" class="uploaded-image">
                <div v-else class="upload-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>点击上传</span>
                </div>
              </el-upload>
            </div>
          </el-form-item>

          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入标题" />
          </el-form-item>

          <el-form-item label="排序" prop="sort">
            <el-input-number 
              v-model="form.sort" 
              :min="1" 
              :max="99"
              controls-position="right"
            />
          </el-form-item>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'
import { hasPermission } from '../../utils/permissions'  // 导入权限检查函数

const baseUrl = "http://localhost:8888"
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const banners = ref([])

// 分页数据
const page = reactive({
  index: 1,
  size: 10,
  total: 0
})

// 表单数据
const form = ref({
  code: '',
  image: '',
  title: '',
  sort: 1  // 添加排序字段，默认值为 1
})

// 表单校验规则
const rules = {
  image: [{ required: true, message: '请上传图片', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }]
}

// 封装 HTTP 请求方法
const http = {
  async get(url, params = {}) {
    // 添加时间戳防止缓存
    params._t = Date.now()
    console.log('GET 请求:', { url, params })
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    console.log('完整 URL:', fullUrl)
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })
    const data = await response.json()
    console.log('GET 响应:', data)
    return data
  },

  async post(url, data) {
    console.log('POST 请求:', { url, data })
    const body = JSON.stringify(data)
    console.log('请求体:', body)
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    })
    const result = await response.json()
    console.log('POST 响应:', result)
    return result
  },

  async put(url, data) {
    console.log('PUT 请求:', { url, data })
    const body = JSON.stringify(data)
    console.log('请求体:', body)
    
    const response = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    })
    const result = await response.json()
    console.log('PUT 响应:', result)
    return result
  },

  async delete(url, params = {}) {
    console.log('DELETE 请求:', { url, params })
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    console.log('完整 URL:', fullUrl)
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })
    const result = await response.json()
    console.log('DELETE 响应:', result)
    return result
  }
}

// 获取轮播图列表
const fetchBanners = async () => {
  loading.value = true
  try {
    const res = await http.get(`${baseUrl}/api/banner`, {
      index: page.index,
      size: page.size
    })
    
    if (res.code === 200) {
      banners.value = res.data || []
      page.total = res.total || 0
    } else {
      throw new Error(res.message)
    }
  } catch (error) {
    console.error('获取轮播图列表失败:', error)
    ElMessage.error('获取轮播图列表失败')
    banners.value = []
    page.total = 0
  } finally {
    loading.value = false
  }
}

// 添加轮播图
const handleAdd = () => {
  form.value = {
    code: '',
    image: '',
    title: '',
    sort: 1  // 设置默认排序值
  }
  dialogVisible.value = true
}

// 编辑轮播图
const handleEdit = (row) => {
  form.value = { 
    ...row,
    sort: row.sort || 1  // 如果没有排序值，使用默认值
  }
  dialogVisible.value = true
}

// 删除轮播图
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个轮播图吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await http.delete(`${baseUrl}/api/banner`, {
      code: row.code
    })
    
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchBanners()
    } else {
      throw new Error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 上传相关方法
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

const handleUploadSuccess = (res) => {
  console.log('上传成功:', res)
  if (res.code === 200) {
    form.value.image = res.data.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

const handleUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('上传失败')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const isEdit = !!form.value.code
        console.log('原始表单数据:', JSON.stringify(form.value, null, 2))
        
        const data = {
          code: form.value.code,
          image: form.value.image,
          title: form.value.title,
          sort: Number(form.value.sort)  // 确保 sort 是数字类型
        }
        console.log('发送的数据:', JSON.stringify(data, null, 2))
        console.log('请求方法:', isEdit ? 'PUT' : 'POST')
        console.log('请求URL:', `${baseUrl}/api/banner`)

        const res = isEdit 
          ? await http.put(`${baseUrl}/api/banner`, data)
          : await http.post(`${baseUrl}/api/banner`, data)
        
        console.log('服务器响应:', JSON.stringify(res, null, 2))
        
        if (res.code === 200) {
          ElMessage.success(isEdit ? '更新成功' : '添加成功')
          dialogVisible.value = false
          fetchBanners()
        } else {
          throw new Error(res.message)
        }
      } catch (error) {
        console.error('提交失败:', error)
        console.error('错误详情:', {
          message: error.message,
          stack: error.stack,
          response: error.response
        })
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 分页方法
const handleSizeChange = (val) => {
  page.size = val
  page.index = 1
  fetchBanners()
}

const handleCurrentChange = (val) => {
  page.index = val
  fetchBanners()
}

// 初始化
onMounted(() => {
  fetchBanners()
})
</script>

<style scoped>
.banner-management {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.upload-container {
  width: 200px;
}

.image-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.image-uploader:hover {
  border-color: var(--el-color-primary);
}

.uploaded-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
}

.upload-placeholder {
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.upload-placeholder .el-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
</style>