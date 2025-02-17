<template>
  <div class="banner-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>轮播图管理</span>
          <el-button type="primary" @click="handleAdd">
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
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              link
              @click="handleDelete(row)"
            >
              删除
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
            <image-upload v-model="form.image" />
          </el-form-item>
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入标题" />
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
import ImageUpload from '../../components/ImageUpload.vue'
import request from '../../utils/request'
import { API } from '../../config/api'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const banners = ref([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  index: 1,
  size: 10
})

// 表单数据
const form = ref({
  code: '',
  image: '',
  title: ''
})

// 表单校验规则
const rules = {
  image: [{ required: true, message: '请上传图片', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

// 获取轮播图列表
const fetchBanners = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      index: queryParams.index,
      size: queryParams.size
    })
    const res = await request(`${API.BANNER.LIST}?${params}`)
    banners.value = res.data || []
    total.value = res.total || 0
  } catch (error) {
    ElMessage.error('获取轮播图列表失败')
  } finally {
    loading.value = false
  }
}

// 添加轮播图
const handleAdd = () => {
  form.value = {
    code: '',
    image: '',
    title: ''
  }
  dialogVisible.value = true
}

// 编辑轮播图
const handleEdit = (row) => {
  form.value = { ...row }
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
    await request(API.BANNER.DELETE, {
      method: 'DELETE',
      body: JSON.stringify({ code: row.code })
    })
    ElMessage.success('删除成功')
    fetchBanners()
  } catch {
    // 用户取消操作
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const method = form.value.code ? 'PUT' : 'POST'
        const url = API.BANNER.CREATE
        await request(url, {
          method,
          body: JSON.stringify(form.value)
        })
        ElMessage.success(form.value.code ? '更新成功' : '添加成功')
        dialogVisible.value = false
        fetchBanners()
      } finally {
        submitting.value = false
      }
    }
  })
}

// 处理分页
const handleSizeChange = (val) => {
  queryParams.size = val
  queryParams.index = 1
  fetchBanners()
}

const handleCurrentChange = (val) => {
  queryParams.index = val
  fetchBanners()
}

// 初始化
onMounted(() => {
  fetchBanners()
})
</script>

<style scoped lang="scss">
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
</style> 