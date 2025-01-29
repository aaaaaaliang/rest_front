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
                  <span class="time">{{ chat.lastTime }}</span>
                </div>
                <div class="last-message">{{ chat.lastMessage }}</div>
              </div>
              <el-badge 
                v-if="chat.unread" 
                :value="chat.unread" 
                class="unread-badge" 
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 聊天界面 -->
        <el-tab-pane 
          v-if="currentChat"
          :label="currentChat.username"
          name="chat"
        >
          <div class="chat-container">
            <div class="message-list" ref="messageList">
              <div 
                v-for="(message, index) in currentChat.messages" 
                :key="index"
                :class="['message', message.type]"
              >
                <div class="message-content">{{ message.content }}</div>
                <div class="message-time">{{ message.time }}</div>
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
                <el-button type="primary" @click="handleSend">
                  发送
                </el-button>
                <el-button @click="handleComplete" type="success">
                  完成会话
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const status = ref('')
const activeChat = ref('list')
const currentChat = ref(null)
const inputMessage = ref('')
const messageList = ref(null)

// 模拟数据
const chatList = ref([
  {
    id: 1,
    username: '张三',
    avatar: 'https://via.placeholder.com/40',
    lastMessage: '请问有什么可以帮您？',
    lastTime: '10:30',
    unread: 2,
    messages: [
      {
        type: 'user',
        content: '你好，我想问一下订单状态',
        time: '10:28'
      },
      {
        type: 'service',
        content: '请问有什么可以帮您？',
        time: '10:30'
      }
    ]
  }
  // ... 更多会话
])

const handleSelectChat = (chat) => {
  currentChat.value = chat
  activeChat.value = 'chat'
  chat.unread = 0
}

const handleSend = () => {
  if (!inputMessage.value.trim()) return
  
  currentChat.value.messages.push({
    type: 'service',
    content: inputMessage.value,
    time: new Date().toLocaleTimeString()
  })
  
  inputMessage.value = ''
}

const handleComplete = () => {
  // TODO: 完成会话的逻辑
}
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