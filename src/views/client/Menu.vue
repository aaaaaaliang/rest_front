<template>
  <div class="menu">
    <!-- 左侧分类导航 -->
    <div class="category-nav">
      <el-menu
        :default-active="activeCategory"
        @select="handleCategorySelect"
      >
        <el-menu-item 
          v-for="category in categories" 
          :key="category.id"
          :index="category.id.toString()"
        >
          {{ category.name }}
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧菜品列表 -->
    <div class="dish-list">
      <el-row :gutter="20">
        <el-col 
          :span="8" 
          v-for="dish in currentCategoryDishes" 
          :key="dish.id"
        >
          <el-card :body-style="{ padding: '0px' }" class="dish-card">
            <img :src="dish.image" class="dish-image">
            <div class="dish-info">
              <h3>{{ dish.name }}</h3>
              <p class="description">{{ dish.description }}</p>
              <div class="price-action">
                <span class="price">¥{{ dish.price.toFixed(2) }}</span>
                <el-button 
                  type="primary" 
                  circle
                  @click="handleAddToCart(dish)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 购物车抽屉 -->
    <el-drawer
      v-model="cartDrawerVisible"
      title="购物车"
      direction="rtl"
      size="400px"
    >
      <div class="cart-content">
        <template v-if="cartItems.length > 0">
          <div class="cart-items">
            <div 
              v-for="item in cartItems" 
              :key="item.id"
              class="cart-item"
            >
              <img :src="item.image" class="item-image">
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <p class="item-price">¥{{ item.price.toFixed(2) }}</p>
              </div>
              <div class="item-actions">
                <el-input-number 
                  v-model="item.quantity" 
                  :min="1"
                  :max="99"
                  size="small"
                  @change="handleQuantityChange(item)"
                />
                <el-button 
                  type="danger" 
                  circle 
                  size="small"
                  @click="handleRemoveFromCart(item)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="cart-footer">
            <div class="total">
              <span>总计：</span>
              <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
            </div>
            <el-button 
              type="primary" 
              :disabled="cartItems.length === 0"
              @click="handleCheckout"
            >
              去结算
            </el-button>
          </div>
        </template>
        
        <el-empty 
          v-else 
          description="购物车是空的"
        />
      </div>
    </el-drawer>

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
import { ElMessage } from 'element-plus'

const router = useRouter()
const cartStore = useCartStore()

// 分类数据
const categories = ref([
  { id: 1, name: '热菜' },
  { id: 2, name: '凉菜' },
  { id: 3, name: '主食' },
  { id: 4, name: '饮品' }
])

// 菜品数据
const dishes = ref([
  {
    id: 1,
    categoryId: 1,
    name: '宫保鸡丁',
    price: 38.00,
    image: 'https://via.placeholder.com/300x200',
    description: '经典川菜，口感麻辣鲜香'
  },
  {
    id: 2,
    categoryId: 1,
    name: '水煮鱼',
    price: 88.00,
    image: 'https://via.placeholder.com/300x200',
    description: '新鲜草鱼，麻辣鲜香'
  },
  // 更多菜品数据...
])

const activeCategory = ref('1')
const cartDrawerVisible = ref(false)
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

// 计算属性
const currentCategoryDishes = computed(() => {
  return dishes.value.filter(dish => 
    dish.categoryId === parseInt(activeCategory.value)
  )
})

const cartItems = computed(() => cartStore.items)
const totalPrice = computed(() => cartStore.totalPrice)

// 方法
const handleCategorySelect = (index) => {
  activeCategory.value = index
}

const handleAddToCart = (dish) => {
  cartStore.addToCart(dish)
  ElMessage.success('已添加到购物车')
}

const handleQuantityChange = (item) => {
  cartStore.updateQuantity(item.id, item.quantity)
}

const handleRemoveFromCart = (item) => {
  cartStore.removeFromCart(item.id)
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
.menu {
  display: flex;
  height: calc(100vh - 60px);
}

.category-nav {
  width: 200px;
  border-right: 1px solid #eee;
}

.dish-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.dish-card {
  margin-bottom: 20px;
}

.dish-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.dish-info {
  padding: 14px;
}

.dish-info h3 {
  margin: 0;
  font-size: 18px;
}

.description {
  color: #666;
  margin: 10px 0;
  height: 40px;
  overflow: hidden;
}

.price-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  color: #f56c6c;
  font-size: 20px;
}

.cart-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  margin-right: 10px;
}

.item-info {
  flex: 1;
}

.item-info h4 {
  margin: 0;
}

.item-price {
  color: #f56c6c;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cart-footer {
  padding: 20px;
  border-top: 1px solid #eee;
}

.total {
  margin-bottom: 10px;
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