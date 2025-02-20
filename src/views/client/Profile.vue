<template>
  <div class="profile-page">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h3>个人资料</h3>
        </div>
      </template>

      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="profile-form"
      >
        <el-form-item label="用户名">
          <el-input v-model="form.username" disabled />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.gender" placeholder="请选择性别">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="保密" value="secret" />
          </el-select>
        </el-form-item>

        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="form.real_name" placeholder="请输入真实姓名" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="不修改请留空"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            保存修改
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

// 表单数据
const form = reactive({
  username: '',
  nickname: '',
  email: '',
  gender: '',
  real_name: '',
  phone: '',
  password: ''
})

// 表单验证规则
const rules = {
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ]
}

// 初始化表单数据
const initForm = () => {
  const user = userStore.user
  if (user) {
    form.username = user.username || ''
    form.nickname = user.nickname || ''
    form.email = user.email || ''
    form.gender = user.gender || ''
    form.real_name = user.real_name || ''
    form.phone = user.phone || ''
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 过滤掉空密码
        const updateData = { ...form }
        if (!updateData.password) {
          delete updateData.password
        }

        const res = await userStore.updateUserInfo(updateData)
        if (res.data && res.data.code === 200) {
          ElMessage.success('更新成功')
        }
      } catch (error) {
        console.error('更新失败:', error)
        ElMessage.error(error.message || '更新失败')
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(() => {
  initForm()
})
</script>

<style scoped lang="scss">
.profile-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;

  .card-header {
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.profile-form {
  padding: 20px 0;
}
</style>
