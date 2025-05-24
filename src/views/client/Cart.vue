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
                  :src="row.picture?.code"
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

          <el-table-column label="数量" width="150" align="center">
            <template #default="{ row }">
              <el-input-number
                  v-model="row.select_num"
                  :min="1"
                  :max="99"
                  size="small"
                  :controls="true"
                  :controls-position="'right'"
                  @change="(value) => handleQuantityChange(row, value)"
              />
            </template>
          </el-table-column>

          <el-table-column label="小计" width="120" align="center">
            <template #default="{ row }">
              <span class="subtotal">
                ¥{{ ((row.product_price ?? 0) * (row.select_num ?? 1)).toFixed(2) }}
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

      <!-- 结算对话框 -->
      <el-dialog
        v-model="checkoutDialogVisible"
        title="确认订单信息"
        width="500px"
      >
        <el-form
          ref="checkoutFormRef"
          :model="checkoutForm"
          :rules="checkoutRules"
          label-width="100px"
        >
          <el-form-item label="餐桌号" prop="table_no">
            <el-select 
              v-model="checkoutForm.table_no" 
              placeholder="请选择餐桌"
              style="width: 100%"
            >
              <el-option
                v-for="table in tables"
                :key="table.code"
                :label="`${table.location} - ${table.seats}人桌`"
                :value="table.location"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="称呼" prop="customer">
            <el-input 
              v-model="checkoutForm.customer"
              placeholder="请输入您的称呼"
            />
          </el-form-item>

          <el-form-item label="优惠券">
            <el-select 
              v-model="checkoutForm.coupon_code" 
              placeholder="请选择优惠券"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="coupon in availableCoupons"
                :key="coupon.code"
                :label="`${coupon.name}（${getCouponSimpleDesc(coupon)}）`"
                :value="coupon.code"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="备注" prop="remark">
            <el-input 
              v-model="checkoutForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入订单备注（选填）"
            />
          </el-form-item>

          <el-form-item label="订单金额">
            <div class="price-details">
              <div class="original-price" v-if="finalPrice < totalPrice">
                原价：<span class="price">¥{{ totalPrice.toFixed(2) }}</span>
              </div>
              <div class="final-price">
                实付：<span class="price">¥{{ finalPrice.toFixed(2) }}</span>
              </div>
            </div>
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="checkoutDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitOrder"
            :loading="submitting"
          >
            提交订单
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { API } from '../../config/api'

const router = useRouter()
const items = ref([])
const loading = ref(false)
const submitting = ref(false)
const checkoutDialogVisible = ref(false)
const checkoutFormRef = ref()
const tables = ref([])
const availableCoupons = ref([])

// 结算表单
const checkoutForm = ref({
  table_no: '',
  customer: '',
  remark: '',
  coupon_code: ''
})

// 结算表单验证规则
const checkoutRules = {
  table_no: [
    { required: true, message: '请选择餐桌', trigger: 'change' }
  ],
  customer: [
    { required: true, message: '请输入称呼', trigger: 'blur' },
    { max: 20, message: '称呼不能超过20个字符', trigger: 'blur' }
  ],
  remark: [
    { max: 200, message: '备注不能超过200个字符', trigger: 'blur' }
  ]
}

// 购物车商品列表
const cartItems = computed(() => items.value || [])

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

// 获取购物车列表
const fetchCartList = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      index: 1,
      size: 100
    })
    const res = await request(`${API.CART.LIST}?${params}`)
    if (res.data && res.data.code === 200) {
      items.value = res.data.data || []
    }
  } catch (error) {
    ElMessage.error('获取购物车失败')
    console.error('获取购物车失败:', error)
  } finally {
    loading.value = false
  }
}

const handleQuantityChange = async (item, value) => {
  try {
    const res = await request(API.CART.ADD, {
      method: 'POST',
      data: {
        product_code: item.product_code,
        product_num: value  // 直接传递新值
      }
    });

    if (res.data && res.data.code === 200) {
      ElMessage.success('更新成功');
      await fetchCartList();  // 刷新购物车
    }
  } catch (error) {
    ElMessage.error('更新数量失败');
    console.error('更新数量失败:', error);
  }
};

// 删除商品
const handleRemove = async (item) => {
  try {
    await ElMessageBox.confirm('确定要删除这个商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await request(API.CART.DELETE, {
      method: 'POST',
      data: {
        code: [item.code]
      }
    })
    
    if (res.data && res.data.code === 200) {
      ElMessage.success('删除成功')
      await fetchCartList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除失败:', error)
    }
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
    
    const res = await request(API.CART.DELETE, {
      method: 'POST',
      data: {
        code: cartItems.value.map(item => item.code)
      }
    })
    
    if (res.data && res.data.code === 200) {
      items.value = []
      ElMessage.success('清空购物车成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空购物车失败')
      console.error('清空购物车失败:', error)
    }
  }
}


// 获取餐桌列表（支持分页）
const fetchTables = async (index = 1, size = 10) => {
  try {
    const params = new URLSearchParams({
      index: index.toString(),
      size: size.toString()
    })

    const res = await request(`${API.TABLE.LIST}?${params.toString()}`)

    if (res.data && res.data.code === 200) {
      tables.value = res.data.data || []
    }
  } catch (error) {
    ElMessage.error('获取餐桌列表失败')
    console.error('获取餐桌列表失败:', error)
  }
}

// 获取用户优惠券列表
const fetchUserCoupons = async () => {
  try {
    const res = await request(API.COUPON.USER_COUPONS)
    if (res.data && res.data.code === 200) {
      // 只显示未使用且未过期的优惠券
      availableCoupons.value = (res.data.data || []).filter(coupon => {
        const now = Date.now() / 1000
        return coupon.status === 0 && coupon.expire_time > now
      })
      console.log('可用优惠券:', availableCoupons.value)
    }
  } catch (error) {
    console.error('获取优惠券列表失败:', error)
    ElMessage.error('获取优惠券列表失败')
  }
}

// 简化优惠券描述
const getCouponSimpleDesc = (coupon) => {
  if (!coupon) return ''
  switch (coupon.type) {
    case 'full':
      return `满${coupon.min_amount}减${coupon.quota}元`
    case 'discount':
      return `满${coupon.min_amount}享${coupon.quota * 10}折`
    case 'cash':
      return `无门槛减${coupon.quota}元`
    default:
      return ''
  }
}

// 计算优惠后的价格
const finalPrice = computed(() => {
  if (!checkoutForm.value.coupon_code) {
    return totalPrice.value
  }
  
  const selectedCoupon = availableCoupons.value.find(
    c => c.code === checkoutForm.value.coupon_code
  )
  
  if (!selectedCoupon) {
    return totalPrice.value
  }
  
  // 如果订单金额小于最低使用金额，不应用优惠
  if (totalPrice.value < selectedCoupon.min_amount) {
    return totalPrice.value
  }
  
  // 根据优惠券类型计算实际优惠金额
  let discount = 0
  switch (selectedCoupon.type) {
    case 'full':
    case 'cash':
      discount = Math.min(selectedCoupon.quota, totalPrice.value)
      break
    case 'discount':
      discount = totalPrice.value * (1 - selectedCoupon.quota)
      break
  }
  
  return Math.max(0, totalPrice.value - discount)
})

// 去结算
const handleCheckout = async () => {
  checkoutForm.value = {
    table_no: '',
    customer: '',
    remark: '',
    coupon_code: ''
  }
  checkoutDialogVisible.value = true
  await fetchUserCoupons() // 获取可用优惠券
}

// 提交订单
const submitOrder = async () => {
  if (!checkoutFormRef.value) return
  
  await checkoutFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const orderData = {
          table_no: checkoutForm.value.table_no,
          customer: checkoutForm.value.customer,
          total_price: totalPrice.value,
          details: cartItems.value.map(item => ({
            product_code: item.product_code,
            product_name: item.product_name,
            quantity: item.select_num,
            price: item.product_price,
            picture: item.picture?.code
          })),
          remark: checkoutForm.value.remark,
          coupon_code: checkoutForm.value.coupon_code,
          client_payable_amount: finalPrice.value // 添加前端计算的最终支付金额
        }

        const res = await request(API.ORDER.ADD, {
          method: 'POST',
          data: orderData
        })

        if (res.data && res.data.code === 200) {
          ElMessage.success('下单成功')
          checkoutDialogVisible.value = false
          items.value = []
          
          let countdown = 1
          const timer = setInterval(() => {
            if (countdown > 0) {
              ElMessage({
                message: `${countdown}秒后跳转到订单页面...`,
                type: 'info',
                duration: 1000
              })
              countdown--
            } else {
              clearInterval(timer)
              router.push('/orders')
            }
          }, 1000)
        }
      } catch (error) {
        ElMessage.error(error.message || '下单失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 初始化
onMounted(() => {
  fetchCartList()
  fetchTables()
})
</script>

<style scoped lang="scss">
.cart-page {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: var(--el-bg-color-page);
}

.cart-content {
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);

  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

.product-info {
  display: flex;
  align-items: center;
  gap: 16px;

  .product-image {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  .product-name {
    font-size: 15px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }
}

.price, .subtotal {
  color: var(--el-color-danger);
  font-weight: 600;
  font-size: 16px;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);

  .footer-left {
    .total-count {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 24px;

    .total-price {
      font-size: 15px;
      color: var(--el-text-color-regular);
      
      .price {
        font-size: 24px;
        margin-left: 8px;
        color: var(--el-color-danger);
        font-weight: 600;
      }
    }

    .el-button {
      padding: 12px 32px;
      font-size: 16px;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
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
  font-size: 24px;
}

/* 结算对话框样式 */
.order-total {
  font-size: 24px;
  color: var(--el-color-danger);
  font-weight: 600;
  text-align: right;
  margin-top: 16px;
}

:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;

  .el-dialog__header {
    margin: 0;
    padding: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-overlay);
  }

  .el-dialog__body {
    padding: 24px;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-overlay);
  }
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.el-input-number) {
  .el-input__wrapper {
    box-shadow: none;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    
    &:hover {
      border-color: var(--el-color-primary);
    }
    
    &.is-focus {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
    }
  }
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  
  th {
    background: var(--el-bg-color-overlay);
    font-weight: 600;
  }
  
  td {
    padding: 16px 0;
  }
}

:deep(.el-button--link) {
  font-weight: 500;
  
  &:hover {
    opacity: 0.8;
  }
}

.coupon-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
  
  .coupon-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .coupon-header {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .coupon-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      .coupon-type {
        font-size: 12px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
    
    .coupon-desc {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      .discount-info {
        font-size: 13px;
        color: var(--el-color-danger);
        font-weight: 500;
      }
      
      .expire-info {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  .coupon-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    
    .min-amount {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
    
    .discount-amount {
      font-size: 16px;
      color: var(--el-color-danger);
      font-weight: 600;
    }
  }
}

:deep(.el-select-dropdown__item) {
  padding: 0 12px;
  
  &.selected {
    .coupon-option {
      background: var(--el-color-primary-light-9);
    }
  }
}

.price-details {
  text-align: right;
  
  .original-price {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    text-decoration: line-through;
    margin-bottom: 4px;
  }
  
  .final-price {
    font-size: 24px;
    color: var(--el-color-danger);
    font-weight: 600;
  }
}
</style> 