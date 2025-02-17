<template>
  <div class="checkout-page">
    <el-card class="checkout-content">
      <template #header>
        <div class="page-header">
          <h3><el-icon><ShoppingCart /></el-icon> 订单确认</h3>
        </div>
      </template>

      <!-- 商品列表 -->
      <div class="products-list">
        <h4><el-icon><Goods /></el-icon> 商品清单</h4>
        <div class="product-items">
          <div v-for="item in cartItems" :key="item.code" class="product-item">
            <el-image
              :src="getImageUrl(item.picture?.code, IMAGE_SIZE.THUMBNAIL)"
              fit="cover"
              class="product-image"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="product-info">
              <div class="product-name">{{ item.product_name }}</div>
              <div class="product-meta">
                <span class="price">¥{{ item.product_price.toFixed(2) }}</span>
                <span class="quantity"><el-icon><Histogram /></el-icon> {{ item.select_num }}</span>
              </div>
            </div>
            <div class="product-total">
              ¥{{ (item.product_price * item.select_num).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="order-info">
        <h4><el-icon><Memo /></el-icon> 订单备注</h4>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="0"
          class="order-form"
        >
          <el-form-item prop="remark">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注信息（选填）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 订单金额 -->
      <div class="order-amount">
        <div class="amount-item">
          <el-icon><Money /></el-icon>
          <span>商品总额</span>
          <span class="price">¥{{ totalPrice.toFixed(2) }}</span>
        </div>
      </div>

      <!-- 提交订单 -->
      <div class="submit-order">
        <div class="total">
          <span>实付款</span>
          <span class="price">¥{{ totalPrice.toFixed(2) }}</span>
        </div>
        <el-button 
          type="primary" 
          :loading="submitting"
          @click="handleSubmit"
        >
          <el-icon><Check /></el-icon> 提交订单
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useOrderStore } from '../../stores/order'
import { ElMessage } from 'element-plus'
import { 
  Picture, 
  ShoppingCart, 
  Goods, 
  Memo, 
  Money, 
  Check,
  Histogram 
} from '@element-plus/icons-vue'
import { IMAGE_SIZE, getImageUrl } from '../../config/constants'

const router = useRouter()
const cartStore = useCartStore()
const orderStore = useOrderStore()
const formRef = ref(null)
const submitting = ref(false)

// 购物车商品
const cartItems = computed(() => cartStore.items)

// 总价
const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    return sum + item.product_price * item.select_num
  }, 0)
})

// 表单数据
const form = ref({
  remark: ''
})

// 表单校验规则
const rules = {
  remark: [{ max: 200, message: '备注不能超过200个字符', trigger: 'blur' }]
}

// 提交订单
const handleSubmit = async () => {
  if (!cartItems.value.length) {
    ElMessage.warning('购物车是空的')
    return
  }

  if (!formRef.value) return

  try {
    submitting.value = true
    const success = await orderStore.createOrderFromCart(cartItems.value, form.value.remark)
    if (success) {
      // 清空购物车
      await cartStore.clearCart()
      // 跳转到订单列表
      router.push('/orders')
    }
  } finally {
    submitting.value = false
  }
}

// 检查购物车是否为空
onMounted(() => {
  if (!cartItems.value.length) {
    ElMessage.warning('购物车是空的')
    router.push('/cart')
  }
})
</script>

<style scoped lang="scss">
.checkout-page {
  padding: 16px;
  min-height: calc(100vh - 60px);
  background: #f5f5f5;
}

.checkout-content {
  max-width: 800px;
  margin: 0 auto;

  .page-header {
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

.products-list {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--el-text-color-regular);
  }
}

.product-items {
  .product-item {
    display: flex;
    align-items: center;
    padding: 12px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    margin-bottom: 8px;

    .product-image {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      overflow: hidden;
      margin-right: 12px;
    }

    .product-info {
      flex: 1;
      min-width: 0;

      .product-name {
        font-size: 14px;
        margin-bottom: 4px;
        color: var(--el-text-color-primary);
      }

      .product-meta {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        display: flex;
        align-items: center;
        gap: 8px;

        .price {
          color: var(--el-color-danger);
        }

        .quantity {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .product-total {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-color-danger);
    }
  }
}

.order-info {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--el-text-color-regular);
  }
}

.order-form {
  margin-bottom: 0;
}

.order-amount {
  padding: 16px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  margin-bottom: 16px;

  .amount-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-regular);
    font-size: 14px;

    .price {
      margin-left: auto;
      font-weight: 600;
      color: var(--el-color-danger);
    }
  }
}

.submit-order {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);

  .total {
    font-size: 14px;
    color: var(--el-text-color-regular);
    display: flex;
    align-items: center;
    gap: 8px;

    .price {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-color-danger);
    }
  }

  .el-button {
    padding: 12px 24px;
    .el-icon {
      margin-right: 4px;
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