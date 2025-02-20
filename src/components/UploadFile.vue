<template>
  <div class="upload-component">
    <el-upload
      :action="`${API.BASE_URL}${API.UPLOAD.FILE}`"
      :show-file-list="false"
      :http-request="customUpload"
      :before-upload="handleBeforeUpload"
      :accept="accept"
      name="file"
    >
      <template v-if="modelValue">
        <el-image
          v-if="isImage"
          :src="modelValue"
          fit="cover"
          :style="imageStyle"
          class="preview-image"
        >
          <template #error>
            <div class="image-error">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
        <div v-else class="file-link">
          <el-link :href="modelValue" target="_blank">{{ fileName }}</el-link>
        </div>
      </template>
      
      <el-button v-else type="primary">
        <el-icon><Upload /></el-icon>
        <span>点击上传</span>
      </el-button>

      <template #tip>
        <div class="upload-tip" v-if="tip">{{ tip }}</div>
      </template>
    </el-upload>

    <div class="actions" v-if="modelValue">
      <el-button type="danger" link @click="handleRemove">删除</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Upload } from '@element-plus/icons-vue'
import { API } from '../config/api'

const props = defineProps({
  modelValue: String,
  accept: {
    type: String,
    default: 'image/*'
  },
  maxSize: {
    type: Number,
    default: 2 // 默认2MB
  },
  tip: String,
  width: {
    type: [String, Number],
    default: '120px'
  },
  height: {
    type: [String, Number],
    default: '120px'
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'remove'])

// 判断是否为图片
const isImage = computed(() => {
  if (!props.modelValue) return false
  const ext = props.modelValue.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
})

// 获取文件名
const fileName = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.split('/').pop()
})

// 图片样式
const imageStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

// 自定义上传方法
const customUpload = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API.BASE_URL}${API.UPLOAD.FILE}`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    
    const res = await response.json()
    
    if (res.code === 200 && res.data && res.data.url) {
      emit('update:modelValue', res.data.url)
      emit('success', res)
      ElMessage.success('上传成功')
    } else {
      throw new Error(res.message || '上传失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '上传失败')
  }
}

// 上传前验证
const handleBeforeUpload = (file) => {
  const isLtMax = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMax) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB!`)
    return false
  }
  return true
}

// 删除文件
const handleRemove = () => {
  emit('update:modelValue', '')
  emit('remove')
}
</script>

<style scoped>
.upload-component {
  display: inline-block;
}

.preview-image {
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
}

.file-link {
  margin-bottom: 8px;
}

.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}

.actions {
  margin-top: 8px;
  text-align: center;
}
</style> 