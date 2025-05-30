<template>
  <div class="ai-model-management">
    <el-card class="ai-card">
      <template #header>
        <div class="ai-header">
          <el-icon class="ai-icon"><Cpu /></el-icon>
          <span class="ai-title">AI模型配置管理</span>
        </div>
      </template>
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="120px"
        class="ai-form"
      >
        <el-form-item label="模型名称" prop="model_name">
          <el-input v-model="form.model_name" placeholder="如：阿亮餐厅助手" />
        </el-form-item>
        <el-form-item label="系统提示词" prop="prompt_intro">
          <el-input
            v-model="form.prompt_intro"
            type="textarea"
            :rows="8"
            placeholder="请输入系统提示词（Prompt）"
            resize="vertical"
          />
        </el-form-item>
        <el-form-item label="用户标签" prop="user_label">
          <el-input v-model="form.user_label" placeholder="如：用户" />
        </el-form-item>
        <el-form-item label="AI标签" prop="assistant_label">
          <el-input v-model="form.assistant_label" placeholder="如：AI客服" />
        </el-form-item>
        <el-form-item label="上下文轮数" prop="max_history">
          <el-input-number v-model="form.max_history" :min="1" :max="20" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            {{ isEdit ? '更新配置' : '创建配置' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <div class="ai-bg"></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Cpu } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { API } from '@/config/api'

const formRef = ref()
const form = reactive({
  code: '',
  model_name: '',
  prompt_intro: '',
  user_label: '用户',
  assistant_label: 'AI客服',
  max_history: 6
})
const rules = {
  model_name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  prompt_intro: [{ required: true, message: '请输入系统提示词', trigger: 'blur' }],
  user_label: [{ required: true, message: '请输入用户标签', trigger: 'blur' }],
  assistant_label: [{ required: true, message: '请输入AI标签', trigger: 'blur' }],
  max_history: [{ required: true, message: '请输入上下文轮数', trigger: 'blur' }]
}
const loading = ref(false)
const isEdit = ref(false)

// 获取当前模型配置
const fetchConfig = async () => {
  loading.value = true
  try {
    const res = await request('/api/ai-model')
    if (res.data && res.data.code === 200 && res.data.data) {
      Object.assign(form, res.data.data)
      isEdit.value = true
    }
  } finally {
    loading.value = false
  }
}
onMounted(fetchConfig)

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      let res
      if (isEdit.value) {
        res = await request('/api/ai-model', {
          method: 'PUT',
          data: form
        })
      } else {
        res = await request('/api/ai-model', {
          method: 'POST',
          data: form
        })
      }
      if (res.data && res.data.code === 200) {
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
        fetchConfig()
      } else {
        ElMessage.error(res.data?.message || '操作失败')
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.ai-model-management {
  position: relative;
  min-height: 100vh; /* 占满整个视口高度 */
  width: 100%; /* 占满整个视口宽度 */
  display: block; /* 移除flex布局居中 */
  padding: 20px; /* 增加内边距，防止内容贴边 */
  background: #1a2a3a; /* fallback */
  background: linear-gradient(135deg, #1a2a3a 0%, #4a2a5a 100%);
  overflow-y: auto; /* 允许垂直滚动 */
}
.ai-card {
  width: 480px;
  margin: 20px auto; /* 水平居中并添加垂直外边距 */
  z-index: 2;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border-radius: 18px;
  background: rgba(255,255,255,0.95); /* 保留一点透明度 */
  border: none;
}
.ai-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ai-icon {
  font-size: 28px;
  color: #409eff; /* Element Plus Primary color */
  filter: drop-shadow(0 0 8px #409eff88); /* 科技感光晕 */
}
.ai-title {
  font-size: 20px;
  font-weight: 700;
  color: #222; /* 深色文字 */
  letter-spacing: 2px;
}
.ai-form {
  margin-top: 18px;
}
.ai-bg {
  display: none;
}
</style> 