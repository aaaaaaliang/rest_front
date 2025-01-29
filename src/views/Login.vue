<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>餐厅点餐系统</h2>
      </div>
      
      <el-form 
        :model="loginForm" 
        :rules="rules" 
        ref="loginFormRef"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-radio-group v-model="loginForm.role" class="role-select">
            <el-radio label="user">用户端</el-radio>
            <el-radio label="admin">商家端</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleLogin" class="login-button">
            登录
          </el-button>
        </el-form-item>
        
        <div class="login-links">
          <router-link to="/register">注册账号</router-link>
          <a href="javascript:void(0)">忘记密码？</a>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loginFormRef = ref(null)

const loginForm = reactive({
  username: '',
  password: '',
  role: 'user'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // TODO: 调用登录 API
        // const res = await login(loginForm)
        
        // 模拟登录成功
        localStorage.setItem('token', 'dummy-token')
        
        ElMessage.success('登录成功')
        
        // 根据角色跳转到不同页面
        if (loginForm.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/')
        }
      } catch (error) {
        ElMessage.error('登录失败')
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #333;
  font-size: 24px;
  margin: 0;
}

.login-form {
  margin-top: 30px;
}

.role-select {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 30px;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.login-links a {
  color: #1890ff;
  text-decoration: none;
  font-size: 14px;
}

.login-links a:hover {
  color: #40a9ff;
}
</style> 