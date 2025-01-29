<template>
  <div class="cart-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的购物车</span>
          <el-button 
            type="danger" 
            plain
            size="small"
            @click="handleClearCart"
            v-if="cartItems.length > 0"
          >
            清空购物车
          </el-button>
        </div>
      </template>

      <template v-if="cartItems.length > 0">
        <el-table :data="cartItems" style="width: 100%">
          <el-table-column label="菜品" width="400">
            <template #default="scope">
              <div class="dish-info">
                <img :src="scope.row.image" class="dish-image">
                <div>
                  <h4>{{ scope.row.name }}</h4>
                  <p class="description">{{ scope.row.description }}</p>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="单价" width="120">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="数量" width="150">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.quantity" 
                :min="1"
                :max="99"
                size="small"
                @change="handleQuantityChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计">
            <template #default="scope">
              ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                @click="handleRemoveFromCart(scope.row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="cart-footer">
          <div class="total">
            <span>总计：</span>
            <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
          </div>
          <el-button type="primary" @click="handleCheckout">
            去结算
          </el-button>
        </div>
      </template>

      <el-empty 
        v-else 
        description="购物车是空的"
      >
        <el-button type="primary" @click="$router.push('/menu')">
          去点餐
        </el-button>
      </el-empty>
    </el-card>

    <!-- 结算对话框 -->
    <el-dialog
      v-model="checkoutDialogVisible"
      title="订单确认"
      width="600px"
    >
      <el-form
        :model="orderForm"
        :rules="rules"
        ref="orderFormRef"
        label-width="100px"
      >
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="orderForm.phone" />
        </el-form-item>
        <el-form-item label="配送地址" prop="address">
          <el-input v-model="orderForm.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="orderForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      
      <div class="order-items">
        <h4>订单明细</h4>
        <el-table :data="cartItems" style="width: 100%">
          <el-table-column prop="name" label="菜品" />
          <el-table-column prop="price" label="单价">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column label="小计">
            <template #default="scope">
              ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="order-total">
          <span>订单总额：</span>
          <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="checkoutDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitOrder">
            提交订单
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const cartStore = useCartStore()

const checkoutDialogVisible = ref(false)
const orderFormRef = ref(null)

const orderForm = ref({
  phone: '',
  address: '',
  remarks: ''
})

const rules = {
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入配送地址', trigger: 'blur' }
  ]
}

const cartItems = computed(() => cartStore.items)
const totalPrice = computed(() => cartStore.totalPrice)

const handleQuantityChange = (item) => {
  cartStore.updateQuantity(item.id, item.quantity)
}

const handleRemoveFromCart = (item) => {
  ElMessageBox.confirm(
    '确定要从购物车中删除该商品吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    cartStore.removeFromCart(item.id)
    ElMessage.success('已从购物车移除')
  })
}

const handleClearCart = () => {
  ElMessageBox.confirm(
    '确定要清空购物车吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    cartStore.clearCart()
    ElMessage.success('购物车已清空')
  })
}

const handleCheckout = () => {
  if (!localStorage.getItem('token')) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  checkoutDialogVisible.value = true
}

const handleSubmitOrder = async () => {
  if (!orderFormRef.value) return
  
  await orderFormRef.value.validate(async (valid) => {
    if (valid) {
      // TODO: 调用提交订单API
      ElMessage.success('订单提交成功')
      checkoutDialogVisible.value = false
      cartStore.clearCart()
      router.push('/orders')
    }
  })
}
</script>

<style scoped>
.cart-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dish-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dish-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
}

.description {
  color: #666;
  margin: 4px 0 0;
  font-size: 14px;
}

.cart-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}

.total {
  font-size: 16px;
}

.total-price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

.order-items {
  margin-top: 20px;
}

.order-total {
  margin-top: 20px;
  text-align: right;
}
</style> 