<template>
  <div class="cs-container">
    <!-- 左侧用户列表 -->
    <div class="cs-user-list">
      <div class="cs-list-header">
        <el-input
          v-model="search"
          placeholder="搜索用户名/昵称"
          @input="fetchUserList"
          clearable
          size="small"
          prefix-icon="el-icon-search"
        />
      </div>
      <el-scrollbar class="cs-scrollbar">
        <div v-for="user in userList" :key="user.code"
          :class="['cs-user-item', user.code === currentUser?.code ? 'active' : '']"
          @click="selectUser(user)">
          <el-avatar :size="36" icon="el-icon-user" style="margin-right: 10px;" />
          <div class="cs-user-info">
            <div class="cs-user-name">{{ user.real_name || user.username }}</div>
            <div class="cs-user-desc">{{ user.nickname || user.phone }}</div>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <!-- 右侧聊天窗口 -->
    <div class="cs-chat-area" v-if="currentUser">
      <div class="cs-chat-header">
        <el-avatar :size="36" icon="el-icon-user" />
        <div class="cs-chat-title">
          <div class="cs-chat-name">{{ currentUser.real_name || currentUser.username }}</div>
          <div class="cs-chat-desc">{{ currentUser.nickname || currentUser.phone }}</div>
        </div>
      </div>
      <el-scrollbar class="cs-chat-messages" ref="messageBox">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['cs-msg', msg.self ? 'self' : 'other']">
          <div class="cs-msg-content">{{ msg.content }}</div>
          <div class="cs-msg-time">{{ formatTime(msg.timestamp) }}</div>
        </div>
      </el-scrollbar>
      <div class="cs-chat-input">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="2"
          placeholder="请输入消息..."
          @keyup.enter.prevent="sendMessage"
        />
        <el-button type="primary" @click="sendMessage" :disabled="!inputMessage.trim()" style="margin-left: 8px;">
          发送
        </el-button>
      </div>
    </div>
    <div class="cs-chat-area cs-empty" v-else>
      <el-empty description="请选择左侧用户开始聊天" />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { API } from '@/config/api'

const search = ref('')
const userList = ref([])
const currentUser = ref(null)
const messages = ref([])
const inputMessage = ref('')
const messageBox = ref(null)
let ws = null

// 拉取用户列表（index/size 通过 query 拼接，GET 请求）
const fetchUserList = async () => {
  const params = new URLSearchParams({
    index: 1,
    size: 50
  })
  if (search.value) {
    params.append('username', search.value)
  }
  const res = await request(`${API.USER.LIST}?${params.toString()}`, {
    method: 'GET'
  })
  if (res.data && res.data.code === 200) {
    userList.value = res.data.data || []
  }
}
onMounted(fetchUserList)

// 选择用户并建立会话
const selectUser = async (user) => {
  if (currentUser.value && user.code === currentUser.value.code) return
  currentUser.value = user
  messages.value = []
  inputMessage.value = ''
  if (ws) {
    ws.close()
    ws = null
  }
  // 发起会话
  const res = await request(API.CHAT.AGENT, {
    method: 'GET',
    data: { customer_code: user.code }
  })
  if (res.data && res.data.code === 200) {
    const sessionCode = res.data.data.session_code
    connectWebSocket(sessionCode)
  } else {
    ElMessage.error(res.data?.message || '会话建立失败')
  }
}

// 建立 WebSocket 连接
const connectWebSocket = (sessionCode) => {
  const wsUrl = `${API.CHAT.WS}?session_code=${sessionCode}&user_type=agent`
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${wsUrl}`)
  ws.onopen = () => {}
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      messages.value.push({
        content: msg.content,
        timestamp: msg.timestamp || Date.now(),
        self: msg.sender_type === 'agent'
      })
      scrollToBottom()
    } catch (e) {}
  }
  ws.onclose = () => {}
  ws.onerror = () => {
    ElMessage.error('WebSocket 连接异常')
  }
}

// 发送消息
const sendMessage = () => {
  if (!inputMessage.value.trim() || !ws) return
  const msg = {
    session_code: '', // 后端可自动补全
    content: inputMessage.value.trim(),
    sender_type: 'agent'
  }
  ws.send(JSON.stringify(msg))
  messages.value.push({
    content: inputMessage.value.trim(),
    timestamp: Date.now(),
    self: true
  })
  inputMessage.value = ''
  scrollToBottom()
}

// 格式化时间
const formatTime = (ts) => {
  const d = new Date(ts)
  return d.toLocaleTimeString()
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageBox.value) {
      messageBox.value.setScrollTop(99999)
    }
  })
}

onBeforeUnmount(() => {
  if (ws) ws.close()
})
</script>

<style scoped>
.cs-container {
  display: flex;
  height: 80vh;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 16px #eee;
}
.cs-user-list {
  width: 260px;
  border-right: 1px solid #f0f0f0;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
}
.cs-list-header {
  padding: 16px 12px 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}
.cs-scrollbar {
  flex: 1;
  padding: 0 0 8px 0;
}
.cs-user-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f6f6f6;
  transition: background 0.2s;
}
.cs-user-item.active, .cs-user-item:hover {
  background: #e6f7ff;
}
.cs-user-info {
  flex: 1;
  min-width: 0;
}
.cs-user-name {
  font-weight: 600;
  font-size: 15px;
  color: #222;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cs-user-desc {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cs-chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
}
.cs-chat-header {
  display: flex;
  align-items: center;
  padding: 18px 24px 12px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}
.cs-chat-title {
  margin-left: 12px;
}
.cs-chat-name {
  font-size: 16px;
  font-weight: 600;
  color: #222;
}
.cs-chat-desc {
  font-size: 12px;
  color: #888;
}
.cs-chat-messages {
  flex: 1;
  padding: 18px 24px;
  background: #f8fafd;
  overflow-y: auto;
}
.cs-msg {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.cs-msg.self {
  align-items: flex-end;
}
.cs-msg-content {
  background: #409eff;
  color: #fff;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 15px;
  max-width: 60%;
  word-break: break-all;
}
.cs-msg.other .cs-msg-content {
  background: #f4f4f5;
  color: #222;
}
.cs-msg-time {
  font-size: 12px;
  color: #aaa;
  margin-top: 2px;
}
.cs-chat-input {
  display: flex;
  align-items: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}
.cs-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
</style>
