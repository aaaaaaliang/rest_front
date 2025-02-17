<template>
  <div class="customer-service">
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
      <div class="service-container">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageList">
          <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message', message.fromUser === userCode ? 'user' : 'service']"
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
              @keyup.enter="handleSend"
          />
          <el-button
              type="primary"
              @click="handleSend"
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
import { ref, onMounted, watch, nextTick } from 'vue'
import { Service } from '@element-plus/icons-vue'
import { API } from '@/config/api'

const showDrawer = ref(false)
const inputMessage = ref('')
const messages = ref([])
const unreadCount = ref(0)
const messageList = ref(null)
const userCode = ref('') // 当前用户
const socket = ref(null)

// **格式化时间**
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// **打开聊天窗口**
const openChat = () => {
  showDrawer.value = true
  unreadCount.value = 0
}

// **初始化 WebSocket**
const connectWebSocket = () => {
  if (socket.value && socket.value.readyState === WebSocket.OPEN) {
    console.log('WebSocket 已连接')
    return
  }

  const wsUrl = `${API.WS.GET}?token=${document.cookie}`
  socket.value = new WebSocket(wsUrl)

  socket.value.onopen = () => {
    console.log('WebSocket 连接成功')
  }

  socket.value.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'chat') {
        handleIncomingMessage(msg)
      }
    } catch (error) {
      console.error('WebSocket 消息解析失败:', error)
    }
  }

  socket.value.onerror = (error) => {
    console.error('WebSocket 发生错误:', error)
  }

  socket.value.onclose = () => {
    console.log('WebSocket 断开，尝试重连...')
    setTimeout(connectWebSocket, 3000) // 3 秒后重连
  }
}

// **处理收到的消息**
const handleIncomingMessage = (msg) => {
  messages.value.push(msg)
  if (!showDrawer.value) {
    unreadCount.value += 1
  }
  nextTick(() => {
    messageList.value.scrollTop = messageList.value.scrollHeight
  })
}

// **发送消息**
const handleSend = () => {
  if (!inputMessage.value.trim()) return

  // ✅ 解决 WebSocket 连接未就绪的问题
  if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
    console.error('WebSocket 未连接，无法发送消息')
    return
  }

  const message = {
    fromUser: userCode.value,
    toUser: '客服',
    content: inputMessage.value,
    timestamp: new Date().toISOString(),
    type: 'chat'
  }

  try {
    socket.value.send(JSON.stringify(message))
    messages.value.push(message)
  } catch (error) {
    console.error('WebSocket 发送消息失败:', error)
  }

  inputMessage.value = ''

  nextTick(() => {
    messageList.value.scrollTop = messageList.value.scrollHeight
  })
}

// **监听 WebSocket**
onMounted(() => {
  connectWebSocket()
})
</script>

<style scoped>
.customer-service {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 999;
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
