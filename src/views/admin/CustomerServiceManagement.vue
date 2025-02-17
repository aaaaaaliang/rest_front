<template>
  <div class="customer-service-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>客服消息</span>
          <el-select v-model="status" placeholder="消息状态" style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="未处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </div>
      </template>

      <el-tabs v-model="activeChat" class="chat-tabs">
        <!-- 会话列表 -->
        <el-tab-pane label="会话列表" name="list">
          <div class="chat-list">
            <div
                v-for="chat in chatList"
                :key="chat.id"
                class="chat-item"
                :class="{ active: currentChat?.id === chat.id }"
                @click="handleSelectChat(chat)"
            >
              <el-avatar :size="40" :src="chat.avatar" />
              <div class="chat-info">
                <div class="chat-header">
                  <span class="username">{{ chat.username }}</span>
                  <span class="time">{{ formatTime(chat.lastTime) }}</span>
                </div>
                <div class="last-message">{{ chat.lastMessage }}</div>
              </div>
              <el-badge v-if="chat.unread" :value="chat.unread" class="unread-badge" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 聊天界面 -->
        <el-tab-pane v-if="currentChat" :label="currentChat.username" name="chat">
          <div class="chat-container">
            <div class="message-list" ref="messageList">
              <div
                  v-for="(message, index) in currentChat.messages"
                  :key="index"
                  :class="['message', message.type === 'service' ? 'service' : 'user']"
              >
                <div class="message-content">{{ message.content }}</div>
                <div class="message-time">{{ formatTime(message.time) }}</div>
              </div>
            </div>

            <div class="input-area">
              <el-input
                  v-model="inputMessage"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入回复内容..."
                  @keyup.enter="handleSend"
              />
              <div class="action-buttons">
                <el-button type="primary" @click="handleSend">发送</el-button>
                <el-button @click="handleComplete" type="success">完成会话</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { API } from '@/config/api'

const status = ref('')
const activeChat = ref('list')
const currentChat = ref(null)
const inputMessage = ref('')
const messageList = ref(null)
const socket = ref(null)

// 客服消息列表
const chatList = ref([])

// **格式化时间**
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
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
      handleIncomingMessage(msg)
    } catch (error) {
      console.error('WebSocket 消息解析失败:', error)
    }
  }

  socket.value.onerror = (error) => {
    console.error('WebSocket 发生错误:', error)
  }

  socket.value.onclose = () => {
    console.log('WebSocket 断开，尝试重连...')
    setTimeout(connectWebSocket, 3000)
  }
}

// **处理收到的消息**
const handleIncomingMessage = (msg) => {
  // 查找对应会话
  let chat = chatList.value.find((c) => c.id === msg.chatId)

  if (!chat) {
    chat = {
      id: msg.chatId,
      username: msg.fromUser,
      avatar: 'https://via.placeholder.com/40',
      lastMessage: msg.content,
      lastTime: msg.timestamp,
      unread: 1,
      messages: []
    }
    chatList.value.push(chat)
  } else {
    chat.lastMessage = msg.content
    chat.lastTime = msg.timestamp
    if (currentChat.value?.id !== chat.id) {
      chat.unread += 1
    }
  }

  chat.messages.push({
    type: msg.fromUser === '客服' ? 'service' : 'user',
    content: msg.content,
    time: formatTime(msg.timestamp)
  })

  if (currentChat.value?.id === chat.id) {
    nextTick(() => {
      messageList.value.scrollTop = messageList.value.scrollHeight
    })
  }
}

// **选择聊天会话**
const handleSelectChat = (chat) => {
  currentChat.value = chat
  activeChat.value = 'chat'
  chat.unread = 0
}

// **发送消息**
const handleSend = () => {
  if (!inputMessage.value.trim()) return

  if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
    console.error('WebSocket 未连接，无法发送消息')
    return
  }

  const message = {
    fromUser: '客服',
    toUser: currentChat.value.username,
    content: inputMessage.value,
    timestamp: new Date().toISOString(),
    type: 'chat',
    chatId: currentChat.value.id
  }

  try {
    socket.value.send(JSON.stringify(message))
    currentChat.value.messages.push({
      type: 'service',
      content: inputMessage.value,
      time: formatTime(message.timestamp)
    })
  } catch (error) {
    console.error('WebSocket 发送消息失败:', error)
  }

  inputMessage.value = ''
}

// **完成会话**
const handleComplete = () => {
  // TODO: 结束聊天逻辑
}

// **初始化**
onMounted(() => {
  connectWebSocket()
})
</script>

<style scoped>
.customer-service-management {
  padding: 20px;
}

.chat-list {
  height: 600px;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.chat-item:hover {
  background: #f5f7fa;
}

.chat-item.active {
  background: #ecf5ff;
}

.chat-info {
  flex: 1;
  margin: 0 10px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.time {
  font-size: 12px;
  color: #999;
}

.last-message {
  color: #666;
  font-size: 13px;
}

.chat-container {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 20px;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
  background: #409EFF;
  color: white;
  padding: 10px;
  border-radius: 4px;
}

.message.service {
  margin-right: auto;
  background: #f4f4f5;
  color: black;
  padding: 10px;
  border-radius: 4px;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.input-area {
  padding: 20px;
  border-top: 1px solid #eee;
}

.action-buttons {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
