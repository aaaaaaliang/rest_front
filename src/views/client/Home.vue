<template>
  <div class="home">
    <!-- 轮播图 -->
    <el-carousel height="400px" class="banner">
      <el-carousel-item v-for="item in bannerList" :key="item.code">
        <img :src="item.image" :alt="item.title" class="banner-image">
      </el-carousel-item>
    </el-carousel>

    <!-- 特色菜品 -->
    <div class="section">
      <h2 class="section-title">特色菜品</h2>
      <el-row :gutter="20">
        <el-col :span="6" v-for="dish in featuredDishes" :key="dish.code">
          <el-card :body-style="{ padding: '0px' }" class="dish-card">
            <el-image
                :src="dish.picture?.code || ''"
                class="dish-image"
                fit="cover"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="dish-info">
              <h3>{{ dish.products_name }}</h3>
              <p class="price">¥{{ (dish.price ?? 0).toFixed(2) }}</p>
              <el-button type="primary" @click="handleOrder(dish)">
                立即点餐
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 餐厅介绍 -->
    <div class="section">
      <h2 class="section-title">关于我们</h2>
      <el-row :gutter="40">
        <el-col :span="12">
          <img src="../../assets/env.webp" alt="餐厅环境" class="about-image">
        </el-col>
        <el-col :span="12">
          <div class="about-content">
            <h3>优质美食，温馨服务</h3>
            <p>我们致力于为顾客提供最优质的美食和最温馨的用餐环境。餐厅汇集了众多名厨，精心研制各类特色菜品，让您享受舌尖上的美味。</p>
            <ul class="feature-list">
              <li>
                <el-icon><Timer /></el-icon>
                <span>营业时间：周一至周日 10:00-22:00</span>
              </li>
              <li>
                <el-icon><Location /></el-icon>
                <span>地址：北京市朝阳区xxx街道xxx号</span>
              </li>
              <li>
                <el-icon><Phone /></el-icon>
                <span>电话：010-12345678</span>
              </li>
            </ul>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { API } from '../../config/api'
import { Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 轮播图数据
const bannerList = ref([])

// 获取轮播图列表
const fetchBanners = async () => {
  try {
    const params = new URLSearchParams({
      index: 1,
      size: 10,
    })
    const res = await request(`${API.BANNER.LIST}?${params}`)
    if (res.data && res.data.code === 200) {
      bannerList.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取轮播图失败:', error)
  }
}

// 特色菜品数据
const featuredDishes = ref([])

// 获取特色菜品列表
const fetchFeaturedDishes = async () => {
  try {
    const params = new URLSearchParams({
      index: 1,
      size: 4,
      main: 1
    })
    const res = await request(`${API.PRODUCT.LIST}?${params}`)
    if (res.data && res.data.code === 200) {
      featuredDishes.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取特色菜品失败:', error)
  }
}

// 购物车数量
const cartCount = ref(0)

// **获取购物车数量**
const fetchCartCount = async () => {
  try {
    const res = await request(API.CART.COUNT, { method: 'GET' })
    if (res.data && res.data.code === 200) {
      cartCount.value = res.data.data.count || 0
    }
  } catch (error) {
    console.error('获取购物车数量失败:', error)
  }
}

// **处理加入购物车**
const handleOrder = async (dish) => {
  try {
    const res = await request(API.CART.ADD, {
      method: 'POST',
      data: {
        product_code: dish.code,  // 商品编号
        product_num: 1  // 商品数量
      }
    })

    if (res.data && res.data.code === 200) {
      ElMessage.success('已添加到购物车')
      fetchCartCount() // ✅ 更新购物车数量
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

// **初始化数据**
onMounted(() => {
  fetchBanners()
  fetchFeaturedDishes()
  fetchCartCount() // ✅ 获取购物车数量
})
</script>

<style scoped>
.home {
  padding: 20px;
}

.banner {
  margin-bottom: 40px;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section {
  margin-bottom: 40px;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  color: #333;
}

.dish-card {
  margin-bottom: 20px;
  transition: transform 0.3s;
}

.dish-card:hover {
  transform: translateY(-5px);
}

.dish-image {
  width: 100%;
  height: 180px; /* ✅ 调整图片大小 */
  object-fit: cover;
  border-radius: 8px;
}

.dish-info {
  padding: 14px;
  text-align: center;
}

.dish-info h3 {
  margin: 0;
  font-size: 18px;
}

.price {
  color: #f56c6c;
  font-size: 20px;
  margin: 10px 0;
}

.about-image {
  width: 100%;
  border-radius: 8px;
}

.about-content {
  padding: 20px;
}

.about-content h3 {
  font-size: 24px;
  margin-bottom: 20px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin-top: 20px;
}

.feature-list li {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.feature-list .el-icon {
  margin-right: 10px;
  font-size: 20px;
  color: #409EFF;
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
