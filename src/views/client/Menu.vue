<template>
  <div class="menu-page">
    <!-- 左侧分类导航 -->
    <div class="category-nav">
      <div
        class="category-item"
        :class="{ active: !currentCategory }"
        @click="handleCategoryClick('')"
      >
        <el-icon><Menu /></el-icon>
        <span>全部菜品</span>
      </div>
      <div
        v-for="category in categoryStore.categories"
        :key="category.code"
        class="category-item"
        :class="{ active: currentCategory === category.code }"
        @click="handleCategoryClick(category.code)"
      >
        <el-icon><ForkSpoon /></el-icon>
        <span>{{ category.CategoryName }}</span>
        <template v-if="category.sub_categories?.length">
          <div
            v-for="sub in category.sub_categories"
            :key="sub.code"
            class="sub-category"
            :class="{ active: currentCategory === sub.code }"
            @click.stop="handleCategoryClick(sub.code)"
          >
            {{ sub.CategoryName }}
          </div>
        </template>
      </div>
    </div>

    <!-- 右侧菜品列表 -->
    <div class="dish-content">
      <div class="dish-list">
        <el-card
          v-for="dish in dishes"
          :key="dish.code"
          class="dish-card"
          shadow="hover"
        >
          <div class="dish-image">
            <el-image
              :src="getImageUrl(dish.picture?.code, IMAGE_SIZE.MEDIUM)"
              :preview-src-list="dish.picture?.code ? [dish.picture.code] : []"
              fit="cover"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
          <div class="dish-info">
            <h3 class="dish-name">{{ dish.products_name }}</h3>
            <p class="dish-desc">{{ dish.describe || '暂无描述' }}</p>
            <div class="dish-footer">
              <span class="price">¥{{ (dish.price ?? 0).toFixed(2) }}</span>
              <div class="actions">
                <el-button
                  type="primary"
                  size="small"
                  :disabled="dish.count <= 0"
                  @click="handleAddToCart(dish)"
                >
                  {{ dish.count > 0 ? '加入购物车' : '已售罄' }}
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.index"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[12, 24, 36]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
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
              :key="item.code"
              class="cart-item"
            >
              <el-image
                :src="getImageUrl(item.picture?.code, IMAGE_SIZE.THUMBNAIL)"
                fit="cover"
                class="item-image"
              >
                <template #error>
                  <el-icon><Picture /></el-icon>
                </template>
              </el-image>
              <div class="item-info">
                <h4>{{ item.product_name }}</h4>
                <div class="item-price">¥{{ (item.product_price ?? 0).toFixed(2) }}</div>
                <div class="item-actions">
                  <el-input-number
                    v-model="item.select_num"
                    :min="1"
                    :max="99"
                    size="small"
                    @change="() => handleQuantityChange(item)"
                  />
                  <el-button
                    type="danger"
                    link
                    @click="handleRemoveFromCart(item)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          <div class="cart-footer">
            <div class="total">
              总计: <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
            </div>
            <el-button type="primary" block @click="handleCheckout">
              去结算 ({{ cartItems.length }}件)
            </el-button>
          </div>
        </template>
        <el-empty v-else description="购物车是空的" />
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
              ¥{{ (scope.row.price ?? 0).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column label="小计">
            <template #default="scope">
              ¥{{ ((scope.row.price ?? 0) * (scope.row.quantity ?? 1)).toFixed(2) }}
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { ElMessage } from 'element-plus'
import { Picture, Menu, ForkSpoon } from '@element-plus/icons-vue'
import { useCategoryStore } from '../../stores/category'
import request from '../../utils/request'
import { API } from '../../config/api'
import { IMAGE_SIZE, getImageUrl } from '../../config/constants'

const router = useRouter()
const cartStore = useCartStore()
const categoryStore = useCategoryStore()

const dishes = ref([])
const total = ref(0)
const currentCategory = ref('')

// 查询参数
const queryParams = reactive({
  index: 1,
  size: 12,
  category_code: ''
})

// 获取菜品列表
const fetchDishes = async () => {
  try {
    const params = new URLSearchParams({
      index: queryParams.index,
      size: queryParams.size
    })
    if (queryParams.category_code) {
      params.append('category_code', queryParams.category_code)
    }

    const res = await request(`${API.PRODUCT.LIST}?${params}`)
    if (res.data && res.data.code === 200) {
      dishes.value = res.data.data || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('获取菜品列表失败')
  }
}

// 处理分类点击
const handleCategoryClick = (code) => {
  currentCategory.value = code
  queryParams.category_code = code
  queryParams.index = 1
  fetchDishes()
}

// 处理加入购物车
const handleAddToCart = async (product) => {
  try {
    const res = await request(API.CART.ADD, {
      method: 'POST',
      data: {
        product_code: product.code,  // 商品编号
        product_num: 1  // 商品数量
      }
    })

    if (res.data && res.data.code === 200) {
      ElMessage.success('已添加到购物车')
      cartStore.updateCartCount()
    }
  } catch (error) {
    if (error.response?.status === 401) {
      ElMessage.warning('请先登录')
      router.push('/login')
    } else {
      ElMessage.error(error.message || '添加失败')
    }
  }
}

// 处理分页
const handleSizeChange = (val) => {
  queryParams.size = val
  fetchDishes()
}

const handleCurrentChange = (val) => {
  queryParams.index = val
  fetchDishes()
}

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

const cartItems = computed(() => cartStore.items)
const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    return sum + (item.product_price ?? 0) * (item.select_num ?? 1)
  }, 0)
})

const handleQuantityChange = async (item) => {
  await cartStore.updateQuantity(item.product_code, item.select_num)
}

const handleRemoveFromCart = async (item) => {
  await cartStore.removeFromCart(item.code)
}

const handleCheckout = () => {
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

// 初始化
onMounted(async () => {
  try {
    await categoryStore.fetchCategories()
    await fetchDishes()
    await cartStore.fetchCartList()
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('加载数据失败')
  }
})
</script>

<style scoped lang="scss">
.menu-page {
  display: flex;
  min-height: calc(100vh - 60px);
  background: #f5f5f5;
  padding: 20px;
  gap: 20px;
}

.category-nav {
  width: 220px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 0;
  height: fit-content;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 20px;

  .category-item {
    padding: 16px 24px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;

    .el-icon {
      font-size: 18px;
      color: var(--el-text-color-secondary);
      transition: all 0.3s;
    }

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);

      .el-icon {
        color: var(--el-color-primary);
      }
    }

    &.active {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      font-weight: 500;

      .el-icon {
        color: var(--el-color-primary);
      }

      &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 24px;
        background: var(--el-color-primary);
        border-radius: 0 4px 4px 0;
      }
    }

    .sub-category {
      padding: 12px 0 12px 30px;
      margin-top: 4px;
      font-size: 14px;
      color: var(--el-text-color-regular);
      display: flex;
      align-items: center;

      &::before {
        content: '';
        width: 4px;
        height: 4px;
        background: currentColor;
        border-radius: 50%;
        margin-right: 8px;
        opacity: 0.5;
      }

      &:hover {
        color: var(--el-color-primary);
      }

      &.active {
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }
  }
}

.dish-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 20px;

  .dish-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }
}

.dish-card {
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;

  .dish-image {
    height: 160px;
    overflow: hidden;

    .el-image {
      width: 100%;
      height: 100%;
    }
  }

  .dish-info {
    padding: 12px;

    .dish-name {
      margin: 0;
      font-size: 15px;
      font-weight: 500;
    }

    .dish-desc {
      margin: 8px 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);
      line-height: 1.4;
      height: 36px;
    }

    .dish-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;

      .price {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-color-danger);
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.cart-content {
  height: 100%;
  display: flex;
  flex-direction: column;

  .cart-items {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px;
  }

  .cart-item {
    display: flex;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .item-image {
      width: 80px;
      height: 80px;
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .item-info {
      flex: 1;
      min-width: 0;

      h4 {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 500;
      }

      .item-price {
        color: var(--el-color-danger);
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .item-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .el-input-number {
          width: 100px;
        }
      }
    }
  }

  .cart-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: #fff;

    .total {
      margin-bottom: 12px;
      text-align: right;

      .total-price {
        font-size: 18px;
        font-weight: 600;
        color: var(--el-color-danger);
      }
    }
  }
}

</style>