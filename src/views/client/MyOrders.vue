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

          <el-table-column label="订单信息" min-width="300">
            <template #default="{ row }">
              <div class="order-info">
                <div class="order-header">
                  <div class="table-info">
                    <el-icon><Location /></el-icon>
                    <span>餐桌号：{{ row.table_no }}</span>
                  </div>
                  <div class="customer-info">
                    <el-icon><User /></el-icon>
                    <span>顾客：{{ row.customer }}</span>
                  </div>
                </div>
                <div class="order-details">
                  <div v-for="item in row.order_detail" :key="item.product_code" class="order-item">
                    <el-image
                      :src="item.picture"
                      fit="cover"
                      class="product-image"
                    >
                      <template #error>
                        <div class="image-placeholder">
                          <el-icon><Picture /></el-icon>
                        </div>
                      </template>
                    </el-image>
                    <div class="item-info">
                      <span class="product-name">{{ item.product_name }}</span>
                      <div class="item-meta">
                        <span class="price">¥{{ item.price.toFixed(2) }}</span>
                        <span class="quantity">x{{ item.quantity }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="row.remark" class="order-remark">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>备注：{{ row.remark }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="total_price" label="总价" width="120">
            <template #default="{ row }">
              <div class="price-info">
                <div v-if="row.coupon_amount" class="original-price">
                  ¥{{ row.total_price.toFixed(2) }}
                </div>
                <div class="final-price">
                  ¥{{ (row.coupon_amount || row.total_price).toFixed(2) }}
                </div>
              </div>
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
import { Picture, Location, User, ChatDotRound } from "@element-plus/icons-vue";
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

<style scoped lang="scss">
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

.order-info {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;

  .order-header {
    display: flex;
    gap: 20px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .table-info, .customer-info {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--el-text-color-regular);
      font-size: 14px;

      .el-icon {
        font-size: 16px;
        color: var(--el-color-primary);
      }
    }
  }

  .order-details {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .order-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: var(--el-bg-color);
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      }

      .product-image {
        width: 50px;
        height: 50px;
        border-radius: 6px;
        object-fit: cover;
      }

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .product-name {
          font-size: 14px;
          color: var(--el-text-color-primary);
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;

          .price {
            color: var(--el-color-danger);
            font-weight: 600;
          }

          .quantity {
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .order-remark {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    .el-icon {
      color: var(--el-color-info);
    }
  }
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  
  .original-price {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-decoration: line-through;
  }
  
  .final-price {
    font-size: 16px;
    color: var(--el-color-danger);
    font-weight: 600;
  }
}
</style>
