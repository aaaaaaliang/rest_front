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
    <el-drawer v-model="showDrawer" title="在线客服" direction="rtl" size="600px">
      <template #header>
        <div class="drawer-header">
          <span>餐厅智能助手</span>
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
              :class="['message', getMessageClass(message)]"
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
          <el-button type="primary" @click="handleSend" :disabled="!isConnected" style="margin-top: 10px; width: 100%">
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
import {API} from "../config/api.js";

const showDrawer = ref(false)
const inputMessage = ref('')
const messages = ref([])
const unreadCount = ref(0)
const messageList = ref(null)
const socket = ref(null)
const isConnected = ref(false)
const userStore = useUserStore()
const maxRetries = 3
const retryCount = ref(0)

// **格式化时间**
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// **获取消息样式**
const getMessageClass = (message) => {
  return message.fromUser === userStore.user?.code ? 'user' : 'service'
}

// **打开聊天窗口**
const openChat = () => {
  showDrawer.value = true
  unreadCount.value = 0
  if (!isConnected.value && retryCount.value < maxRetries) {
    connectWebSocket()
  }
}

// **连接 WebSocket**
const connectWebSocket = async () => {
  if (retryCount.value >= maxRetries) {
    ElMessage.error('连接失败，请稍后重试')
    return
  }

  try {
    const wsUrl = API.WS.GET// **直接指定 WebSocket 地址**
    console.log('正在连接 WebSocket:', wsUrl)

    socket.value = new WebSocket(wsUrl)

    socket.value.onopen = () => {
      console.log('✅ WebSocket 连接成功')
      isConnected.value = true
      retryCount.value = 0

      // **发送身份验证**
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
          fromUser: msg.from_user
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
      console.log('❌ WebSocket 连接关闭:', event)
      isConnected.value = false

      if (!event.wasClean && retryCount.value < maxRetries) {
        retryCount.value++
        console.log(`🔄 尝试第 ${retryCount.value} 次重连...`)
        setTimeout(() => {
          if (!isConnected.value) {
            connectWebSocket()
          }
        }, 3000)
      }
    }

    socket.value.onerror = (error) => {
      console.error('❌ WebSocket 错误:', error)
      isConnected.value = false
    }
  } catch (error) {
    console.error('❌ 创建 WebSocket 连接失败:', error)
    ElMessage.error('创建连接失败')
  }
}

// **发送消息**
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

    // **在本地 UI 先显示自己发的消息**
    messages.value.push({
      content: inputMessage.value.trim(),
      timestamp: Date.now(),
      fromUser: userStore.user?.code
    })

    inputMessage.value = ''
    scrollToBottom()
  } catch (error) {
    ElMessage.error('❌ 发送失败')
  }
}

// **滚动到底部**
const scrollToBottom = () => {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

// **监听抽屉状态**
watch(showDrawer, (newVal) => {
  if (newVal) {
    unreadCount.value = 0
    scrollToBottom()
  }
})

// **初始化 WebSocket**
onMounted(() => {
  if (userStore.isLoggedIn && userStore.token) {
    connectWebSocket()
  }
})

// **组件销毁时关闭 WebSocket**
onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.close(1000, '用户关闭')
  }
  retryCount.value = maxRetries
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
  background: #409eff;
  color: white;
}

.message.service {
  margin-right: auto;
  background: #f4f4f5;
  color: black;
}

.message-content {
  padding: 10px;
  border-radius: 4px;
  word-break: break-all;
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
.message-content {
  white-space: pre-wrap; /* 保留换行符 */
  word-break: break-word; /* 允许单词折行 */
}

</style>
