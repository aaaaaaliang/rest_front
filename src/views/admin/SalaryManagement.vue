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
            <el-button size="small" type="primary" @click="handleViewSalary(scope.row)">查看薪资记录</el-button>
            <el-button size="small" type="success" @click="handlePay(scope.row)">发放工资</el-button>
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
          v-model:current-page="page.index"
          v-model:page-size="page.size"
          :total="page.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>

    <!-- 发放工资对话框 -->
    <el-dialog v-model="payDialogVisible" title="发放工资" width="400px">
      <el-form ref="payFormRef" :model="payForm" label-width="100px">
        <el-form-item label="基础工资" :prop="baseSalary">
          <el-input-number v-model="selectedUser.base_salary" :disabled="true" style="width: 100%" />
        </el-form-item>
        <el-form-item label="奖金" prop="bonus">
          <el-input-number v-model="payForm.bonus" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="扣款" prop="deduction">
          <el-input-number v-model="payForm.deduction" :min="0" :precision="2" style="width: 100%" />
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
          <el-table-column prop="pay_date" label="发放日期" :formatter="formatDate" />
          <el-table-column prop="bonus" label="奖金" />
          <el-table-column prop="deduction" label="扣款" />
          <el-table-column prop="total_salary" label="总薪资" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" type="danger" @click="handleDeleteSalaryRecord(scope.row)">删除</el-button>
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
    if (res.data) {
      users.value = res.data;
      page.value.total = res.total;
    } else {
      users.value = [];
    }
  } catch (error) {
    ElMessage.error(error.message || '获取用户列表失败');
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
  selectedUser.value = user;
  loading.value = true;

  try {
    let query = `?index=${page.value.index}&size=${page.value.size}&user_code=${user.code}`;

    // 如果有时间选择，加入查询条件
    if (startDate.value && endDate.value) {
      const startTime = new Date(startDate.value).getTime();
      const endTime = new Date(endDate.value).getTime();
      query += `&start_time=${startTime}&end_time=${endTime}`;
    }

    const res = await request(API.SALARY.LIST + query);

    if (res.data && res.data.length > 0) {
      salaryRecords.value = res.data.map(record => ({
        ...record,
        pay_date: formatDate(record.pay_date),
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


// 格式化时间戳或日期字符串为日期
const formatDate = (payDate) => {
  if (!payDate) {
    return "-";  // 无效日期返回 "-"
  }

  // 如果是对象类型的 payDate，尝试提取日期字段
  if (typeof payDate === "object") {
    payDate = payDate.pay_date || payDate.timestamp || "";
  }

  // 如果是字符串类型的日期，尝试转换为日期对象
  if (typeof payDate === "string" && Date.parse(payDate)) {
    const date = new Date(payDate);
    return date.toLocaleDateString(); // 格式为 YYYY-MM-DD
  }

  // 如果是有效的时间戳（秒级或毫秒级）
  if (!isNaN(payDate) && payDate > 0) {
    const date = new Date(payDate);
    return date.toLocaleDateString(); // 格式为 YYYY-MM-DD
  }

  return "-";
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
  selectedUser.value = user;
  payDialogVisible.value = true;
};

// 提交发放工资
const submitPay = async () => {
  try {
    const res = await request(API.SALARY.CREATE, {
      method: 'POST',
      body: JSON.stringify({
        user_code: selectedUser.value.code,
        bonus: payForm.value.bonus,
        deduction: payForm.value.deduction
      })
    });
    ElMessage.success('工资发放成功');
    payDialogVisible.value = false;
    fetchUsers();
  } catch (error) {
    ElMessage.error('工资发放失败');
  }
};


const handleDeleteSalaryRecord = async (salaryRecord) => {
  try {
    await request(API.SALARY.DELETE + `?code=${salaryRecord.code}`, {
      method: 'DELETE'
    });
    ElMessage.success('薪资记录删除成功');
    fetchUsers();
  } catch (error) {
    ElMessage.error('删除薪资记录失败');
  }
};

// 分页大小变化
const handleSizeChange = (size) => {
  page.value.size = size;
  fetchUsers();
};

// 当前页码变化
const handleCurrentChange = (pageNumber) => {
  page.value.index = pageNumber;
  fetchUsers();
};

// 初始化数据
onMounted(() => {
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
