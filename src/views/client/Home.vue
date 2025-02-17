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
              :src="dish.picture?.code"
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
              <p class="price">¥{{ dish.price.toFixed(2) }}</p>
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
import { useCartStore } from '../../stores/cart'
import request from '../../utils/request'
import { API } from '../../config/api'
import { Picture } from '@element-plus/icons-vue'

const router = useRouter()
const cartStore = useCartStore()

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
    bannerList.value = res.data || []
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
      size: 4,  // 显示4个特色菜品
      main: 1   // 获取标记为特色的菜品
    })
    const res = await request(`${API.PRODUCT.LIST}?${params}`)
    featuredDishes.value = res.data || []
  } catch (error) {
    console.error('获取特色菜品失败:', error)
  }
}

const handleOrder = (dish) => {
  cartStore.addToCart(dish)
  router.push('/menu')
}

// 初始化
onMounted(() => {
  fetchBanners()
  fetchFeaturedDishes()
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
  height: 200px;
  object-fit: cover;
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