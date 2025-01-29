<template>
  <div class="role-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleAddRole">
            新增角色
          </el-button>
        </div>
      </template>

      <el-table :data="roles" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button 
              size="small"
              @click="handleEditPermissions(scope.row)"
            >
              权限设置
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDeleteRole(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
      width="500px"
    >
      <el-form
        :model="roleForm"
        :rules="rules"
        ref="roleFormRef"
        label-width="80px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitRole">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 权限设置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限设置"
      width="600px"
    >
      <el-tree
        ref="permissionTreeRef"
        :data="permissions"
        show-checkbox
        node-key="id"
        :default-checked-keys="selectedPermissions"
        :props="{
          label: 'name',
          children: 'children'
        }"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitPermissions">
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

// 角色列表数据
const roles = ref([
  {
    id: 1,
    name: '超级管理员',
    description: '系统最高权限',
    createTime: '2024-01-01'
  },
  {
    id: 2,
    name: '店长',
    description: '餐厅管理权限',
    createTime: '2024-01-01'
  },
  {
    id: 3,
    name: '收银员',
    description: '订单处理权限',
    createTime: '2024-01-01'
  }
])

// 权限树数据
const permissions = ref([
  {
    id: 1,
    name: '系统管理',
    children: [
      { id: 11, name: '用户管理' },
      { id: 12, name: '角色管理' },
      { id: 13, name: '权限管理' }
    ]
  },
  {
    id: 2,
    name: '订单管理',
    children: [
      { id: 21, name: '订单列表' },
      { id: 22, name: '订单处理' }
    ]
  },
  {
    id: 3,
    name: '菜品管理',
    children: [
      { id: 31, name: '菜品列表' },
      { id: 32, name: '分类管理' }
    ]
  }
])

const dialogVisible = ref(false)
const dialogType = ref('add')
const permissionDialogVisible = ref(false)
const selectedPermissions = ref([])
const currentRole = ref(null)

const roleForm = reactive({
  name: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' }
  ]
}

const handleAddRole = () => {
  dialogType.value = 'add'
  roleForm.name = ''
  roleForm.description = ''
  dialogVisible.value = true
}

const handleEditPermissions = (role) => {
  currentRole.value = role
  selectedPermissions.value = [11, 21, 31] // 模拟已有权限
  permissionDialogVisible.value = true
}

const handleDeleteRole = (role) => {
  ElMessageBox.confirm(
    `确定要删除角色"${role.name}"吗？`,
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

const handleSubmitRole = () => {
  // TODO: 调用新增/编辑API
  dialogVisible.value = false
  ElMessage.success('保存成功')
}

const handleSubmitPermissions = () => {
  // TODO: 调用权限设置API
  permissionDialogVisible.value = false
  ElMessage.success('权限设置成功')
}
</script>

<style scoped>
.role-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 