<template>
  <div class="customer-service">
    <!-- 悬浮按钮 -->
    <div class="service-button" @click="showDrawer = true">
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
      size="300px"
    >
      <div class="service-container">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageList">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            :class="['message', message.type]"
          >
            <div class="message-content">{{ message.content }}</div>
            <div class="message-time">{{ message.time }}</div>
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
import { ref, computed, watch, nextTick } from 'vue'
import { Service } from '@element-plus/icons-vue'

const showDrawer = ref(false)
const inputMessage = ref('')
const messages = ref([
  {
    type: 'system',
    content: '您好，请问有什么可以帮您？',
    time: new Date().toLocaleTimeString()
  }
])
const unreadCount = ref(0)
const messageList = ref(null)

// 发送消息
const handleSend = () => {
  if (!inputMessage.value.trim()) return
  
  messages.value.push({
    type: 'user',
    content: inputMessage.value,
    time: new Date().toLocaleTimeString()
  })
  
  // 模拟客服回复
  setTimeout(() => {
    messages.value.push({
      type: 'service',
      content: '收到您的消息，客服稍后会为您解答。',
      time: new Date().toLocaleTimeString()
    })
  }, 1000)
  
  inputMessage.value = ''
  
  // 滚动到底部
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

// 监听抽屉关闭，更新未读消息
watch(showDrawer, (val) => {
  if (!val) {
    unreadCount.value = 0
  }
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
  margin-bottom: 20px;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
}

.message.service {
  margin-right: auto;
}

.message.system {
  margin: 20px auto;
  text-align: center;
  color: #999;
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