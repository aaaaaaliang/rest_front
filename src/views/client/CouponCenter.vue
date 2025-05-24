<template>
  <div class="coupon-center">
    <div class="page-header">
      <h2>领券中心</h2>
    </div>

    <!-- 优惠券分类标签页 -->
    <el-tabs v-model="activeTab" class="coupon-tabs">
      <el-tab-pane label="登录券" name="login">
        <div class="coupon-list">
          <el-empty v-if="!hasLoginCoupons" description="暂无登录券" />
          <template v-else>
            <div v-for="coupon in loginCoupons" :key="coupon.code" class="coupon-card">
              <div class="coupon-content">
                <div class="coupon-info">
                  <h3>{{ coupon.name }}</h3>
                  <p class="quota">{{ getCouponQuotaText(coupon) }}</p>
                  <p class="type">{{ getCouponTypeText(coupon.type) }}</p>
                </div>
                <div class="coupon-action">
                  <el-button 
                    type="primary" 
                    :disabled="coupon.owned"
                    @click="handleReceive(coupon)"
                  >
                    {{ coupon.owned ? '已领取' : '领取' }}
                  </el-button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </el-tab-pane>

      <el-tab-pane label="手动券" name="manual">
        <div class="coupon-list">
          <el-empty v-if="!hasManualCoupons" description="暂无手动券" />
          <template v-else>
            <div v-for="coupon in manualCoupons" :key="coupon.code" class="coupon-card">
              <div class="coupon-content">
                <div class="coupon-info">
                  <h3>{{ coupon.name }}</h3>
                  <p class="quota">{{ getCouponQuotaText(coupon) }}</p>
                  <p class="type">{{ getCouponTypeText(coupon.type) }}</p>
                </div>
                <div class="coupon-action">
                  <el-button 
                    type="primary" 
                    :disabled="coupon.owned"
                    @click="handleReceive(coupon)"
                  >
                    {{ coupon.owned ? '已领取' : '领取' }}
                  </el-button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </el-tab-pane>

      <el-tab-pane label="秒杀券" name="seckill">
        <div class="coupon-list">
          <el-empty v-if="!hasSeckillCoupons" description="暂无秒杀券" />
          <template v-else>
            <div v-for="coupon in seckillCoupons" :key="coupon.code" class="coupon-card">
              <div class="coupon-content">
                <div class="coupon-info">
                  <h3>{{ coupon.name }}</h3>
                  <p class="quota">{{ getCouponQuotaText(coupon) }}</p>
                  <p class="type">{{ getCouponTypeText(coupon.type) }}</p>
                </div>
                <div class="coupon-action">
                  <el-button 
                    type="primary" 
                    :disabled="coupon.owned"
                    @click="handleReceive(coupon)"
                  >
                    {{ coupon.owned ? '已领取' : '领取' }}
                  </el-button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'
import { API } from '../../config/api'

const activeTab = ref('login')
const couponList = ref([])
const loading = ref(false)

// 按类型过滤优惠券
const loginCoupons = computed(() => 
  couponList.value.filter(coupon => coupon.grant_type === 'login')
)
const manualCoupons = computed(() => 
  couponList.value.filter(coupon => coupon.grant_type === 'manual')
)
const seckillCoupons = computed(() => 
  couponList.value.filter(coupon => coupon.grant_type === 'seckill')
)

// 是否有对应类型的优惠券
const hasLoginCoupons = computed(() => loginCoupons.value.length > 0)
const hasManualCoupons = computed(() => manualCoupons.value.length > 0)
const hasSeckillCoupons = computed(() => seckillCoupons.value.length > 0)

// 获取优惠券列表
const fetchCoupons = async () => {
  loading.value = true
  try {
    const res = await request(API.COUPON.LIST_ALL)
    if (res.data && res.data.code === 200) {
      couponList.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取优惠券列表失败:', error)
    ElMessage.error('获取优惠券列表失败')
  } finally {
    loading.value = false
  }
}

// 领取优惠券
const handleReceive = async (coupon) => {
  try {
    // 根据优惠券类型选择不同的领取接口
    const url = coupon.grant_type === 'seckill' 
      ? API.COUPON.SECKILL_RECEIVE 
      : API.COUPON.RECEIVE

    const res = await request(url, {
      method: 'POST',
      data: {
        template_code: coupon.code
      }
    })
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('领取成功')
      // 更新列表
      fetchCoupons()
    } else {
      // 对于秒杀券的特殊错误处理
      if (coupon.grant_type === 'seckill') {
        if (res.data?.message?.includes('已抢过')) {
          ElMessage.warning('您已抢过该券')
        } else if (res.data?.message?.includes('已被抢光')) {
          ElMessage.error('优惠券已被抢光')
        } else {
          ElMessage.error(res.data?.message || '领取失败')
        }
      } else {
        ElMessage.error(res.data?.message || '领取失败')
      }
    }
  } catch (error) {
    console.error('领取失败:', error)
    ElMessage.error(error.message || '领取失败')
  }
}

// 工具函数
const getCouponTypeText = (type) => {
  const map = {
    full: '满减券',
    discount: '折扣券',
    cash: '代金券'
  }
  return map[type] || type
}

const getCouponQuotaText = (coupon) => {
  if (coupon.type === 'discount') {
    return `${coupon.quota}折`
  }
  return `${coupon.quota}元`
}

onMounted(() => {
  fetchCoupons()
})
</script>

<style scoped>
.coupon-center {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  
  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.coupon-tabs {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.coupon-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.coupon-card {
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-lighter);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.coupon-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coupon-info {
  h3 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .quota {
    font-size: 24px;
    font-weight: 700;
    color: var(--el-color-danger);
    margin: 8px 0;
  }

  .type {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

.coupon-action {
  .el-button {
    padding: 12px 24px;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }

    &:disabled {
      background-color: var(--el-color-info-light-7);
      border-color: var(--el-color-info-light-7);
      color: var(--el-text-color-placeholder);
    }
  }
}

:deep(.el-tabs__nav) {
  border-radius: 8px;
  padding: 4px;
  background: var(--el-bg-color-page);
}

:deep(.el-tabs__item) {
  border-radius: 6px;
  transition: all 0.3s ease;
  
  &.is-active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
  
  &:hover {
    color: var(--el-color-primary);
  }
}
</style> 