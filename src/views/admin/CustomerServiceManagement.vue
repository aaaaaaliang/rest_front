<template>
  <div class="customer-service">
    <el-card class="chat-card">
      <template #header>
        <div class="header">
          <span class="title">客服管理</span>
          <div class="header-right">
            <el-tag 
              :type="isConnected ? 'success' : 'danger'" 
              size="small" 
              effect="plain"
              class="status-tag"
            >
              {{ isConnected ? '已连接' : '未连接' }}
            </el-tag>
            <el-tag type="info" size="small">在线用户: 0</el-tag>
          </div>
        </div>
      </template>

      <div class="message-container">
        <div class="messages" ref="messageBox">
          <div v-for="(msg, index) in messages" :key="index" 
            :class="['message', msg.fromUser === userStore.user?.code ? 'message-right' : 'message-left']">
            <div class="message-info">
              <span class="sender">
                {{ msg.fromUser === userStore.user?.code ? '客服' : msg.fromUser }}
              </span>
              <span class="time">{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
            </div>
            <div class="message-content">{{ msg.content }}</div>
          </div>
        </div>

        <div class="input-area">
          <div class="input-wrapper">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="4"
              :disabled="!isConnected"
              placeholder="请输入消息..."
              @keyup.enter.prevent="sendMessage"
              resize="none"
            />
            <el-button 
              type="primary" 
              :disabled="!isConnected"
              @click="sendMessage"
              class="send-button"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Position } from '@element-plus/icons-vue'

const userStore = useUserStore()
const messages = ref([])
const inputMessage = ref('')
const isConnected = ref(false)
const ws = ref(null)
const messageBox = ref(null)

// 连接WebSocket
const connectWebSocket = () => {
  try {
    const wsUrl = `ws://${window.location.host}/api/ws`
    console.log('正在连接WebSocket:', wsUrl)
    
    ws.value = new WebSocket(wsUrl)
    
    ws.value.onopen = () => {
      console.log('WebSocket连接成功')
      isConnected.value = true
      
      // 发送身份验证
      const authMsg = {
        type: 'identify',
        role: 'service',
        user_code: userStore.user?.code
      }
      console.log('发送身份验证消息:', authMsg)
      ws.value.send(JSON.stringify(authMsg))
    }
    
    ws.value.onmessage = (event) => {
      console.log('收到原始消息:', event.data)
      
      if (!event.data) {
        console.warn('收到空消息')
        return
      }
      
      try {
        const data = JSON.parse(event.data)
        console.log('解析后的消息:', data)
        
        if (!data.type) {
          console.warn('消息缺少type字段:', data)
          return
        }
        
        switch (data.type) {
          case 'chat':
            if (data.from_user !== userStore.user?.code) {
              messages.value.push({
                content: data.content,
                timestamp: data.timestamp,
                fromUser: data.from_user
              })
              scrollToBottom()
            }
            break
            
          case 'system':
            console.log('系统消息:', data.content)
            ElMessage.info(data.content)
            break
            
          case 'error':
            console.error('错误消息:', data.content)
            ElMessage.error(data.content)
            break
            
          default:
            console.warn('未知消息类型:', data.type)
        }
      } catch (error) {
        console.error('消息解析失败:', error)
        console.error('原始消息内容:', event.data)
      }
    }
    
    ws.value.onclose = (event) => {
      console.log('WebSocket连接关闭:', event.code, event.reason)
      isConnected.value = false
    }
    
    ws.value.onerror = (error) => {
      console.error('WebSocket错误:', error)
      isConnected.value = false
    }
  } catch (error) {
    console.error('WebSocket连接失败:', error)
  }
}

// 发送消息
const sendMessage = () => {
  if (!inputMessage.value.trim() || !isConnected.value) return
  
  try {
    const message = {
      type: 'chat',
      content: inputMessage.value.trim(),
      from_user: userStore.user?.code,
      timestamp: Date.now()
    }
    
    // 先添加到本地消息列表，确保立即显示
    messages.value.push({
      content: message.content,
      timestamp: message.timestamp,
      fromUser: message.from_user
    })
    
    // 清空输入框并滚动到底部
    inputMessage.value = ''
    scrollToBottom()
    
    // 发送到服务器
    ws.value.send(JSON.stringify(message))
  } catch (error) {
    // 如果发送失败，从消息列表中移除最后一条消息
    messages.value.pop()
    ElMessage.error('发送失败')
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageBox.value) {
    messageBox.value.scrollTop = messageBox.value.scrollHeight
  }
}

onMounted(() => {
  connectWebSocket()
})

onBeforeUnmount(() => {
  if (ws.value) {
    ws.value.close()
  }
})
</script>

<style scoped>
.customer-service {
  padding: 20px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.chat-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  min-height: 0;
}

.chat-card :deep(.el-card__header) {
  background-color: var(--el-bg-color);
  border-bottom-color: var(--el-border-color-light);
  padding: 12px 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-tag {
  margin-right: 8px;
}

.message-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background-color: var(--el-bg-color-page);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 20px 10px;
  min-height: 0;
}

.message {
  margin-bottom: 24px;
  max-width: 75%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-left {
  margin-right: auto;
}

.message-right {
  margin-left: auto;
}

.message-info {
  margin-bottom: 6px;
  font-size: 13px;
  padding: 0 4px;
}

.message-info .sender {
  margin-right: 8px;
  font-weight: 500;
}

.message-left .message-info .sender {
  color: var(--el-text-color-regular);
}

.message-right .message-info .sender {
  color: var(--el-color-primary);
}

.message-info .time {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  word-break: break-all;
  line-height: 1.6;
  font-size: 14px;
  position: relative;
  transition: all 0.3s;
}

.message-left .message-content {
  background-color: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  border-top-left-radius: 4px;
  box-shadow: 0 2px 8px var(--el-box-shadow);
}

.message-right .message-content {
  background-color: var(--el-color-primary);
  color: white;
  border-top-right-radius: 4px;
  box-shadow: 0 2px 8px var(--el-color-primary-light-8);
}

.input-area {
  padding: 16px 20px;
  background-color: var(--el-fill-color-blank);
  border-top: 1px solid var(--el-border-color-lighter);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-area .el-input {
  width: 100%;
}

.input-area .el-input :deep(.el-textarea__inner) {
  background-color: var(--el-fill-color);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color);
  resize: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  height: 100px;
}

.input-area .el-input :deep(.el-textarea__inner):hover {
  border-color: var(--el-border-color-hover);
}

.input-area .el-input :deep(.el-textarea__inner):focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-8);
}

.send-button {
  width: 100%;
  height: 40px;
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
}

.send-button:hover:not(:disabled) {
  background-color: var(--el-color-primary-light-3);
  border-color: var(--el-color-primary-light-3);
  transform: translateY(-1px);
}

.send-button:disabled {
  background-color: var(--el-button-disabled-bg-color);
  border-color: var(--el-button-disabled-border-color);
  color: var(--el-button-disabled-text-color);
}

.send-icon {
  font-size: 20px;
}

/* 滚动条样式优化 */
.messages::-webkit-scrollbar {
  width: 4px;
}

.messages::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 2px;
}

.messages::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.messages::-webkit-scrollbar-track {
  background: transparent;
}

/* 适配暗色主题 */
html.dark {
  .chat-card,
  .chat-card :deep(.el-card__header) {
    background-color: var(--el-bg-color);
    border-color: var(--el-border-color-light);
  }
  
  .title {
    color: var(--el-text-color-primary);
  }
  
  .message-container {
    background-color: var(--el-bg-color);
  }
  
  .message-left .message-content {
    background-color: var(--el-fill-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .input-area {
    background-color: var(--el-fill-color-blank);
    border-top-color: var(--el-border-color-light);
  }

  .input-area .el-input :deep(.el-textarea__inner) {
    background-color: var(--el-fill-color-darker);
    border-color: var(--el-border-color);
    
    &:hover {
      border-color: var(--el-border-color-hover);
    }
    
    &:focus {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px var(--el-color-primary-light-8);
    }
  }

  .send-button {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
    color: white;
  }
}
</style>
