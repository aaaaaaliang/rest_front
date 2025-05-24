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

      <!-- 用户类型标签页 -->
      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <el-tab-pane label="普通用户" name="normal"></el-tab-pane>
        <el-tab-pane label="员工用户" name="employee"></el-tab-pane>
      </el-tabs>

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
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'add'">
          <el-input v-model="userForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        
        <el-form-item label="用户类型" prop="is_employee">
          <el-switch
            v-model="userForm.is_employee"
            active-text="员工"
            inactive-text="普通用户"
            @change="handleUserTypeChange"
          />
        </el-form-item>

        <template v-if="userForm.is_employee">
          <el-form-item label="真实姓名" prop="real_name">
            <el-input v-model="userForm.real_name" placeholder="请输入真实姓名" />
          </el-form-item>
          <el-form-item label="基础工资" prop="base_salary">
            <el-input-number 
              v-model="userForm.base_salary" 
              :min="0"
              :precision="2"
              :step="1000"
              placeholder="请输入基础工资"
            />
          </el-form-item>
        </template>
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
const activeTab = ref('normal')

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
  base_salary: 0,   // 基础工资
  real_name:"",
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  real_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  base_salary: [
    { required: true, message: '请输入基础工资', trigger: 'blur' }
  ]
}

// 处理标签页切换
const handleTabChange = () => {
  page.index = 1
  fetchUsers()
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    let url = API.USER.LIST
    if (activeTab.value === 'employee') {
      url = API.USER.EMPLOYEE_LIST
    } else if (activeTab.value === 'normal') {
      url = API.USER.LIST
    }
    
    const res = await request(`${url}?index=${page.index}&size=${page.size}&username=${searchForm.username}`)
    if (res.data && res.data.code === 200) {
      users.value = res.data.data
      page.total = res.data.total
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error(error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

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

  // 如果有基础工资字段，标记为员工
  if (row.base_salary>0) {
    row.is_employee = true;
  } else {
    row.is_employee = false;
  }

  // 回显用户数据
  userForm.value = { ...row }

  dialogVisible.value = true
}

// 删除用户
const handleDelete = async (row) => {
  try {
    // 使用 query 参数删除用户
    await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
      type: 'warning'
    })

    // 将 user.code 替换为 row.user_code
    await request(`${API.USER.DELETE}?user_code=${row.code}`, {
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
    // 检查是否是员工并确保 base_salary 为数字类型
    if (userForm.value.is_employee) {
      // 如果没有基础工资，设置为0
      userForm.value.base_salary = parseFloat(userForm.value.base_salary) || 0; // 防止传递空字符串或非数字
    } else {
      userForm.value.base_salary = 0; // 如果不是员工，直接设置为0
    }

    if (dialogType.value === 'add') {
      await request(API.USER.ADDUSER, {
        method: 'POST',
        data: userForm.value
      });
      ElMessage.success('新增成功');
    } else {
      await request(API.USER.UPDATE, {
        method: 'PUT',
        data: userForm.value
      });
      ElMessage.success('编辑成功');
    }

    dialogVisible.value = false;
    fetchUsers();
  } catch (error) {
    ElMessage.error(dialogType.value === 'add' ? '新增失败' : '编辑失败');
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

// 处理用户类型变化
const handleUserTypeChange = (val) => {
  if (!val) {
    userForm.value.base_salary = 0
    userForm.value.real_name = ''
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
  background-color: #f5f7fa;
  min-height: 100vh;
}

.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
}

.header-left {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.search-bar {
  margin: 20px 0;
  display: flex;
  gap: 15px;
  align-items: center;
}

.el-table {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header) {
  background-color: #f5f7fa;
}

:deep(.el-table__row) {
  transition: all 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.role-tag {
  margin: 2px;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

.el-dialog {
  border-radius: 8px;
}

:deep(.el-dialog__header) {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-dialog__body) {
  padding: 30px 20px;
}

:deep(.el-dialog__footer) {
  padding: 20px;
  border-top: 1px solid #ebeef5;
}

.el-form-item {
  margin-bottom: 22px;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

/* 操作按钮样式优化 */
:deep(.el-button--text) {
  padding: 4px 8px;
  font-size: 14px;
  height: auto;
  line-height: 1.5;
}

:deep(.el-button--text.el-button--warning) {
  color: #e6a23c;
}

:deep(.el-button--text.el-button--warning:hover) {
  color: #ebb563;
  background-color: rgba(230, 162, 60, 0.1);
}

:deep(.el-button--text.el-button--danger) {
  color: #f56c6c;
}

:deep(.el-button--text.el-button--danger:hover) {
  color: #f78989;
  background-color: rgba(245, 108, 108, 0.1);
}

:deep(.el-button--text.el-button--primary) {
  color: #409eff;
}

:deep(.el-button--text.el-button--primary:hover) {
  color: #66b1ff;
  background-color: rgba(64, 158, 255, 0.1);
}

/* 表格内容样式优化 */
:deep(.el-table .cell) {
  white-space: nowrap;
  line-height: 1.5;
}

:deep(.el-table td) {
  padding: 12px 0;
}

/* 标签页样式优化 */
:deep(.el-tabs__item) {
  font-size: 15px;
  height: 40px;
  line-height: 40px;
}

:deep(.el-tabs__item.is-active) {
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
}
</style>