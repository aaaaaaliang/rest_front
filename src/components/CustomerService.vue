<template>
  <div v-if="userStore.isLoggedIn" class="customer-service">
    <!-- 悬浮按钮 -->
    <div class="service-button" @click="openChat">
      <el-badge :value="unreadCount" :hidden="unreadCount === 0">
        <el-button type="primary" circle>
          <el-icon><Service /></el-icon>
        </el-button>
      </el-badge>
    </div>

    <!-- 客服抽屉 -->
    <el-drawer
      v-model="showDrawer"
      title="在线客服"
      direction="rtl"
      size="350px"
    >
      <template #header>
        <div class="drawer-header">
          <span>在线客服</span>
          <el-tag :type="isConnected ? 'success' : 'danger'" size="small">
            {{ isConnected ? '已连接' : '未连接' }}
          </el-tag>
        </div>
      </template>

      <div class="service-container">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageList">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message', message.fromUser === userStore.user?.code ? 'user' : 'service']"
          >
            <div class="message-content">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题..."
            @keyup.enter.prevent="handleSend"
          />
          <el-button
            type="primary"
            @click="handleSend"
            :disabled="!isConnected"
            style="margin-top: 10px; width: 100%"
          >
            发送
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { Service } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { API } from '../config/api'

const showDrawer = ref(false)
const inputMessage = ref('')
const messages = ref([])
const unreadCount = ref(0)
const messageList = ref(null)
const socket = ref(null)
const isConnected = ref(false)
const userStore = useUserStore()
const maxRetries = 3  // 最大重试次数
const retryCount = ref(0)  // 当前重试次数

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// 打开聊天窗口
const openChat = () => {
  showDrawer.value = true
  unreadCount.value = 0
  if (!isConnected.value && retryCount.value < maxRetries) {
    connectWebSocket()
  }
}

// 连接 WebSocket
const connectWebSocket = async () => {
  if (retryCount.value >= maxRetries) {
    ElMessage.error('连接失败，请稍后重试')
    return
  }

  try {
    const wsUrl = API.WS.GET
    console.log('正在连接WebSocket:', wsUrl)
    
    socket.value = new WebSocket(wsUrl)

    socket.value.onopen = () => {
      console.log('WebSocket 连接成功')
      isConnected.value = true
      retryCount.value = 0  // 重置重试次数
      
      // 发送身份验证消息
      const identifyMsg = {
        type: 'identify',
        role: 'user',
        user_code: userStore.user?.code
      }
      socket.value.send(JSON.stringify(identifyMsg))
    }

    socket.value.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.error) {
          ElMessage.error(msg.error)
          return
        }
        
        const newMessage = {
          content: msg.content,
          timestamp: msg.timestamp || Date.now(),
          fromUser: msg.from_user,
          type: msg.from_user === userStore.user?.code ? 'user' : 'service'
        }
        
        messages.value.push(newMessage)
        if (!showDrawer.value) {
          unreadCount.value++
        }
        
        scrollToBottom()
      } catch (error) {
        console.error('解析消息失败:', error)
      }
    }

    socket.value.onclose = (event) => {
      console.log('WebSocket 连接关闭:', event)
      isConnected.value = false
      
      // 如果不是主动关闭且未达到最大重试次数，则尝试重连
      if (!event.wasClean && retryCount.value < maxRetries) {
        retryCount.value++
        console.log(`尝试第 ${retryCount.value} 次重连...`)
        setTimeout(() => {
          if (!isConnected.value) {
            connectWebSocket()
          }
        }, 3000)
      }
    }

    socket.value.onerror = (error) => {
      console.error('WebSocket 错误:', error)
      isConnected.value = false
    }
  } catch (error) {
    console.error('创建 WebSocket 连接失败:', error)
    ElMessage.error('创建连接失败')
  }
}

// 发送消息
const handleSend = () => {
  if (!inputMessage.value.trim() || !isConnected.value) return

  const message = {
    type: 'chat',
    content: inputMessage.value.trim(),
    from_user: userStore.user?.code,
    to_user: 'service',
    timestamp: Date.now()
  }

  try {
    socket.value.send(JSON.stringify(message))
    inputMessage.value = ''
    scrollToBottom()
  } catch (error) {
    ElMessage.error('发送失败')
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

// 监听抽屉状态
watch(showDrawer, (newVal) => {
  if (newVal) {
    unreadCount.value = 0
    scrollToBottom()
  }
})

onMounted(() => {
  if (userStore.isLoggedIn && userStore.token) {
    connectWebSocket()
  }
})

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.close(1000, '用户关闭')  // 使用正常关闭代码
  }
  retryCount.value = maxRetries  // 防止继续重试
})
</script>

<style scoped>
.customer-service {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 999;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 20px;
}

.service-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 10px;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
}

.message.service {
  margin-right: auto;
}

.message-content {
  padding: 10px;
  border-radius: 4px;
  background: #f4f4f5;
  word-break: break-all;
}

.message.user .message-content {
  background: #409EFF;
  color: white;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.input-area {
  padding: 20px;
  border-top: 1px solid #eee;
}
</style>
