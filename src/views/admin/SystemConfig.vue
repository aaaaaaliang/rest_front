<template>
  <div class="system-config">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统配置</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 基础配置 -->
        <el-tab-pane label="基础配置" name="basic">
          <el-form
            ref="basicFormRef"
            :model="basicConfig"
            label-width="120px"
          >
            <el-form-item label="系统名称">
              <el-input v-model="basicConfig.systemName" />
            </el-form-item>
            
            <el-form-item label="系统Logo">
              <el-upload
                class="logo-upload"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleLogoSuccess"
                :before-upload="beforeLogoUpload"
              >
                <img v-if="basicConfig.logo" :src="basicConfig.logo" class="logo">
                <el-icon v-else class="upload-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>

            <el-form-item label="系统图标">
              <el-upload
                class="favicon-upload"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleFaviconSuccess"
                :before-upload="beforeFaviconUpload"
              >
                <img v-if="basicConfig.favicon" :src="basicConfig.favicon" class="favicon">
                <el-icon v-else class="upload-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>

            <el-form-item label="页脚版权">
              <el-input v-model="basicConfig.copyright" />
            </el-form-item>

            <el-form-item label="备案信息">
              <el-input v-model="basicConfig.icp" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 主题配置 -->
        <el-tab-pane label="主题配置" name="theme">
          <el-form
            ref="themeFormRef"
            :model="themeConfig"
            label-width="120px"
          >
            <el-form-item label="主题模式">
              <el-radio-group v-model="themeConfig.mode">
                <el-radio label="light">浅色模式</el-radio>
                <el-radio label="dark">深色模式</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="主题色">
              <el-color-picker v-model="themeConfig.primaryColor" />
            </el-form-item>

            <el-form-item label="菜单样式">
              <el-radio-group v-model="themeConfig.menuStyle">
                <el-radio label="dark">深色</el-radio>
                <el-radio label="light">浅色</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 支付配置 -->
        <el-tab-pane label="支付配置" name="payment">
          <el-form
            ref="paymentFormRef"
            :model="paymentConfig"
            label-width="120px"
          >
            <el-divider>微信支付配置</el-divider>
            <el-form-item label="AppID">
              <el-input v-model="paymentConfig.wechat.appId" />
            </el-form-item>
            <el-form-item label="商户号">
              <el-input v-model="paymentConfig.wechat.mchId" />
            </el-form-item>
            <el-form-item label="API密钥">
              <el-input v-model="paymentConfig.wechat.apiKey" show-password />
            </el-form-item>
            <el-form-item label="启用状态">
              <el-switch v-model="paymentConfig.wechat.enabled" />
            </el-form-item>

            <el-divider>支付宝配置</el-divider>
            <el-form-item label="AppID">
              <el-input v-model="paymentConfig.alipay.appId" />
            </el-form-item>
            <el-form-item label="商户私钥">
              <el-input
                v-model="paymentConfig.alipay.privateKey"
                type="textarea"
                :rows="4"
                show-password
              />
            </el-form-item>
            <el-form-item label="支付宝公钥">
              <el-input
                v-model="paymentConfig.alipay.publicKey"
                type="textarea"
                :rows="4"
              />
            </el-form-item>
            <el-form-item label="启用状态">
              <el-switch v-model="paymentConfig.alipay.enabled" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 客服配置 -->
        <el-tab-pane label="客服配置" name="customerService">
          <el-form
            ref="customerServiceFormRef"
            :model="customerServiceConfig"
            label-width="120px"
          >
            <el-form-item label="客服功能">
              <el-switch v-model="customerServiceConfig.enabled" />
            </el-form-item>
            
            <el-form-item label="工作时间">
              <el-time-picker
                v-model="customerServiceConfig.workStartTime"
                format="HH:mm"
                placeholder="开始时间"
              />
              <span class="mx-2">至</span>
              <el-time-picker
                v-model="customerServiceConfig.workEndTime"
                format="HH:mm"
                placeholder="结束时间"
              />
            </el-form-item>

            <el-form-item label="欢迎语">
              <el-input
                v-model="customerServiceConfig.welcomeMessage"
                type="textarea"
                :rows="2"
              />
            </el-form-item>

            <el-form-item label="非工作时提示">
              <el-input
                v-model="customerServiceConfig.offlineMessage"
                type="textarea"
                :rows="2"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="form-footer">
        <el-button type="primary" @click="handleSave">保存配置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useThemeStore } from '../../stores/theme'

const themeStore = useThemeStore()

const activeTab = ref('basic')

// 基础配置
const basicConfig = reactive({
  systemName: '餐厅点餐系统',
  logo: '',
  favicon: '',
  copyright: '© 2024 餐厅点餐系统 版权所有',
  icp: '粤ICP备xxxxxxxx号'
})

// 主题配置
const themeConfig = reactive({
  mode: 'light',
  primaryColor: '#409EFF',
  menuStyle: 'dark'
})

// 支付配置
const paymentConfig = reactive({
  wechat: {
    appId: '',
    mchId: '',
    apiKey: '',
    enabled: true
  },
  alipay: {
    appId: '',
    privateKey: '',
    publicKey: '',
    enabled: true
  }
})

// 客服配置
const customerServiceConfig = reactive({
  enabled: true,
  workStartTime: '',
  workEndTime: '',
  welcomeMessage: '您好，请问有什么可以帮您？',
  offlineMessage: '当前非工作时间，请留言，我们会尽快回复。'
})

// 上传相关方法
const handleLogoSuccess = (response) => {
  basicConfig.logo = response.url
  ElMessage.success('Logo上传成功')
}

const handleFaviconSuccess = (response) => {
  basicConfig.favicon = response.url
  ElMessage.success('图标上传成功')
}

const beforeLogoUpload = (file) => {
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

const beforeFaviconUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt1M = file.size / 1024 / 1024 < 1

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt1M) {
    ElMessage.error('图标大小不能超过 1MB!')
    return false
  }
  return true
}

// 监听主题配置变化
watch(themeConfig, (newConfig) => {
  themeStore.setTheme(newConfig)
}, { deep: true })

// 保存配置时同时保存到本地存储
const handleSave = async () => {
  try {
    // TODO: 调用保存API
    localStorage.setItem('theme', JSON.stringify(themeConfig))
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error('配置保存失败')
  }
}
</script>

<style scoped>
.system-config {
  padding: 20px;
}

.logo-upload,
.favicon-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.logo-upload {
  width: 200px;
  height: 100px;
}

.favicon-upload {
  width: 60px;
  height: 60px;
}

.logo,
.favicon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-footer {
  margin-top: 20px;
  text-align: right;
}

.mx-2 {
  margin: 0 8px;
}
</style> 