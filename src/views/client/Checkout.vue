<template>
  <div class="checkout-page">
    <el-card class="checkout-content">
      <template #header>
        <div class="checkout-header">
          <h3>确认订单</h3>
        </div>
      </template>

      <!-- 订单商品列表 -->
      <el-table :data="cartItems" style="width: 100%">
        <el-table-column label="商品" min-width="400">
          <template #default="{ row }">
            <div class="product-info">
              <el-image
                :src="getImageUrl(row.picture?.code, IMAGE_SIZE.THUMBNAIL)"
                fit="cover"
                class="product-image"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <span class="product-name">{{ row.product_name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="单价" width="120" align="center">
          <template #default="{ row }">
            <span class="price">¥{{ (row.product_price ?? 0).toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="数量" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.select_num }}</span>
          </template>
        </el-table-column>

        <el-table-column label="小计" width="120" align="center">
          <template #default="{ row }">
            <span class="subtotal">
              ¥{{ ((row.product_price ?? 0) * (row.select_num ?? 1)).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 订单信息 -->
      <div class="order-info">
        <el-form
          ref="orderFormRef"
          :model="orderForm"
          :rules="orderRules"
          label-width="100px"
        >
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="orderForm.remark"
              type="textarea"
              placeholder="请输入备注信息（选填）"
              :rows="3"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 订单底部 -->
      <div class="order-footer">
        <div class="footer-left">
          <span class="total-count">
            共 {{ totalCount }} 件商品
          </span>
        </div>
        <div class="footer-right">
          <div class="total-price">
            合计：<span class="price">¥{{ totalPrice.toFixed(2) }}</span>
          </div>
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="handleSubmitOrder"
          >
            提交订单
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { IMAGE_SIZE, getImageUrl } from '../../config/constants'
import request from '../../utils/request'
import { API } from '../../config/api'

const router = useRouter()
const cartStore = useCartStore()
const orderFormRef = ref()
const submitting = ref(false)

// 订单表单
const orderForm = ref({
  remark: ''
})

// 表单验证规则
const orderRules = {
  // 移除 phone 相关验证
}

// 购物车商品列表
const cartItems = computed(() => {
  return cartStore.items || []
})

// 计算总数量
const totalCount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.select_num || 0), 0)
})

// 计算总价
const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    return sum + (item.product_price || 0) * (item.select_num || 0)
  }, 0)
})

// 格式化订单详情
const formatOrderDetails = (items) => {
  return items.map(item => ({
    product_code: item.product_code,
    product_name: item.product_name,
    quantity: item.select_num,
    price: item.product_price,
    picture: item.picture?.code || ''
  }))
}

// 提交订单
const handleSubmitOrder = async () => {
  if (!orderFormRef.value) return
  if (!cartItems.value.length) {
    ElMessage.warning('购物车为空，无法提交订单')
    return
  }

  await orderFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const orderData = {
          total_price: totalPrice.value,
          details: formatOrderDetails(cartItems.value),
          remark: orderForm.value.remark || ''
        }

        const res = await request(API.ORDER.ADD, {
          method: 'POST',
          data: orderData
        })

        if (res.data && res.data.code === 200) {
          ElMessage.success('订单提交成功')
          await cartStore.clearCart()
          router.push('/orders')
        }
      } catch (error) {
        console.error('提交订单失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 初始化时获取购物车数据
onMounted(async () => {
  try {
    await cartStore.fetchCartList()
    if (!cartItems.value.length) {
      ElMessage.warning('购物车为空')
      router.push('/menu')
    }
  } catch (error) {
    console.error('获取购物车数据失败:', error)
    ElMessage.error('获取购物车数据失败')
  }
})
</script>

<style scoped lang="scss">
.checkout-page {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: #f5f5f5;
}

.checkout-content {
  max-width: 1200px;
  margin: 0 auto;

  .checkout-header {
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .product-image {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
  }

  .product-name {
    font-size: 14px;
  }
}

.price, .subtotal {
  color: var(--el-color-danger);
  font-weight: 600;
}

.order-info {
  margin-top: 20px;
  padding: 20px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 20px;
  background: var(--el-fill-color-light);
  border-radius: 4px;

  .footer-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .total-price {
      font-size: 14px;

      .price {
        font-size: 20px;
        margin-left: 8px;
      }
    }
  }
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}
</style>