<template>
  <div class="salary-management">
    <!-- 用户列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>员工信息</span>
          <div class="search-container">
            <el-input
                v-model="searchQuery"
                placeholder="搜索员工姓名"
                clearable
                @clear="fetchUsers"
                style="width: 250px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="fetchUsersWithSearch">确认</el-button>
          </div>
        </div>
      </template>



      <!-- 用户列表表格 -->
      <el-table v-if="users.length > 0" :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="电话号码" />
        <el-table-column prop="base_salary" label="基本工资" />
        <el-table-column label="角色">
          <template #default="scope">
            <div v-if="scope.row.roles && scope.row.roles.length > 0">
              <el-tag v-for="role in scope.row.roles" :key="role.code" type="primary">{{ role.name }}</el-tag>
            </div>
            <div v-else>-</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="handleViewSalary(scope.row)"
              v-if="hasPermission('api_salary_get')"
            >
              查看薪资记录
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handlePay(scope.row)"
              v-if="hasPermission('api_salary_post')"
            >
              发放工资
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 没有数据时的提示 -->
      <div v-else class="no-data-message">
        <el-alert title="没有找到员工数据" type="info" />
      </div>
    </el-card>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
          v-model:currentPage="page.index"
          v-model:pageSize="page.size"
          :total="page.total"
          :page-sizes="[10, 20, 50]"
          background
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>

    <!-- 发放工资对话框 -->
    <el-dialog v-model="payDialogVisible" title="发放工资" width="400px">
      <el-form ref="payFormRef" :model="payForm" label-width="100px">
        <el-form-item label="基础工资">
          <el-input-number 
            v-model="selectedUser.base_salary" 
            :disabled="true" 
            :precision="2"
            style="width: 100%" 
          />
        </el-form-item>
        <el-form-item label="奖金" prop="bonus">
          <el-input-number 
            v-model="payForm.bonus" 
            :min="0" 
            :precision="2" 
            style="width: 100%" 
          />
        </el-form-item>
        <el-form-item label="扣款" prop="deduction">
          <el-input-number 
            v-model="payForm.deduction" 
            :min="0" 
            :precision="2" 
            style="width: 100%" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPay">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看薪资记录的对话框 -->
    <el-dialog v-model="viewSalaryDialogVisible" title="查看薪资记录" width="600px">
      <!-- 时间筛选部分 -->
      <div style="margin-bottom: 20px;">
        <el-date-picker
            v-model="startDate"
            type="date"
            placeholder="选择开始时间"
            style="margin-right: 10px"
        />
        <el-date-picker
            v-model="endDate"
            type="date"
            placeholder="选择结束时间"
            style="margin-right: 10px"
        />
        <el-button type="primary" @click="filterByDate">确认</el-button>
      </div>

      <div v-if="salaryRecords.length > 0">
        <el-table :data="salaryRecords" style="width: 100%">
          <el-table-column prop="pay_date" label="发放日期" />
          <el-table-column prop="base_salary" label="基本工资">
            <template #default="scope">
              {{ scope.row.base_salary.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="bonus" label="奖金">
            <template #default="scope">
              {{ scope.row.bonus.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="deduction" label="扣款">
            <template #default="scope">
              {{ scope.row.deduction.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="total_salary" label="总薪资">
            <template #default="scope">
              {{ scope.row.total_salary.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button 
                size="small" 
                type="danger" 
                @click="handleDeleteSalaryRecord(scope.row)"
                v-if="hasPermission('api_salary_delete')"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else>
        <el-alert title="没有薪资记录" type="info" />
      </div>
      <template #footer>
        <el-button @click="viewSalaryDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import request from '../../utils/request'; // 自定义封装的请求方法
import { API } from '@/config/api.js'; // API 配置文件
import { hasPermission } from '../../utils/permissions'; // 导入权限检查函数

const loading = ref(false);
const users = ref([]);
const searchQuery = ref('');
const page = ref({
  index: 1,
  size: 10,
  total: 0
});
const payDialogVisible = ref(false); // 控制发放工资对话框
const payForm = ref({
  bonus: 0,
  deduction: 0
});
const selectedUser = ref(null); // 选择的员工对象

// 查看薪资记录的对话框
const viewSalaryDialogVisible = ref(false);
const salaryRecords = ref([]);
const startDate = ref(null); // 时间选择框的开始日期
const endDate = ref(null);   // 时间选择框的结束日期

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await request(API.USER.LIST + `?index=${page.value.index}&size=${page.value.size}&username=${searchQuery.value}&is_employee=true`);
    if (res.data && res.data.code === 200) {
      users.value = res.data.data || [];  // 使用 res.data.data 作为用户列表数据
      page.value.total = res.data.total;  // 从响应中获取总数
    } else {
      users.value = [];
      page.value.total = 0;
    }
  } catch (error) {
    ElMessage.error(error.message || '获取用户列表失败');
    users.value = [];
    page.value.total = 0;
  } finally {
    loading.value = false;
  }
};

// 通过搜索框查询并获取员工数据
const fetchUsersWithSearch = () => {
  fetchUsers(); // 调用已有的 fetchUsers 方法进行查询
};

// 查看薪资记录
const handleViewSalary = async (user) => {
  if (!hasPermission('api_salary_get')) {
    ElMessage.error('您没有权限查看薪资记录');
    return;
  }
  selectedUser.value = user;
  loading.value = true;

  try {
    // 添加分页参数
    let query = `?user_code=${user.code}&index=1&size=50`; // 设置较大的 size 以显示更多记录
    
    // 如果有时间选择，加入查询条件
    if (startDate.value && endDate.value) {
      const startTime = new Date(startDate.value).getTime() / 1000; // 转换为秒级时间戳
      const endTime = new Date(endDate.value).getTime() / 1000;
      query += `&start_time=${startTime}&end_time=${endTime}`;
    }

    const res = await request(API.SALARY.LIST + query);

    if (res.data && res.data.code === 200) {
      // 直接使用返回的数据数组
      salaryRecords.value = res.data.data.map(record => ({
        ...record,
        // 转换时间戳为日期字符串
        pay_date: formatDate(record.pay_date * 1000) // 转换为毫秒级时间戳
      }));
    } else {
      salaryRecords.value = [];
    }
    viewSalaryDialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取薪资记录失败');
  } finally {
    loading.value = false;
  }
};

// 格式化时间戳为日期字符串
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 通过时间筛选薪资记录
const filterByDate = () => {
  if (startDate.value && endDate.value) {
    handleViewSalary(selectedUser.value);
  } else {
    ElMessage.error('请选择开始和结束时间');
  }
};


const handlePay = (user) => {
  if (!hasPermission('api_salary_post')) {
    ElMessage.error('您没有权限发放工资');
    return;
  }
  selectedUser.value = {
    ...user,
    base_salary: parseFloat(user.base_salary) // 转换为数字类型
  }
  payForm.value = {
    bonus: 0,
    deduction: 0
  }
  payDialogVisible.value = true
};

// 提交发放工资
const submitPay = async () => {
  try {
    const res = await request(API.SALARY.CREATE, {
      method: 'POST',
      data: {  // 改用 data 而不是 body
        user_code: selectedUser.value.code,
        bonus: payForm.value.bonus,
        deduction: payForm.value.deduction
      }
    })
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('工资发放成功')
      payDialogVisible.value = false
      fetchUsers()
    }
  } catch (error) {
    ElMessage.error('工资发放失败')
  }
};


const handleDeleteSalaryRecord = async (salaryRecord) => {
  if (!hasPermission('api_salary_delete')) {
    ElMessage.error('您没有权限删除薪资记录');
    return;
  }
  try {
    await request(API.SALARY.DELETE + `?code=${salaryRecord.code}`, {
      method: 'DELETE'
    });
    ElMessage.success('薪资记录删除成功');
    // 重新获取当前用户的薪资记录
    handleViewSalary(selectedUser.value);
  } catch (error) {
    ElMessage.error('删除薪资记录失败');
  }
};

// 分页处理函数
const handleSizeChange = (val) => {
  page.value.size = val;
  page.value.index = 1;  // 切换每页数量时重置到第一页
  fetchUsers();
};

const handleCurrentChange = (val) => {
  page.value.index = val;
  fetchUsers();
};

// 初始化数据
onMounted(() => {
  // 检查是否有查看薪资的基本权限
  if (!hasPermission('api_salary_get')) {
    ElMessage.error('您没有权限访问此页面');
    return;
  }
  fetchUsers();
});
</script>

<style scoped>
.salary-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between; /* 左右分布 */
  align-items: center;
}

.search-container {
  display: flex; /* 输入框和按钮水平排列 */
  gap: 10px; /* 设置间距 */
}

.no-data-message {
  padding: 20px;
  text-align: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
