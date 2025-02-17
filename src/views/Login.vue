<template>
  <div class="login-container">
    <div class="login-content">
      <!-- 左侧表单区域 -->
      <div class="login-left">
        <div class="form-container">
          <h2 class="title">餐厅管理系统</h2>
          
          <div class="form-header">
            <div 
              class="tab-item" 
              :class="{ active: isLogin }"
              @click="isLogin = true"
            >
              登录
            </div>
            <div 
              class="tab-item" 
              :class="{ active: !isLogin }"
              @click="isLogin = false"
            >
              注册
            </div>
          </div>

          <!-- 登录表单 -->
          <el-form
            v-if="isLogin"
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="form"
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
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-form-item prop="captcha_solution" class="captcha-item">
              <el-input
                v-model="loginForm.captcha_solution"
                placeholder="验证码"
                :prefix-icon="Key"
              >
                <template #append>
                  <img 
                    :src="captchaImage"
                    alt="验证码"
                    class="captcha-img"
                    @click="refreshCaptcha"
                  >
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                class="submit-btn"
                :loading="loading"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 注册表单 -->
          <el-form
            v-else
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            class="form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="用户名"
                :prefix-icon="User"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="密码"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item prop="confirm_password">
              <el-input
                v-model="registerForm.confirm_password"
                type="password"
                placeholder="确认密码"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item prop="email">
              <el-input
                v-model="registerForm.email"
                placeholder="邮箱"
                :prefix-icon="Message"
              />
            </el-form-item>

            <el-form-item prop="captcha_solution" class="captcha-item">
              <el-input
                v-model="registerForm.captcha_solution"
                placeholder="验证码"
                :prefix-icon="Key"
              >
                <template #append>
                  <img 
                    :src="captchaImage"
                    alt="验证码"
                    class="captcha-img"
                    @click="refreshCaptcha"
                  >
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                class="submit-btn"
                :loading="loading"
                @click="handleRegister"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>

          <div class="oauth-login">
            <div class="divider">
              <span>第三方登录</span>
            </div>
            <el-button 
              class="github-btn"
              @click="handleGithubLogin"
            >
              <i class="fab fa-github"></i>
              GitHub 登录
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧图片区域 -->
      <div class="login-right">
        <img src="../assets/a.webp" alt="Login" class="login-bg">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Key, Message } from '@element-plus/icons-vue'
import request from '../utils/request'
import { API } from '../config/api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const isLogin = ref(true)
const loading = ref(false)
const captchaImage = ref('')
const captchaId = ref('')

// 登录表单
const loginFormRef = ref()
const loginForm = ref({
  username: '',
  password: '',
  captcha_id: '',
  captcha_solution: ''
})

// 注册表单
const registerFormRef = ref()
const registerForm = ref({
  username: '',
  password: '',
  confirm_password: '',
  email: '',
  captcha_id: '',
  captcha_solution: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  captcha_solution: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 个字符', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  captcha_solution: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

// 获取验证码
const getCaptcha = async () => {
  try {
    const data = await request(API.USER.CAPTCHA)
    captchaImage.value = data.data.captcha
    captchaId.value = data.data.id
    loginForm.value.captcha_id = data.data.id
    registerForm.value.captcha_id = data.data.id
  } catch (error) {
    console.error('获取验证码失败:', error)
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  getCaptcha()
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 1. 登录
        await request(API.USER.LOGIN, {
          method: 'POST',
          body: JSON.stringify(loginForm.value)
        })

        // 2. 获取用户角色信息
        const roleRes = await request(API.USER.GET_ROLE)
        
        // 3. 存储用户信息
        const userStore = useUserStore()
        userStore.setUserInfo({
          username: loginForm.value.username,
          user_code: roleRes.data.user_code,
          roles: roleRes.data.roles
        })

        ElMessage.success('登录成功')
        // 确保跳转执行
        await router.push('/admin')
      } catch (error) {
        ElMessage.error(error.message || '登录失败')
        refreshCaptcha()
      } finally {
        loading.value = false
      }
    }
  })
}

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await request(API.USER.REGISTER, {
          method: 'POST',
          body: JSON.stringify({
            username: registerForm.value.username,
            password: registerForm.value.password,
            email: registerForm.value.email,
            captcha_id: registerForm.value.captcha_id,
            captcha_solution: registerForm.value.captcha_solution
          })
        })
        ElMessage.success('注册成功')
        isLogin.value = true
        refreshCaptcha()
      } catch (error) {
        ElMessage.error(error.message)
        refreshCaptcha()
      } finally {
        loading.value = false
      }
    }
  })
}

// GitHub 登录
const handleGithubLogin = () => {
  window.location.href = API.BASE_URL + API.USER.GITHUB_LOGIN
}

// 切换登录/注册表单
const toggleForm = () => {
  isLogin.value = !isLogin.value
  refreshCaptcha()
}

onMounted(() => {
  getCaptcha()
})
</script>

<style scoped>
/* 🍂 **背景：秋天渐变（深金色 → 复古棕）** */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f4b860, #8c5326);
  font-family: "Poppins", sans-serif;
}

/* 🍂 **登录框** */
.login-content {
  display: flex;
  width: 900px;
  height: 580px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(140, 83, 38, 0.3);
  overflow: hidden;
}

/* 🍂 **左侧表单区域** */
.login-left {
  flex: 1;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

/* 🍂 **右侧图片区域** */
.login-right {
  flex: 1.2;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #a6611a, #733c14);
}

.login-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0 12px 12px 0;
}

/* 🍂 **表单容器** */
.form-container {
  width: 100%;
  max-width: 350px;
}

/* 🍂 **标题** */
.title {
  text-align: center;
  font-size: 26px;
  font-weight: bold;
  color: #9b591a;
  margin-bottom: 20px;
}

/* 🍂 **登录/注册切换** */
.form-header {
  display: flex;
  margin-bottom: 25px;
  border-bottom: 2px solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 16px;
  color: #b0794d;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
}

.tab-item.active {
  color: #d18927;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 3px;
  background: #d18927;
}

/* 🍂 **输入框：去掉颜色，只保留默认样式** */
.form :deep(.el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid #d1d1d1;
  transition: all 0.3s ease;
}

.form :deep(.el-input__wrapper.is-focus) {
  border-color: #a6611a;
  box-shadow: none;
}

/* 🍂 **验证码输入框整体样式** */
.captcha-item {
  display: flex;
  align-items: center;
  gap: 15px; /* ✅ 调整验证码输入框与验证码图片的间距 */
}

/* 🍂 **验证码输入框** */
.captcha-item .el-input {
  flex: 1;
}

/* 🍂 **验证码图片样式优化** */
.captcha-img {
  height: 40px;
  width: 120px; /* ✅ 控制验证码宽度 */
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  border: none; /* 去掉边框 */
  background: transparent; /* 让验证码图片透明 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 🍂 **验证码图片鼠标悬停效果** */
.captcha-img:hover {
  transform: scale(1.05);
}

/* 🍂 **让验证码 `append` 贴合右侧** */
.el-input-group__append {
  background: transparent !important;
  border: none !important;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 🍂 **调整验证码输入框的高度，使其与验证码图片对齐** */
.el-input {
  height: 40px !important;
}

/* 🍂 **让验证码整体居中** */
.captcha-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* 🍂 **按钮：秋天的橙色按钮，带点击反馈** */
.submit-btn {
  width: 100%;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #e67e22, #d35400);
  border: none;
  color: white;
  transition: background 0.3s ease, transform 0.2s ease-in-out;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #d35400, #e67e22);
  transform: scale(1.02);
}

.submit-btn:active {
  background: #c0392b;
}

/* 🍂 **分割线** */
.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 50px);
  height: 1px;
  background-color: #e0a568;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  background: white;
  padding: 0 15px;
  color: #9b591a;
  font-size: 14px;
}

/* 🍂 **GitHub 登录按钮** */
.github-btn {
  width: 100%;
  background: #8c5326;
  border: none;
  color: white;
  font-size: 14px;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.github-btn i {
  margin-right: 10px;
}

.github-btn:hover {
  background: #733c14;
}

@media (max-width: 1024px) {
  .login-content {
    width: 90%;
    height: auto;
  }
  .login-right {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-content {
    width: 100%;
    border-radius: 0;
  }
}



</style>
