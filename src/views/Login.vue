<template>
  <div class="container" :class="{ 'container-show': isShow }">
    <!-- 登录框 -->
    <div class="login-box" :class="{ 'animate_login': isSignMode }">
      <div class="apple-btn login-apple">
        <li class="red-btn"></li>
        <li class="yellow-btn"></li>
        <li class="green-btn"></li>
      </div>
      <div class="title">Login</div>
      <div class="input">
        <el-input
          v-model="loginForm.username"
          placeholder="Input your username"
          :class="{ 'dark': isSignMode }"
        />
      </div>
      <div class="input">
        <el-input
          v-model="loginForm.password"
          type="password"
          placeholder="Input your password"
          :class="{ 'dark': isSignMode }"
          show-password
        />
      </div>
      <div class="btn login-btn" @click="handleLogin">
        <span>登录</span>
      </div>
      <div class="change-box login-change">
        <div class="change-btn toSign" @click="toggleMode">
          <span>去注册</span>
        </div>
      </div>
    </div>

    <!-- 注册框 -->
    <div class="sign-box" :class="{ 'animate_sign': isSignMode }">
      <div class="apple-btn sign-apple">
        <li class="red-btn"></li>
        <li class="yellow-btn"></li>
        <li class="green-btn"></li>
      </div>
      <div class="title">Sign</div>
      <div class="input">
        <el-input
          v-model="registerForm.username"
          placeholder="Have A Good Name?"
        />
      </div>
      <div class="input">
        <el-input
          v-model="registerForm.password"
          type="password"
          placeholder="Keep Secret"
          show-password
        />
      </div>
      <div class="btn sign-btn" @click="handleRegister">
        <span>注册</span>
      </div>
      <div class="change-box sign-change">
        <div class="change-btn toLogin" @click="toggleMode">
          <span>去登录</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const isShow = ref(false)
const isSignMode = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  password: ''
})

// 页面载入动画
onMounted(() => {
  setTimeout(() => {
    isShow.value = true
  }, 100)
})

// 切换登录/注册模式
const toggleMode = () => {
  isSignMode.value = !isSignMode.value
}

// 登录处理
const handleLogin = async () => {
  try {
    // TODO: 调用登录API
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginForm.value)
    })
    
    const data = await response.json()
    if (data.code === 0) {
      localStorage.setItem('token', data.data.token)
      ElMessage.success('登录成功')
      router.push('/admin/dashboard')
    } else {
      ElMessage.error(data.message)
    }
  } catch (error) {
    ElMessage.error('登录失败')
  }
}

// 注册处理
const handleRegister = async () => {
  try {
    // TODO: 调用注册API
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerForm.value)
    })
    
    const data = await response.json()
    if (data.code === 0) {
      ElMessage.success('注册成功')
      isSignMode.value = false // 切换到登录
    } else {
      ElMessage.error(data.message)
    }
  } catch (error) {
    ElMessage.error('注册失败')
  }
}
</script>

<style scoped>
/* 全局样式 */
.container {
  position: absolute;
  height: 350px;
  width: 600px;
  background-color: rgba(255, 255, 255, .9);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -30%);
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(17, 39, 59, 0.8);
  border: 1px solid rgba(17, 39, 59, 1);
  overflow: hidden;
  box-sizing: border-box;
  opacity: 0;
  transition: 1s;
}

.container-show {
  transform: translate(-50%,-50%);
  opacity: 1;
}

/* 登录框样式 */
.login-box {
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: rgba(17, 39, 59, 0.8);
  transition: .4s;
  z-index: 1;
  transform-origin: 0 100%;
}

.animate_login {
  transform: rotate(-90deg);
}

/* 注册框样式 */
.sign-box {
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, .8);
  transform-origin: 0 100%;
  transform: rotate(90deg);
  transition: .4s;
  z-index: 1;
}

.animate_sign {
  transform: rotate(0deg) !important;
}

/* 标题样式 */
.title {
  margin-top: 10px;
  position: relative;
  height: 40px;
  width: 100%;
  font-size: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 3px;
  transition: .4s;
}

.login-box .title {
  color: white;
  text-shadow: 0px 0px 7px rgba(255, 255, 255, .9);
}

/* 输入框样式 */
.input {
  width: 400px;
  height: 45px;
  position: relative;
  margin: 40px auto;
}

:deep(.el-input__inner) {
  height: 45px;
  border-radius: 45px;
  background-color: rgba(255, 255, 255, 0.4);
  border: none;
  color: var(--text-color);
  transition: .4s;
}

.login-box :deep(.el-input__inner) {
  caret-color: white;
  color: rgba(255, 255, 255, 0.8);
}

.login-box :deep(.el-input__inner:focus) {
  box-shadow: 0 0 10px rgba(1,1,1, .8);
}

/* 按钮样式 */
.btn {
  height: 50px;
  width: 160px;
  position: relative;
  margin: -10px auto;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  color: rgba(255, 255, 255, .4);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: .4s;
}

.login-btn:hover {
  color: white;
  background-color: #57606f;
  box-shadow: rgba(0, 0, 0, 0.1);
  text-shadow: 0px 0px 2px rgba(0, 0, 0, 0.1);
}

.sign-box .btn {
  color: #1e90ff;
  background-color: rgba(200, 200, 200, .1);
}

.sign-box .btn:hover {
  color: white;
  background-color: #1e90ff;
}

/* 切换按钮样式 */
.change-box {
  position: absolute;
  height: 0px;
  width: 100%;
  clip-path: polygon(100% 50%, 50% 100%, 100% 100%);
  bottom: 0px;
  transition: .4s;
}

.change-btn {
  position: absolute;
  bottom: 30px;
  right: 40px;
  font-size: 20px;
  display: none;
  font-weight: 500;
}

.change-btn:hover {
  text-shadow: 0px 0px 3px rgba(200, 200, 200, .8);
  cursor: pointer;
}

.login-change {
  background-color: rgba(255, 255, 255, .8);
}

.sign-change {
  background-color: rgba(17, 39, 59, 0.8);
}

.toLogin {
  color: white;
}

/* Mac按钮样式 */
.apple-btn {
  position: absolute;
  height: 15px;
  width: 65px;
  top: 3px;
}

.apple-btn li {
  list-style: none;
  position: relative;
  height: 15px;
  width: 15px;
  border-radius: 15px;
  opacity: 0;
}

.login-apple li {
  left: 5px;
  float: left;
}

.sign-apple li {
  right: 5px;
  float: right;
}

.sign-apple {
  right: 5px;
}

li:nth-child(2) {
  margin: 0px 2px;
}

.red-btn {
  background-color: red;
  transition: .3s;
  transform: translate(0, -50%);
}

.yellow-btn {
  background-color: orange;
  transition: .6s;
  transform: translate(0, -50%);
}

.green-btn {
  background-color: rgb(15, 136, 15);
  transition: .9s;
  transform: translate(0, -50%);
}

/* Hover效果 */
.container:hover {
  .title {
    font-size: 20px;
  }
  
  .btn {
    height: 30px;
    width: 90px;
    transform: translate(0,-30%);
    font-size: 12px;
  }
  
  .change-box {
    height: 200px;
  }
  
  .change-btn {
    display: block;
  }
  
  .red-btn,
  .yellow-btn,
  .green-btn {
    opacity: 1;
    transform: translate(0,0);
  }
}
</style> 