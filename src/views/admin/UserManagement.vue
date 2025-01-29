<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户名/手机号/邮箱"
              style="width: 300px"
              clearable
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-select 
              v-model="roleFilter" 
              placeholder="角色" 
              clearable
              style="margin-left: 16px; width: 120px"
              @change="handleSearch"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="普通用户" value="user" />
              <el-option label="商家" value="merchant" />
              <el-option label="员工" value="staff" />
            </el-select>
            
            <el-select 
              v-model="statusFilter" 
              placeholder="状态" 
              clearable
              style="margin-left: 16px; width: 120px"
              @change="handleSearch"
            >
              <el-option label="启用" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </div>
          
          <el-button type="primary" @click="handleAdd">
            新增用户
          </el-button>
        </div>
      </template>

      <el-table :data="userList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="头像" width="80">
          <template #default="scope">
            <el-avatar :size="40" :src="scope.row.avatar" />
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="realName" label="姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="role" label="角色">
          <template #default="scope">
            <el-tag :type="getRoleTagType(scope.row.role)">
              {{ getRoleText(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="180" />
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button 
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="handleResetPassword(scope.row)"
            >
              重置密码
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="头像">
          <el-upload
            class="avatar-upload"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="userForm.avatar" :src="userForm.avatar" class="avatar">
            <el-icon v-else class="avatar-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="dialogType === 'edit'" />
        </el-form-item>

        <el-form-item label="姓名" prop="realName">
          <el-input v-model="userForm.realName" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
            <el-option label="商家" value="merchant" />
            <el-option label="员工" value="staff" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="userForm.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>

        <el-form-item 
          v-if="dialogType === 'add'"
          label="密码" 
          prop="password"
        >
          <el-input 
            v-model="userForm.password" 
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordVisible"
      title="重置密码"
      width="400px"
    >
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input 
            v-model="resetPasswordForm.password" 
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="resetPasswordForm.confirmPassword" 
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordVisible = false">取消</el-button>
          <el-button type="primary" @click="handleResetPasswordSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

// 搜索和筛选
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框控制
const dialogVisible = ref(false)
const dialogType = ref('add')
const resetPasswordVisible = ref(false)

// 表单引用
const userFormRef = ref(null)
const resetPasswordFormRef = ref(null)

// 用户列表数据
const userList = ref([
  {
    id: 1,
    username: 'admin',
    realName: '管理员',
    phone: '13800138000',
    email: 'admin@example.com',
    role: 'admin',
    status: 1,
    avatar: 'https://via.placeholder.com/100',
    createTime: '2024-01-01 12:00:00'
  }
  // ... 更多用户数据
])

// 用户表单数据
const userForm = reactive({
  avatar: '',
  username: '',
  realName: '',
  phone: '',
  email: '',
  role: 'user',
  status: 1,
  password: ''
})

// 重置密码表单数据
const resetPasswordForm = reactive({
  userId: null,
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const validatePass = (rule, value, callback) => {
  if (value !== resetPasswordForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
}

const resetPasswordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass, trigger: 'blur' }
  ]
}

// 获取角色标签类型
const getRoleTagType = (role) => {
  const types = {
    admin: 'danger',
    merchant: 'warning',
    staff: 'success',
    user: 'info'
  }
  return types[role] || 'info'
}

// 获取角色文本
const getRoleText = (role) => {
  const texts = {
    admin: '管理员',
    merchant: '商家',
    staff: '员工',
    user: '普通用户'
  }
  return texts[role] || '未知'
}

// 搜索
const handleSearch = () => {
  // TODO: 实现搜索功能
  console.log('搜索:', {
    query: searchQuery.value,
    role: roleFilter.value,
    status: statusFilter.value
  })
}

// 新增用户
const handleAdd = () => {
  dialogType.value = 'add'
  Object.keys(userForm).forEach(key => {
    userForm[key] = key === 'status' ? 1 : key === 'role' ? 'user' : ''
  })
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.keys(userForm).forEach(key => {
    if (key !== 'password') {
      userForm[key] = row[key]
    }
  })
  dialogVisible.value = true
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户"${row.username}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // TODO: 调用删除API
    ElMessage.success('删除成功')
  })
}

// 更新状态
const handleStatusChange = (row) => {
  // TODO: 调用状态更新API
  ElMessage.success(`用户${row.username}已${row.status === 1 ? '启用' : '禁用'}`)
}

// 重置密码
const handleResetPassword = (row) => {
  resetPasswordForm.userId = row.id
  resetPasswordForm.password = ''
  resetPasswordForm.confirmPassword = ''
  resetPasswordVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      // TODO: 调用新增/编辑API
      dialogVisible.value = false
      ElMessage.success('保存成功')
    }
  })
}

// 提交重置密码
const handleResetPasswordSubmit = async () => {
  if (!resetPasswordFormRef.value) return
  
  await resetPasswordFormRef.value.validate(async (valid) => {
    if (valid) {
      // TODO: 调用重置密码API
      resetPasswordVisible.value = false
      ElMessage.success('密码重置成功')
    }
  })
}

// 头像上传
const handleAvatarSuccess = (response) => {
  userForm.avatar = response.url
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 分页方法
const handleSizeChange = (val) => {
  pageSize.value = val
  // TODO: 重新加载数据
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  // TODO: 重新加载数据
}
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.avatar-upload {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style> 