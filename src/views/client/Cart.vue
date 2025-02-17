<template>
  <div class="cart-page">
    <el-card class="cart-content">
      <template #header>
        <div class="cart-header">
          <h3>我的购物车</h3>
          <el-button 
            type="danger" 
            link 
            :disabled="!cartItems.length"
            @click="handleClearCart"
          >
            清空购物车
          </el-button>
        </div>
      </template>

      <!-- 购物车列表 -->
      <div v-if="cartItems.length" class="cart-list">
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
              <span class="price">¥{{ row.product_price.toFixed(2) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="数量" width="150" align="center">
            <template #default="{ row }">
              <el-input-number
                v-model="row.select_num"
                :min="1"
                :max="99"
                size="small"
                @change="(value) => handleQuantityChange(row, value)"
              />
            </template>
          </el-table-column>

          <el-table-column label="小计" width="120" align="center">
            <template #default="{ row }">
              <span class="subtotal">
                ¥{{ (row.product_price * row.select_num).toFixed(2) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button 
                type="danger" 
                link
                @click="handleRemove(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 购物车底部 -->
        <div class="cart-footer">
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
              @click="handleCheckout"
            >
              去结算
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空购物车 -->
      <el-empty 
        v-else 
        description="购物车是空的"
      >
        <el-button type="primary" @click="$router.push('/')">
          去选购
        </el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { IMAGE_SIZE, getImageUrl } from '../../config/constants'

const router = useRouter()
const cartStore = useCartStore()

// 购物车商品列表
const cartItems = computed(() => cartStore.items)

// 计算总数量
const totalCount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.select_num, 0)
})

// 计算总价
const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    return sum + item.product_price * item.select_num
  }, 0)
})

// 更新商品数量
const handleQuantityChange = async (item, value) => {
  await cartStore.updateQuantity(item.product_code, value)
}

// 删除商品
const handleRemove = async (item) => {
  try {
    await ElMessageBox.confirm('确定要删除这个商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cartStore.removeFromCart(item.code)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消删除
  }
}

// 清空购物车
const handleClearCart = async () => {
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cartStore.clearCart()
  } catch {
    // 用户取消清空
  }
}

// 去结算
const handleCheckout = () => {
  router.push('/checkout')
}

// 初始化
onMounted(() => {
  cartStore.fetchCartList()
})
</script>

<style scoped lang="scss">
.cart-page {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: #f5f5f5;
}

.cart-content {
  max-width: 1200px;
  margin: 0 auto;

  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

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

.cart-footer {
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