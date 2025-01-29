<template>
  <div class="salary-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-input
              v-model="searchQuery"
              placeholder="搜索员工姓名"
              style="width: 200px"
              clearable
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-date-picker
              v-model="month"
              type="month"
              placeholder="选择月份"
              style="margin-left: 16px; width: 200px"
              @change="handleSearch"
            />
          </div>
          
          <div class="header-right">
            <el-button type="success" @click="handleBatchPay">
              批量发放工资
            </el-button>
            <el-button type="primary" @click="handleAddSalary">
              新增工资记录
            </el-button>
          </div>
        </div>
      </template>

      <el-table 
        :data="salaryList" 
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="employeeName" label="员工姓名" width="120" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column prop="baseSalary" label="基本工资">
          <template #default="scope">
            ¥{{ scope.row.baseSalary.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="bonus" label="奖金">
          <template #default="scope">
            ¥{{ scope.row.bonus.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="deduction" label="扣款">
          <template #default="scope">
            ¥{{ scope.row.deduction.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="实发工资">
          <template #default="scope">
            ¥{{ (scope.row.baseSalary + scope.row.bonus - scope.row.deduction).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'paid' ? 'success' : 'warning'">
              {{ scope.row.status === 'paid' ? '已发放' : '未发放' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payTime" label="发放时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status !== 'paid'"
              size="small"
              type="primary"
              @click="handlePay(scope.row)"
            >
              发放
            </el-button>
            <el-button
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
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

    <!-- 新增/编辑工资对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增工资记录' : '编辑工资记录'"
      width="600px"
    >
      <el-form
        :model="salaryForm"
        :rules="rules"
        ref="salaryFormRef"
        label-width="100px"
      >
        <el-form-item label="员工" prop="employeeId">
          <el-select 
            v-model="salaryForm.employeeId" 
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="employee in employees"
              :key="employee.id"
              :label="employee.name"
              :value="employee.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工资月份" prop="month">
          <el-date-picker
            v-model="salaryForm.month"
            type="month"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="基本工资" prop="baseSalary">
          <el-input-number
            v-model="salaryForm.baseSalary"
            :precision="2"
            :step="100"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="奖金" prop="bonus">
          <el-input-number
            v-model="salaryForm.bonus"
            :precision="2"
            :step="100"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="扣款" prop="deduction">
          <el-input-number
            v-model="salaryForm.deduction"
            :precision="2"
            :step="100"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="salaryForm.remarks"
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
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 员工数据
const employees = ref([
  { id: 1, name: '张三', department: '后厨', position: '厨师长' },
  { id: 2, name: '李四', department: '前厅', position: '服务员' },
  { id: 3, name: '王五', department: '后厨', position: '厨师' }
])

// 工资数据
const salaryList = ref([
  {
    id: 1,
    employeeName: '张三',
    department: '后厨',
    position: '厨师长',
    baseSalary: 8000.00,
    bonus: 2000.00,
    deduction: 500.00,
    status: 'pending',
    payTime: ''
  },
  {
    id: 2,
    employeeName: '李四',
    department: '前厅',
    position: '服务员',
    baseSalary: 5000.00,
    bonus: 1000.00,
    deduction: 200.00,
    status: 'paid',
    payTime: '2024-01-05 10:00:00'
  }
])

const searchQuery = ref('')
const month = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)
const dialogVisible = ref(false)
const dialogType = ref('add')
const salaryFormRef = ref(null)
const selectedRows = ref([])

const salaryForm = reactive({
  employeeId: '',
  month: null,
  baseSalary: 0,
  bonus: 0,
  deduction: 0,
  remarks: ''
})

const rules = {
  employeeId: [
    { required: true, message: '请选择员工', trigger: 'change' }
  ],
  month: [
    { required: true, message: '请选择工资月份', trigger: 'change' }
  ],
  baseSalary: [
    { required: true, message: '请输入基本工资', trigger: 'blur' }
  ]
}

// 搜索和分页方法
const handleSearch = () => {
  // TODO: 实现搜索功能
  console.log('搜索条件:', {
    query: searchQuery.value,
    month: month.value
  })
}

const handleSizeChange = (val) => {
  pageSize.value = val
  // TODO: 重新加载数据
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  // TODO: 重新加载数据
}

// 表格选择相关方法
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 工资操作方法
const handleAddSalary = () => {
  dialogType.value = 'add'
  Object.keys(salaryForm).forEach(key => {
    salaryForm[key] = key.includes('Salary') || key.includes('bonus') || key.includes('deduction') ? 0 : ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  const employee = employees.value.find(e => e.name === row.employeeName)
  salaryForm.employeeId = employee?.id
  salaryForm.baseSalary = row.baseSalary
  salaryForm.bonus = row.bonus
  salaryForm.deduction = row.deduction
  dialogVisible.value = true
}

const handlePay = (row) => {
  ElMessageBox.confirm(
    `确定发放 ${row.employeeName} 的工资吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // TODO: 调用发放API
    row.status = 'paid'
    row.payTime = new Date().toLocaleString()
    ElMessage.success('发放成功')
  })
}

const handleBatchPay = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要发放的工资记录')
    return
  }

  ElMessageBox.confirm(
    `确定发放选中的 ${selectedRows.value.length} 条工资记录吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // TODO: 调用批量发放API
    selectedRows.value.forEach(row => {
      row.status = 'paid'
      row.payTime = new Date().toLocaleString()
    })
    ElMessage.success('批量发放成功')
  })
}

const handleSubmit = async () => {
  if (!salaryFormRef.value) return
  
  await salaryFormRef.value.validate(async (valid) => {
    if (valid) {
      // TODO: 调用新增/编辑API
      dialogVisible.value = false
      ElMessage.success('保存成功')
    }
  })
}
</script>

<style scoped>
.salary-management {
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

.header-right {
  display: flex;
  gap: 16px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 