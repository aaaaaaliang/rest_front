<template>
  <div class="profile">
    <el-row :gutter="20">
      <!-- 左侧个人信息 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
              <el-button 
                type="primary" 
                link
                @click="handleEdit"
              >
                编辑
              </el-button>
            </div>
          </template>
          
          <div class="user-info">
            <div class="avatar-container">
              <el-avatar 
                :size="100" 
                :src="userInfo.avatar"
              />
              <h3>{{ userInfo.username }}</h3>
            </div>
            
            <el-descriptions :column="1">
              <el-descriptions-item label="姓名">
                {{ userInfo.realName }}
              </el-descriptions-item>
              <el-descriptions-item label="手机号">
                {{ userInfo.phone }}
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">
                {{ userInfo.email }}
              </el-descriptions-item>
              <el-descriptions-item label="注册时间">
                {{ userInfo.createTime }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>

        <!-- 修改密码卡片 -->
        <el-card class="password-card">
          <template #header>
            <div class="card-header">
              <span>修改密码</span>
            </div>
          </template>
          
          <el-form
            :model="passwordForm"
            :rules="passwordRules"
            ref="passwordFormRef"
            label-width="100px"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input 
                v-model="passwordForm.oldPassword" 
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input 
                v-model="passwordForm.newPassword" 
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input 
                v-model="passwordForm.confirmPassword" 
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 主题设置卡片 -->
        <el-card class="theme-section">
          <template #header>
            <div class="card-header">
              <span>主题设置</span>
            </div>
          </template>
          
          <div class="theme-options">
            <div 
              class="theme-option"
              :class="{ active: currentTheme === 'light' }"
              @click="switchTheme('light')"
            >
              <el-icon class="theme-icon"><Sunny /></el-icon>
              <div class="theme-label">浅色模式</div>
            </div>
            
            <div 
              class="theme-option"
              :class="{ active: currentTheme === 'dark' }"
              @click="switchTheme('dark')"
            >
              <el-icon class="theme-icon"><Moon /></el-icon>
              <div class="theme-label">深色模式</div>
            </div>
            
            <div 
              class="theme-option"
              :class="{ active: currentTheme === 'auto' }"
              @click="switchTheme('auto')"
            >
              <el-icon class="theme-icon"><Monitor /></el-icon>
              <div class="theme-label">跟随系统</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧常用地址 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>常用地址</span>
              <el-button 
                type="primary"
                @click="handleAddAddress"
              >
                新增地址
              </el-button>
            </div>
          </template>
          
          <div class="address-list">
            <el-card 
              v-for="address in addresses" 
              :key="address.id"
              class="address-item"
              shadow="hover"
            >
              <div class="address-content">
                <div class="address-info">
                  <h4>
                    {{ address.name }}
                    <el-tag 
                      size="small" 
                      type="success"
                      v-if="address.isDefault"
                    >
                      默认
                    </el-tag>
                  </h4>
                  <p>{{ address.phone }}</p>
                  <p>{{ address.address }}</p>
                </div>
                <div class="address-actions">
                  <el-button 
                    type="primary" 
                    link
                    @click="handleEditAddress(address)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="danger" 
                    link
                    @click="handleDeleteAddress(address)"
                  >
                    删除
                  </el-button>
                  <el-button 
                    type="success" 
                    link
                    v-if="!address.isDefault"
                    @click="handleSetDefault(address)"
                  >
                    设为默认
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑个人信息对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      title="编辑个人信息"
      width="500px"
    >
      <el-form
        :model="userForm"
        :rules="userRules"
        ref="userFormRef"
        label-width="100px"
      >
        <el-form-item label="头像">
          <el-upload
            class="avatar-upload"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="userForm.avatar" :src="userForm.avatar" class="avatar">
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" disabled />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="userForm.realName" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitUser">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑地址对话框 -->
    <el-dialog
      v-model="addressDialogVisible"
      :title="addressDialogType === 'add' ? '新增地址' : '编辑地址'"
      width="500px"
    >
      <el-form
        :model="addressForm"
        :rules="addressRules"
        ref="addressFormRef"
        label-width="100px"
      >
        <el-form-item label="收货人" prop="name">
          <el-input v-model="addressForm.name" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addressForm.phone" />
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input
            v-model="addressForm.address"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault">
            设为默认地址
          </el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addressDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitAddress">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useThemeStore } from '../../stores/theme'
import { Sunny, Moon, Monitor } from '@element-plus/icons-vue'

// 用户信息数据
const userInfo = ref({
  username: 'user123',
  realName: '张三',
  phone: '13800138000',
  email: 'user@example.com',
  avatar: 'https://via.placeholder.com/100',
  createTime: '2024-01-01'
})

// 地址数据
const addresses = ref([
  {
    id: 1,
    name: '张三',
    phone: '13800138000',
    address: '北京市朝阳区xxx街道xxx小区',
    isDefault: true
  },
  {
    id: 2,
    name: '张三',
    phone: '13800138000',
    address: '北京市海淀区xxx街道xxx小区',
    isDefault: false
  }
])

// 对话框状态
const userDialogVisible = ref(false)
const addressDialogVisible = ref(false)
const addressDialogType = ref('add')

// 表单引用
const userFormRef = ref(null)
const addressFormRef = ref(null)
const passwordFormRef = ref(null)

// 表单数据
const userForm = reactive({
  username: '',
  realName: '',
  phone: '',
  email: '',
  avatar: ''
})

const addressForm = reactive({
  name: '',
  phone: '',
  address: '',
  isDefault: false
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单校验规则
const userRules = {
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const addressRules = {
  name: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value === passwordForm.oldPassword) {
    callback(new Error('新密码不能与原密码相同'))
  } else {
    if (passwordForm.confirmPassword !== '') {
      passwordFormRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, validator: validatePass, trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ]
}

// 个人信息相关方法
const handleEdit = () => {
  Object.assign(userForm, userInfo.value)
  userDialogVisible.value = true
}

const handleSubmitUser = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      // TODO: 调用更新用户信息API
      Object.assign(userInfo.value, userForm)
      userDialogVisible.value = false
      ElMessage.success('保存成功')
    }
  })
}

const handleAvatarSuccess = (response) => {
  userForm.avatar = response.url
}

const beforeAvatarUpload = (file) => {
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

// 地址相关方法
const handleAddAddress = () => {
  addressDialogType.value = 'add'
  Object.keys(addressForm).forEach(key => {
    addressForm[key] = key === 'isDefault' ? false : ''
  })
  addressDialogVisible.value = true
}

const handleEditAddress = (address) => {
  addressDialogType.value = 'edit'
  Object.assign(addressForm, address)
  addressDialogVisible.value = true
}

const handleDeleteAddress = (address) => {
  ElMessageBox.confirm(
    '确定要删除该地址吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // TODO: 调用删除地址API
    const index = addresses.value.findIndex(item => item.id === address.id)
    if (index > -1) {
      addresses.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  })
}

const handleSetDefault = (address) => {
  // TODO: 调用设置默认地址API
  addresses.value.forEach(item => {
    item.isDefault = item.id === address.id
  })
  ElMessage.success('设置成功')
}

const handleSubmitAddress = async () => {
  if (!addressFormRef.value) return
  
  await addressFormRef.value.validate(async (valid) => {
    if (valid) {
      // TODO: 调用新增/编辑地址API
      if (addressDialogType.value === 'add') {
        addresses.value.push({
          id: Date.now(),
          ...addressForm
        })
      } else {
        const index = addresses.value.findIndex(item => item.id === addressForm.id)
        if (index > -1) {
          addresses.value[index] = { ...addressForm }
        }
      }
      addressDialogVisible.value = false
      ElMessage.success('保存成功')
    }
  })
}

// 密码相关方法
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      // TODO: 调用修改密码API
      ElMessage.success('密码修改成功')
      Object.keys(passwordForm).forEach(key => {
        passwordForm[key] = ''
      })
    }
  })
}

const themeStore = useThemeStore()

const currentTheme = computed(() => themeStore.mode)

const switchTheme = (mode) => {
  themeStore.setTheme({
    ...themeStore.$state,
    mode
  })
  localStorage.setItem('theme', JSON.stringify(themeStore.$state))
}
</script>

<style scoped>
.profile {
  padding: 20px;
  
  .el-card {
    background-color: var(--card-bg);
    border-color: var(--border-color);
  }
  
  .info-item {
    color: var(--text-color);
  }
  
  .section-title {
    color: var(--text-color);
    border-bottom: 1px solid var(--border-color);
  }
  
  .avatar-upload {
    border-color: var(--border-color);
  }
  
  .upload-tip {
    color: var(--text-color-secondary);
  }
}

.theme-section {
  margin-top: 20px;
  
  .theme-options {
    display: flex;
    gap: 16px;
    margin-top: 16px;
  }
  
  .theme-option {
    padding: 16px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    
    &.active {
      border-color: var(--el-color-primary);
      background-color: var(--hover-bg);
    }
    
    .theme-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .theme-label {
      color: var(--text-color);
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.password-card {
  margin-top: 20px;
}

.user-info {
  text-align: center;
}

.avatar-container {
  margin-bottom: 20px;
}

.avatar-container h3 {
  margin: 10px 0;
}

.address-list {
  display: grid;
  gap: 16px;
}

.address-item {
  margin-bottom: 0;
}

.address-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.address-info h4 {
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.address-info p {
  margin: 5px 0;
  color: #666;
}

.address-actions {
  display: flex;
  gap: 8px;
}

.avatar-upload {
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

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}
</style>
