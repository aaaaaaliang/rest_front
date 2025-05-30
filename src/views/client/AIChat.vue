<template>
  <div class="ai-chat-page">
    <!-- 左侧会话列表 -->
    <div class="session-list-panel">
      <div class="panel-header">
        <el-button type="primary" size="small" @click="handleNewSession" class="new-session-btn">
          <el-icon><Plus /></el-icon> 新建会话
        </el-button>
      </div>
      <el-scrollbar class="session-scrollbar">
        <div
          v-for="session in sessions"
          :key="session.code"
          :class="['session-item', session.code === currentSession?.code ? 'active' : '']"
          @click="selectSession(session)"
        >
          <div class="session-title">{{ session.session_title || '未命名会话' }}</div>
          <div class="session-meta">{{ session.last_message || '暂无消息' }}</div>
          <el-dropdown trigger="click" @command="handleSessionCommand">
            <el-icon class="session-options"><MoreFilled /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="{ action: 'rename', session }">重命名</el-dropdown-item>
                <el-dropdown-item :command="{ action: 'delete', session }">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-scrollbar>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-area-panel">
      <div v-if="currentSession" class="chat-content-wrapper">
        <div class="chat-header">
           <el-icon class="ai-icon"><Cpu /></el-icon>
           <span class="chat-title">{{ currentSession.session_title || '未命名会话' }}</span>
        </div>
        <el-scrollbar class="chat-messages" ref="messageBox">
          <div v-for="(msg, index) in messages" :key="index" :class="['chat-msg', msg.role === 'user' ? 'self' : 'other']">
             <div class="msg-role">{{ msg.role === 'user' ? userLabel : assistantLabel }}</div>
             <template v-if="msg.role === 'assistant' && msg.content.includes('<think>')">
               <div class="msg-content">
                 <div class="gpt-thinking">
                   <div class="thinking-header">
                     <el-icon><Cpu /></el-icon>
                     <span>GPT思考过程</span>
                   </div>
                   <div class="thinking-content">
                     {{ extractThinking(msg.content) }}
                   </div>
                 </div>
                 <div class="gpt-response">
                   {{ extractResponse(msg.content) }}
                 </div>
               </div>
             </template>
             <template v-else>
               <div class="msg-content">{{ msg.content }}</div>
             </template>
             <div class="msg-time">{{ formatTime(msg.created) }}</div>
           </div>
           <!-- AI 正在输入提示 -->
           <div v-if="isTyping" class="chat-msg other">
              <div class="msg-role">{{ assistantLabel }}</div>
              <div class="msg-content is-typing">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
        </el-scrollbar>
        <div class="chat-input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入您的问题..."
            @keyup.enter.prevent="handleSend"
            resize="none"
            :disabled="isTyping"
          />
          <el-button
            type="primary"
            @click="handleSend"
            :disabled="!inputMessage.trim() || isTyping"
            style="margin-top: 10px; width: 100%"
          >
            发送
          </el-button>
        </div>
      </div>
      <div v-else class="chat-area-placeholder">
        <el-empty description="选择一个会话或新建一个会话开始聊天" />
      </div>
    </div>
     <!-- 重命名会话弹窗 -->
     <el-dialog
       v-model="renameDialogVisible"
       title="重命名会话"
       width="300px"
     >
       <el-input v-model="newSessionTitle" placeholder="请输入新标题" />
       <template #footer>
         <span class="dialog-footer">
           <el-button @click="renameDialogVisible = false">取消</el-button>
           <el-button type="primary" @click="submitRename">确定</el-button>
         </span>
       </template>
     </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Cpu, MoreFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { API } from '@/config/api'
import { format } from 'date-fns'; // 需要安装 date-fns: npm install date-fns

const sessions = ref([]) // 会话列表
const currentSession = ref(null) // 当前选中会话
const messages = ref([]) // 当前会话消息列表
const inputMessage = ref('') // 输入框内容
const messageBox = ref(null) // 消息列表滚动条ref
const userLabel = ref('用户') // 用户标签
const assistantLabel = ref('AI客服') // AI标签
const isTyping = ref(false); // AI是否正在回复

const renameDialogVisible = ref(false); // 控制重命名弹窗
const newSessionTitle = ref(''); // 新的会话标题
let sessionToRename = null; // 需要重命名的会话对象

// 格式化时间
const formatTime = (timestamp) => {
   if (!timestamp) return ''
   // 注意后端返回的时间戳可能是秒级的，需要乘以1000
   const date = new Date(timestamp * 1000)
   return format(date, 'HH:mm:ss'); // 使用 date-fns 格式化时间
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageBox.value && messageBox.value.wrap$) {
      const scrollbar = messageBox.value.wrap$;
      if (scrollbar) {
        scrollbar.scrollTop = scrollbar.scrollHeight;
      }
    }
  });
};

// 获取会话列表
const fetchSessions = async () => {
  try {
    const res = await request(API.AI.SESSION_LIST)
    if (res.data && res.data.code === 200) {
      sessions.value = res.data.data || []
      // 如果当前有选中的会话，尝试在刷新后重新选中
      if (currentSession.value) {
          const found = sessions.value.find(s => s.code === currentSession.value.code);
          if (found) {
              currentSession.value = found;
          } else {
              currentSession.value = null;
              messages.value = [];
          }
      }
    }
  } catch (error) {
    ElMessage.error('获取会话列表失败')
  }
}

// 获取AI模型配置（用于显示用户和AI标签）
const fetchModelConfig = async () => {
  // 暂时使用默认值，等后端接口ready后再启用
  userLabel.value = '用户';
  assistantLabel.value = 'AI助手';
  /* 暂时注释掉配置获取
  try {
    const res = await request(API.AI.MODEL_CONFIG);
    if (res.data && res.data.code === 200 && res.data.data) {
      const config = res.data.data;
      userLabel.value = config.user_label || '用户';
      assistantLabel.value = config.assistant_label || 'AI客服';
    }
  } catch (error) {
    console.error('获取AI模型配置失败:', error);
    // 使用默认值
  }
  */
};


// 选中会话
const selectSession = async (session) => {
  if (currentSession.value?.code === session.code && messages.value.length > 0) {
      currentSession.value = session;
      return;
  }
  currentSession.value = session
  messages.value = []
  inputMessage.value = ''
  await fetchHistory(session.code)
  scrollToBottom()
}

// 新建会话 (仅切换到新会话状态，不立即调用接口)
const handleNewSession = () => {
  // 创建一个新的临时会话对象
  const newSession = { 
    code: null, 
    session_title: '新会话', 
    last_message: '', 
    created: Date.now()/1000 
  };
  
  // 设置为当前会话
  currentSession.value = newSession;
  messages.value = [];
  inputMessage.value = '';
  
  // 将新会话添加到列表顶部
  sessions.value.unshift(newSession);
  
  // 移除其他会话的高亮状态
  sessions.value.forEach(s => {
    if (s.code !== null) s.active = false;
  });
  newSession.active = true;
  
  // 滚动到底部
  scrollToBottom();
}

// 加载会话历史记录
const fetchHistory = async (sessionCode) => {
  if (!sessionCode) {
    console.error('会话ID不存在');
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('session_code', sessionCode);
    // 添加时间戳避免缓存
    params.append('_t', new Date().getTime());

    console.log('获取聊天历史记录:', `${API.AI.HISTORY}?${params}`);
    const res = await request(`${API.AI.HISTORY}?${params}`);
    
    console.log('聊天历史记录响应:', res);
    
    if (res.data && res.data.code === 200) {
      messages.value = res.data.data || [];
    } else {
      ElMessage.error(res.data?.message || '获取聊天记录失败');
    }
  } catch (error) {
    console.error('获取聊天记录失败:', error);
    ElMessage.error('获取聊天记录失败');
  }
}

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim() || isTyping.value) return;

  const userMessage = inputMessage.value.trim();
  inputMessage.value = '';

  // 判断是否是新建会话的第一条消息
  const isFirstMessageInNewSession = currentSession.value && !currentSession.value.code;

  // 将用户消息添加到聊天列表
  messages.value.push({
    content: userMessage,
    created: Date.now()/1000,
    role: 'user',
    user_code: '',
    session_code: currentSession.value?.code
  });

  scrollToBottom();
  isTyping.value = true;

  try {
    let res;
    if (isFirstMessageInNewSession) {
      console.log('发送首次聊天请求:', API.AI.CHAT_FIRST, userMessage);
      res = await request(API.AI.CHAT_FIRST, {
        method: 'POST',
        data: { prompt: userMessage }
      });

      console.log('首次聊天响应:', res);

      if (res.data && res.data.code === 200 && res.data.data) {
        const { reply, session_code, title } = res.data.data;
        
        // 更新当前会话信息
        currentSession.value.code = session_code;
        currentSession.value.session_title = title || '新会话';
        currentSession.value.last_message = reply;

        // 更新会话列表
        const index = sessions.value.findIndex(s => s.code === null);
        if (index !== -1) {
          sessions.value[index] = { ...currentSession.value };
        }

        // 添加AI回复
        messages.value.push({
          content: reply,
          created: Date.now()/1000,
          role: 'assistant',
          user_code: '',
          session_code: session_code
        });
      } else {
        ElMessage.error(res.data?.message || 'AI回复失败');
        messages.value.push({
          content: res.data?.message || 'AI回复失败',
          created: Date.now()/1000,
          role: 'assistant'
        });
      }
    } else {
      // 已有会话的后续消息
      if (!currentSession.value?.code) {
        throw new Error('会话ID不存在');
      }

      console.log('发送会话消息:', API.AI.CHAT_IN_SESSION, {
        session_code: currentSession.value.code,
        prompt: userMessage
      });
      
      res = await request(API.AI.CHAT_IN_SESSION, {
        method: 'POST',
        data: {
          session_code: currentSession.value.code,
          prompt: userMessage
        }
      });

      console.log('会话消息响应:', res);

      if (res.data && res.data.code === 200 && res.data.data?.reply) {
        const { reply } = res.data.data;
        messages.value.push({
          content: reply,
          created: Date.now()/1000,
          role: 'assistant',
          user_code: '',
          session_code: currentSession.value.code
        });
        
        // 更新会话的最后一条消息
        if (currentSession.value) {
          currentSession.value.last_message = reply;
        }
      } else {
        ElMessage.error(res.data?.message || 'AI回复失败');
        messages.value.push({
          content: res.data?.message || 'AI回复失败',
          created: Date.now()/1000,
          role: 'assistant'
        });
      }
    }
  } catch (error) {
    console.error('调用AI接口失败:', error);
    ElMessage.error(error.message || '调用AI接口失败');
    messages.value.push({
      content: error.message || '调用AI接口失败',
      created: Date.now()/1000,
      role: 'assistant'
    });
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
};

// 处理会话操作（重命名、删除）
const handleSessionCommand = (command) => {
  const { action, session } = command;
  if (action === 'rename') {
    sessionToRename = session;
    newSessionTitle.value = session.session_title || '';
    renameDialogVisible.value = true;
  } else if (action === 'delete') {
    handleDeleteSession(session);
  }
};

// 提交重命名
const submitRename = async () => {
    if (!sessionToRename || !newSessionTitle.value.trim()) {
        ElMessage.warning('标题不能为空');
        return;
    }
     if (newSessionTitle.value.trim() === sessionToRename.session_title) {
         renameDialogVisible.value = false;
         return;
     }

    try {
        const res = await request(API.AI.SESSION_UPDATE, {
            method: 'PUT',
            data: {
                session_code: sessionToRename.code,
                new_title: newSessionTitle.value.trim()
            }
        });
        if (res.data && res.data.code === 200) {
            ElMessage.success('重命名成功');
            sessionToRename.session_title = newSessionTitle.value.trim();
            renameDialogVisible.value = false;
             if (currentSession.value?.code === sessionToRename.code) {
                 currentSession.value.session_title = newSessionTitle.value.trim();
             }
        } else {
            ElMessage.error(res.data?.message || '重命名失败');
        }
    } catch (error) {
        ElMessage.error('重命名失败');
    } finally {
        sessionToRename = null;
        newSessionTitle.value = '';
    }
};

// 删除会话
const handleDeleteSession = async (session) => {
  try {
    await ElMessageBox.confirm(`确定删除会话 "${session.session_title || '未命名会话'}" 吗？`, '提示', {
      type: 'warning',
    });

    const params = new URLSearchParams();
    params.append('session_code', session.code);
    // 添加时间戳避免缓存
    params.append('_t', new Date().getTime());

    console.log('删除会话请求:', `${API.AI.SESSION_DELETE}?${params}`);
    const res = await request(`${API.AI.SESSION_DELETE}?${params}`, {
      method: 'DELETE'
    });

    if (res.data && res.data.code === 200) {
      ElMessage.success('删除成功');
      sessions.value = sessions.value.filter(s => s.code !== session.code);
      if (currentSession.value?.code === session.code) {
        currentSession.value = null;
        messages.value = [];
      }
    } else {
      ElMessage.error(res.data?.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 提取思考过程
const extractThinking = (content) => {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  return thinkMatch ? thinkMatch[1].trim() : '';
};

// 提取回复内容
const extractResponse = (content) => {
  return content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
};

// 页面加载时获取会话列表和模型配置
onMounted(() => {
  fetchSessions()
  fetchModelConfig()
})

</script>

<style scoped>
.ai-chat-page {
  display: flex;
  height: calc(100vh - 60px);
  background-color: #f0f2f5;
}

.session-list-panel {
  width: 280px;
  border-right: 1px solid #e0e0e0;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.panel-header {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
}

.new-session-btn {
  width: 100%;
}

.session-scrollbar {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-item:hover,
.session-item.active {
  background-color: #e6f7ff;
}

.session-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 25px;
}

.session-meta {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-options {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  color: #999;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.session-item:hover .session-options {
  opacity: 1;
}


.chat-area-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.chat-content-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    /* height: calc(100vh - 120px); */
}

.chat-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.ai-icon {
   font-size: 24px;
   color: #607d8b;
}

.chat-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-messages {
  flex: 1;
  padding: 15px 20px;
  overflow-y: auto;
  background-color: #e8ecef;
}

.chat-msg {
  margin-bottom: 15px;
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.chat-msg.self {
  align-items: flex-end;
  margin-left: auto;
}

.chat-msg.other {
  align-items: flex-start;
  margin-right: auto;
}

.msg-role {
   font-size: 12px;
   color: #666;
   margin-bottom: 4px;
}

.msg-content {
  padding: 10px 15px;
  border-radius: 8px;
  word-break: break-word;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
}

.chat-msg.self .msg-content {
  background-color: #409eff;
  color: white;
}

.chat-msg.other .msg-content {
  background-color: #ffffff;
  color: #333;
  border: 1px solid #dcdfe6;
}

.msg-time {
   font-size: 11px;
   color: #999;
   margin-top: 4px;
   align-self: flex-end;
}

.chat-msg.other .msg-time {
    align-self: flex-start;
}

.chat-input-area {
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  background-color: #ffffff;
  flex-shrink: 0;
}

.chat-area-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  background-color: #e8ecef;
}

/* 正在输入样式 */
.is-typing {
  display: inline-block;
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin: 0 1px;
  background: #999;
  border-radius: 50%;
  animation: typing-blink 0.7s infinite steps(1, start) both;
}

.dot:nth-child(2) {
  animation-delay: 0.1s;
}

.dot:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes typing-blink {
  50% {
    opacity: 0;
  }
}

/* 媒体查询 */
@media (max-width: 768px) {
  .ai-chat-page {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 60px);
  }
  .session-list-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    max-height: 40vh;
  }
   .session-scrollbar {
       height: calc(40vh - 50px);
   }
  .chat-area-panel {
    width: 100%;
     min-height: 60vh;
  }
   .chat-content-wrapper {
       height: auto;
       min-height: calc(60vh - 80px);
   }

}

.gpt-thinking {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 10px;
  padding: 12px;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 13px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.thinking-header .el-icon {
  font-size: 16px;
  color: #409eff;
}

.thinking-content {
  color: #666;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.gpt-response {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e9ecef;
}

</style> 