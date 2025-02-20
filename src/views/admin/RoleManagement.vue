<template>
  <div class="role-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleAdd" v-if="hasPermission('api_role_post')">
            新增角色
          </el-button>
        </div>
      </template>

      <el-table :data="roles" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button 
              size="small"
              type="primary"
              link
              @click="handleAssignPermission(scope.row)"
              v-if="hasPermission('api_role_assign_post')"
            >
              权限设置
            </el-button>
            <el-button
              size="small"
              type="warning"
              link
              @click="handleEdit(scope.row)"
              v-if="hasPermission('api_role_put')"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              link
              @click="handleDelete(scope.row)"
              v-if="hasPermission('api_role_delete')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
      width="500px"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="rules"
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
          <el-button type="primary" @click="handleSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 权限设置对话框 -->
    <!-- 权限设置对话框 -->
<el-dialog
  v-model="permissionDialogVisible"
  title="权限设置"
  width="600px"
>
  <el-tree
    ref="permissionTreeRef"
    :data="permissions"
    :props="{
      children: 'children',
      label: 'name'
    }"
    show-checkbox
    node-key="code"
    :default-expand-all="true"
  >
    <template #default="{ node, data }">
      <span class="custom-tree-node">
        <span>{{ data.name }}</span>
        <span v-if="data.description" class="description">
          ({{ data.description }})
        </span>
      </span>
    </template>
  </el-tree>
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
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'
import { API } from '../../config/api'
import { useUserStore } from '../../stores/user'
import { hasPermission } from '../../utils/permissions'
import axios from 'axios'

const loading = ref(false)
const roles = ref([])
const permissions = ref([])
const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const dialogType = ref('add')
const currentRole = ref(null)
const checkedPermissions = ref([])
const permissionTreeRef = ref(null)
const roleFormRef = ref(null)

const roleForm = ref({
  name: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

// 递归获取所有 checked 为 true 的节点 code
function getCheckedKeys(nodes) {
  let keys = []
  nodes.forEach(node => {
    if (node.checked) {
      keys.push(node.code)
    }
    if (node.children && node.children.length) {
      keys = keys.concat(getCheckedKeys(node.children))
    }
  })
  return keys
}

// 将权限列表转换为树形结构
const transformPermissionsToTree = (permissions) => {
  const moduleMap = {}

  permissions.forEach(permission => {
    if (permission.method && permission.path) {
      const pathParts = permission.path.split('/')
      const module = pathParts[2]

      if (!moduleMap[module]) {
        moduleMap[module] = {
          code: module,
          description: `${module.charAt(0).toUpperCase() + module.slice(1)} 管理`,
          children: []
        }
      }

      // 生成权限代码，格式: api_模块_方法
      const code = `api_${module}_${permission.method.toLowerCase()}`
      
      // 生成更友好的描述
      let action = ''
      switch (permission.method) {
        case 'GET':
          action = '查看'
          break
        case 'POST':
          action = '新增'
          break
        case 'PUT':
          action = '编辑'
          break
        case 'DELETE':
          action = '删除'
          break
      }

      // 检查是否已存在相同的权限代码
      const exists = moduleMap[module].children.some(child => child.code === code)
      if (!exists) {
        moduleMap[module].children.push({
          code,
          description: `${action}${moduleMap[module].description}`,
          method: permission.method,
          path: permission.path
        })
      }
    }
  })

  return Object.values(moduleMap).filter(module => module.children.length > 0)
}

// 获取角色列表
const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await request(API.ROLE.LIST)
    if (res.data && res.data.code === 200) {
      roles.value = res.data.data || []
    } else {
      roles.value = []
    }
  } catch (error) {
    ElMessage.error(error.message || '获取角色列表失败')
    roles.value = []
  } finally {
    loading.value = false
  }
}

// 获取权限列表
const fetchPermissions = async () => {
  try {
    const userStore = useUserStore()
    const crudPermissions = userStore.crudPermissions || []
    permissions.value = transformPermissionsToTree(crudPermissions)
  } catch (error) {
    console.error('获取权限失败:', error)
    ElMessage.error(error.message || '获取权限列表失败')
    permissions.value = []
  }
}

// 新增角色
const handleAdd = () => {
  dialogType.value = 'add'
  roleForm.value = {
    name: '',
    description: ''
  }
  dialogVisible.value = true
}

// 编辑角色
const handleEdit = (row) => {
  dialogType.value = 'edit'
  roleForm.value = {
    code: row.code,  // 确保包含 code
    name: row.name,
    description: row.description || ''
  }
  dialogVisible.value = true
}

// 删除角色
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
      type: 'warning'
    })
    
    // 使用 query 参数传递 code
    const res = await request(`${API.ROLE.DELETE}?code=${row.code}`, {
      method: 'DELETE'
    })

    if (res.data && res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchRoles()
    } else {
      throw new Error(res.data?.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 权限设置
const handleAssignPermission = async (row) => {
  currentRole.value = row
  try {
    const res = await request(`${API.ROLE.GET_PERMISSIONS}?role_code=${row.code}`)
    if (res.data && res.data.code === 200) {
      // 直接使用返回的数据
      permissions.value = res.data.data
      
      // 只收集叶子节点中 checked 为 true 的权限代码
      const checkedCodes = []
      const traversePermissions = (items) => {
        items.forEach(item => {
          // 只收集叶子节点（有 method 和 path 的节点）
          if (item.method && item.path && item.checked) {
            checkedCodes.push(item.code)
          }
          // 继续遍历子节点
          if (item.children && item.children.length > 0) {
            traversePermissions(item.children)
          }
        })
      }
      traversePermissions(permissions.value)
      
      permissionDialogVisible.value = true
      await nextTick()
      if (permissionTreeRef.value) {
        // 清除所有选中状态，然后设置新的选中状态
        permissionTreeRef.value.setCheckedKeys([])
        permissionTreeRef.value.setCheckedKeys(checkedCodes)
      }
    }
  } catch (error) {
    console.error('获取角色权限失败:', error)
    ElMessage.error('获取角色权限失败')
  }
}

// 提交权限设置
const handleSubmitPermissions = async () => {
  if (!currentRole.value || !permissionTreeRef.value) return
  
  try {
    const checkedNodes = permissionTreeRef.value.getCheckedNodes()
    const halfCheckedNodes = permissionTreeRef.value.getHalfCheckedNodes()
    
    // 收集所有选中的叶子节点权限代码
    const permissionCodes = []
    const collectPermissionCodes = (nodes) => {
      nodes.forEach(node => {
        // 只收集有 method 和 path 的节点（叶子节点）
        if (node.method && node.path) {
          permissionCodes.push(node.code)
        }
      })
    }
    
    // 收集完全选中和半选中的节点的权限代码
    collectPermissionCodes(checkedNodes)
    collectPermissionCodes(halfCheckedNodes)
    
    // 发送请求时使用正确的参数格式
    const res = await request(API.ROLE.ASSIGN_PERMISSIONS, {
      method: 'POST',
      data: {
        role_code: currentRole.value.code,
        permission_codes: permissionCodes
      }
    })
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('权限设置成功')
      permissionDialogVisible.value = false
    } else {
      throw new Error(res.data?.message || '设置失败')
    }
  } catch (error) {
    console.error('权限设置失败:', error)
    ElMessage.error(error.message || '权限设置失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!roleFormRef.value) return
  
  await roleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const method = dialogType.value === 'add' ? 'POST' : 'PUT'
        const url = dialogType.value === 'add' ? API.ROLE.CREATE : API.ROLE.UPDATE
        
        // 构造请求数据
        const requestData = {
          name: roleForm.value.name,
          description: roleForm.value.description
        }

        // 如果是编辑，需要添加 code
        if (dialogType.value === 'edit') {
          requestData.code = roleForm.value.code
        }
        
        const res = await request(url, {
          method,
          data: requestData
        })

        if (res.data && res.data.code === 200) {
          ElMessage.success(dialogType.value === 'add' ? '新增成功' : '编辑成功')
          dialogVisible.value = false
          fetchRoles()
        } else {
          throw new Error(res.data?.message || '操作失败')
        }
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error(error.message || (dialogType.value === 'add' ? '新增失败' : '编辑失败'))
      }
    }
  })
}

// 初始化
onMounted(() => {
  fetchRoles()
  fetchPermissions()
})

async function login() {
  try {
    const response = await axios.get('/user/role')
    if (response.data && response.data.roles) {
      // 假设你有一个 Vuex store 或者组件的 data 来存储角色信息
      // this.$store.commit('setUserRoles', response.data.roles)
      // 或者 this.userRoles = response.data.roles

      // 获取用户权限
      const permissionsResponse = await request('/api/user/permissions', { method: 'GET' })
      const userStore = useUserStore()
      userStore.setPermissions(permissionsResponse.data) // 存到 Vuex/Pinia
    }
  } catch (error) {
    console.error('获取用户角色或权限失败:', error)
  }
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

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.description {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
