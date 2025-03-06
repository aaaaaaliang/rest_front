<template>
  <div class="orders-page">
    <el-card class="orders-content">
      <template #header>
        <div class="orders-header">
          <h3>我的订单</h3>
        </div>
      </template>

      <div v-if="orders.length" class="orders-list">
        <el-table :data="orders" style="width: 100%">
          <el-table-column prop="code" label="订单编号" width="220" />

          <el-table-column label="订单详情">
            <template #default="{ row }">
              <div v-for="item in row.order_detail" :key="item.product_code" class="order-item">
                <el-image
                    :src="item.picture"
                    fit="cover"
                    class="product-image"
                    style="width: 50px; height: 50px;"
                >
                  <template #error>
                    <div class="image-placeholder">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <span class="product-name">{{ item.product_name }}</span>
                <span class="quantity">x{{ item.quantity }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="total_price" label="总价" width="120">
            <template #default="{ row }">
              <span class="price">¥{{ row.total_price.toFixed(2) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="150">
            <template #default="{ row }">
              <el-tag :type="getOrderStatusType(row.status)">
                {{ getOrderStatusText(row.status) }}
              </el-tag>
              <!-- 如果订单状态为待支付，显示倒计时 -->
              <div v-if="row.status === 5 && row.remaining > 0" class="countdown-timer">
                剩余支付时间：{{ formatCountdown(row.remaining) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="created" label="下单时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <!-- 订单状态为待支付时显示操作按钮 -->
              <el-button v-if="row.status === 5" type="primary" link @click="handlePayOrder(row)">
                去支付
              </el-button>
              <el-button v-if="row.status === 5" type="danger" link @click="handleCancelOrder(row)">
                取消订单
              </el-button>

              <!-- 其他状态 -->
              <span v-else-if="row.status === 1" class="disabled-text">订单已支付</span>
              <span v-else class="disabled-text">无法处理</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
              v-model:current-page="queryParams.index"
              v-model:page-size="queryParams.size"
              :page-sizes="[10, 20, 50]"
              :total="total"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <el-empty v-else description="暂无订单" />
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Picture } from "@element-plus/icons-vue";
import request from "../../utils/request";
import { API } from "../../config/api";

const orders = ref([]);
const total = ref(0);
const route = useRoute();
const router = useRouter();

const queryParams = reactive({
  index: 1,
  size: 10
});

// 全局定时器ID
let countdownTimer = null;

// 获取订单列表，并初始化每个订单的倒计时字段
const fetchOrders = async () => {
  try {
    const res = await request(`${API.ORDER.LIST}?index=${queryParams.index}&size=${queryParams.size}`, {
      method: "GET"
    });
    if (res.data && res.data.code === 200) {
      // 遍历订单，若订单状态为待支付，初始化剩余倒计时（单位：秒）
      orders.value = (res.data.data || []).map(order => {
        if (order.status === 5) {
          // 计算剩余时间：订单创建时间 + 15分钟 - 当前时间
          const remaining = Math.floor((order.created * 1000 + 15 * 60 * 1000 - Date.now()) / 1000);
          order.remaining = remaining > 0 ? remaining : 0;
          order.autoCancelling = false; // 标记是否正在自动取消，避免重复调用
        }
        return order;
      });
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error("获取订单列表失败:", error);
  }
};

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

// 格式化倒计时（秒 -> mm分ss秒）
const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s < 10 ? '0' : ''}${s}秒`;
};

const getOrderStatusText = (status) => {
  const statusMap = {
    1: "已下单",
    2: "制作中",
    3: "已完成",
    4: "已取消",
    5: "待支付"
  };
  return statusMap[status] || "未知状态";
};

const getOrderStatusType = (status) => {
  const typeMap = {
    1: "info",
    2: "warning",
    3: "success",
    4: "danger",
    5: "danger"
  };
  return typeMap[status] || "info";
};

const handleSizeChange = (val) => {
  queryParams.size = val;
  queryParams.index = 1;
  fetchOrders();
};

const handleCurrentChange = (val) => {
  queryParams.index = val;
  fetchOrders();
};

const handleCancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm("确定要取消该订单吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    const res = await request(API.ORDER.UPDATE, {
      method: "PUT",
      data: {
        code: order.code,
        status: 4, // 4 = 已取消
        remark: "用户取消订单"
      }
    });
    if (res.data && res.data.code === 200) {
      ElMessage.success("订单取消成功");
      fetchOrders();
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("取消订单失败:", error);
      ElMessage.error("取消订单失败");
    }
  }
};

// 自动取消订单（当倒计时结束时调用，不需要用户确认）
const handleAutoCancelOrder = async (order) => {
  if (order.autoCancelling) return;
  order.autoCancelling = true;
  try {
    const res = await request(API.ORDER.UPDATE, {
      method: "PUT",
      data: {
        code: order.code,
        status: 4, // 4 = 已取消
        remark: "订单自动取消"
      }
    });
    if (res.data && res.data.code === 200) {
      ElMessage.success(`订单 ${order.code} 已自动取消`);
      fetchOrders();
    }
  } catch (error) {
    console.error("自动取消订单失败:", error);
  }
};

const handlePayOrder = async (order) => {
  try {
    const res = await request(`/api/pay?order_code=${order.code}`, {
      method: "GET"
    });
    const payUrl = res.data?.data?.pay_url;
    if (payUrl) {
      window.location.href = payUrl;
    } else {
      ElMessage.error("获取支付链接失败");
    }
  } catch (error) {
    console.error("支付失败:", error);
    ElMessage.error("支付失败");
  }
};

// 检查 URL 中的 out_trade_no，更新订单状态
const checkPaymentStatus = async () => {
  const orderCode = route.query.out_trade_no;
  if (!orderCode) {
    console.log("没有订单编号，跳过支付状态检查");
    return;
  }
  try {
    const res = await request(API.ORDER.UPDATE, {
      method: "PUT",
      data: {
        code: orderCode,
        status: 1, // 1 = 已支付
        remark: "前端确认支付成功",
        version: 0
      }
    });
    if (res.data && res.data.code === 200) {
      ElMessage.success("订单支付成功");
      fetchOrders();
    } else {
      ElMessage.error("更新订单失败");
    }
  } catch (error) {
    console.error("订单更新失败:", error);
    ElMessage.error("订单更新失败");
  }
  setTimeout(() => {
    router.replace({ path: "/my-orders" });
  }, 2000);
};

// 启动定时器，每秒更新待支付订单的倒计时
const startCountdownTimer = () => {
  countdownTimer = setInterval(() => {
    orders.value.forEach(order => {
      if (order.status === 5) {
        // 计算剩余时间（单位：秒）
        const remaining = Math.floor((order.created * 1000 + 15 * 60 * 1000 - Date.now()) / 1000);
        if (remaining <= 0) {
          order.remaining = 0;
          // 倒计时结束，自动取消订单
          handleAutoCancelOrder(order);
        } else {
          order.remaining = remaining;
        }
      }
    });
  }, 1000);
};

onMounted(() => {
  checkPaymentStatus();
  fetchOrders();
  startCountdownTimer();
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style scoped>
.disabled-text {
  color: gray;
  font-size: 14px;
}

.orders-page {
  padding: 20px;
  background: #f5f5f5;
}

.orders-content {
  max-width: 1200px;
  margin: 0 auto;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.product-image {
  width: 50px;
  height: 50px;
  border-radius: 4px;
}

.countdown-timer {
  font-size: 12px;
  color: red;
  margin-top: 5px;
}
</style>
