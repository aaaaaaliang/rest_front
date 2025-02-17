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
      label: 'description'
    }"
    show-checkbox
    node-key="code"
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

// 获取角色列表
const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await request(API.ROLE.LIST)
    roles.value = res.data
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 获取权限列表
const fetchPermissions = async () => {
  try {
    const res = await request(API.ROLE.LIST_PERMISSIONS)
    permissions.value = res.data
  } catch (error) {
    ElMessage.error('获取权限列表失败')
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
  roleForm.value = { ...row }
  dialogVisible.value = true
}

// 删除角色
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
      type: 'warning'
    })
    await request(`${API.ROLE.DELETE}/${row.id}`, {
      method: 'DELETE'
    })
    ElMessage.success('删除成功')
    fetchRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 权限设置
const handleAssignPermission = async (row) => {
  currentRole.value = row
  try {
    const res = await request(`${API.ROLE.GET_PERMISSIONS}?role_code=${row.code}`)
    // 递归获取所有 checked 为 true 的节点 code
    checkedPermissions.value = getCheckedKeys(res.data)
    // 显示对话框
    permissionDialogVisible.value = true
    // 等待对话框和树渲染完成后，手动设置选中的节点
    await nextTick()
    if (permissionTreeRef.value) {
      permissionTreeRef.value.setCheckedKeys(checkedPermissions.value)
    }
  } catch (error) {
    ElMessage.error('获取角色权限失败')
  }
}

// 提交权限设置
const handleSubmitPermissions = async () => {
  if (!currentRole.value || !permissionTreeRef.value) return
  
  try {
    const checkedNodes = permissionTreeRef.value.getCheckedNodes(true)
    const checkedPermissions = checkedNodes.map(node => node.code)

    await request(API.ROLE.ASSIGN_PERMISSIONS, {
      method: 'POST',
      body: JSON.stringify({
        role_code: currentRole.value.code,
        permission_codes: checkedPermissions
      })
    })
    
    ElMessage.success('权限设置成功')
    permissionDialogVisible.value = false
  } catch (error) {
    ElMessage.error('权限设置失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    if (dialogType.value === 'add') {
      await request(API.ROLE.CREATE, {
        method: 'POST',
        body: JSON.stringify(roleForm.value)
      })
    } else {
      await request(`${API.ROLE.UPDATE}/${roleForm.value.id}`, {
        method: 'PUT',
        body: JSON.stringify(roleForm.value)
      })
    }
    ElMessage.success(dialogType.value === 'add' ? '新增成功' : '编辑成功')
    dialogVisible.value = false
    fetchRoles()
  } catch (error) {
    ElMessage.error(dialogType.value === 'add' ? '新增失败' : '编辑失败')
  }
}

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
</style>
