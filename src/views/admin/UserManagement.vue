<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>用户管理</span>
          </div>
          <div class="header-right">
            <el-button 
              v-if="hasPermission('api_user_post')"
              type="primary" 
              @click="handleAdd"
            >
              新增用户
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.username"
          placeholder="请输入用户名搜索"
          style="width: 200px"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 用户列表 -->
      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="real_name" label="真实姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="gender" label="性别" width="80" />
        <el-table-column label="角色" min-width="120">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role.code"
              size="small"
              class="role-tag"
            >
              {{ role.name }}
            </el-tag>
            <span v-if="!row.roles || row.roles.length === 0">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320">
          <template #default="scope">
            <el-button 
              v-if="hasPermission('api_user_put')"
              size="small"
              type="warning"
              link
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="hasPermission('api_user_delete')"
              size="small"
              type="danger"
              link
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
            <el-button
              v-if="hasPermission('api_user_assign_post')"
              size="small"
              type="primary"
              link
              @click="handleAssignRole(scope.row)"
            >
              分配角色
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="page.index"
          v-model:page-size="page.size"
          :total="page.total"
          :page-sizes="[10, 20, 50, 100]"
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
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'add'">
          <el-input v-model="userForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="是否为员工" label-width="120px">
        <el-switch v-model="userForm.is_employee" />
        </el-form-item>

        <el-form-item label="基础工资" v-if="userForm.is_employee">
          <el-input v-model="userForm.base_salary" type="number" placeholder="请输入基础工资" />
        </el-form-item>
        <el-form-item label="真实姓名" v-if="userForm.is_employee">
          <el-input v-model="userForm.real_name"placeholder="请输入真实名字" />
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

    <!-- 角色分配对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      title="分配角色"
      width="500px"
    >
      <el-form>
        <el-form-item label="角色">
          <el-select v-model="selectedRoles" multiple>
            <el-option
              v-for="role in roles"
              :key="role.code"
              :label="role.name"
              :value="role.code"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitRoles">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'
import { API } from '../../config/api'
import { hasPermission } from '../../utils/permissions'

const userStore = useUserStore()
const loading = ref(false)
const userFormRef = ref(null)
const dialogVisible = ref(false)
const roleDialogVisible = ref(false)
const dialogType = ref('add')
const users = ref([])
const roles = ref([])
const selectedRoles = ref([])
const currentUser = ref(null)

// 分页参数
const page = reactive({
  index: 1,
  size: 10,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  username: ''
})

// 用户表单

const userForm = ref({
  username: '',
  email: '',
  phone: '',
  password: '',
  is_employee: false, // 是否为员工
  base_salary: null,   // 基础工资
  real_name:"",
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await request(API.USER.LIST + `?index=${page.index}&size=${page.size}&username=${searchForm.username}`)
    if (res.data && res.data.code === 200) {
      users.value = res.data.data  // 使用 res.data.data 作为用户列表数据
      page.total = res.data.total  // 从响应中获取总数
    }
  } catch (error) {
    ElMessage.error(error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}
const convertBaseSalary = () => {
  if (userForm.value.base_salary) {
    userForm.value.base_salary = parseFloat(userForm.value.base_salary);
  }
};


// 获取角色列表
const fetchRoles = async () => {
  try {
    const res = await request(API.ROLE.LIST)
    if (res.data && res.data.code === 200) {
      roles.value = res.data.data || []  // 使用 res.data.data 作为角色列表数据
    }
  } catch (error) {
    ElMessage.error(error.message || '获取角色列表失败')
  }
}

// 获取用户的角色
const fetchUserRoles = async (userCode) => {
  try {
    const res = await request(`${API.USER.GET_ROLES}?user_code=${userCode}`)
    if (res.data && res.data.code === 200) {
      roles.value = res.data.data || []  // 使用 res.data.data 作为角色列表数据
      selectedRoles.value = roles.value
        .filter(role => role.checked)
        .map(role => role.code)
    }
  } catch (error) {
    ElMessage.error(error.message || '获取用户角色失败')
  }
}

// 处理搜索
const handleSearch = () => {
  page.index = 1
  fetchUsers()
}

// 处理分页
const handleSizeChange = (val) => {
  page.size = val
  fetchUsers()
}

const handleCurrentChange = (val) => {
  page.index = val
  fetchUsers()
}

// 新增用户
const handleAdd = () => {
  dialogType.value = 'add'
  userForm.value = {
    username: '',
    email: '',
    phone: '',
    password: '',
    is_employee: false, // 是否为员工
  base_salary: null   // 基础工资
  }
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row) => {
  dialogType.value = 'edit'
  userForm.value = { ...row }
  dialogVisible.value = true
}

// 删除用户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
      type: 'warning'
    })
    await request(API.USER.DELETE + `/${row.id}`, {
      method: 'DELETE'
    })
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    if (userForm.value.is_employee && userForm.value.base_salary) {
      userForm.value.base_salary = parseFloat(userForm.value.base_salary)
    }

    if (dialogType.value === 'add') {
      await request(API.USER.ADDUSER, {
        method: 'POST',
        data: userForm.value
      })
      ElMessage.success('新增成功')
    } else {
      await request(API.USER.UPDATE + `/${userForm.value.id}`, {
        method: 'PUT',
        data: userForm.value
      })
      ElMessage.success('编辑成功')
    }

    dialogVisible.value = false
    fetchUsers()
  } catch (error) {
    ElMessage.error(dialogType.value === 'add' ? '新增失败' : '编辑失败')
  }
}

// 分配角色
const handleAssignRole = async (row) => {
  const userCode = row.user_code || row.code

  if (!userCode) {
    ElMessage.error('用户数据异常，无法获取角色')
    return
  }

  currentUser.value = row

  try {
    // 获取所有角色列表
    const res = await request(`${API.USER.GET_ROLES}?user_code=${userCode}`)
    if (res.data && res.data.code === 200) {
      // 设置角色列表
      roles.value = res.data.data

      // 设置已选中的角色
      selectedRoles.value = row.roles ? row.roles.map(role => role.code) : []
      
      // 打开对话框
      roleDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  }
}

// 提交角色分配
const handleSubmitRoles = async () => {
  if (!currentUser.value || !currentUser.value.code) {
    ElMessage.error('用户信息错误，无法分配角色')
    return
  }

  try {
    const res = await request(API.USER.ASSIGN_ROLES, {
      method: 'POST',
      data: {
        user_code: currentUser.value.code,
        role_codes: selectedRoles.value
      }
    })

    if (res.data && res.data.code === 200) {
      ElMessage.success('角色分配成功')
      roleDialogVisible.value = false
      // 刷新用户列表
      await fetchUsers()
    } else {
      throw new Error(res.data?.message || '分配失败')
    }
  } catch (error) {
    console.error('分配角色失败:', error)
    ElMessage.error(error.message || '分配角色失败')
  }
}

// 初始化
onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

/* 调试面板样式 */
.debug-panel {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.debug-item {
  margin: 10px 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.debug-json {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 12px;
}

h4 {
  margin: 20px 0 10px;
  color: #606266;
}

/* 确保按钮可见性 */
.el-button {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
}

/* 修复按钮间距 */
.el-button + .el-button {
  margin-left: 10px;
}

/* 确保操作列宽度足够 */
:deep(.el-table__row) {
  .cell {
    white-space: nowrap;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}
</style>