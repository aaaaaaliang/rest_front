<template>
  <div class="home">
    <!-- 轮播图 -->
    <el-carousel height="400px" class="banner">
      <el-carousel-item v-for="item in banners" :key="item.id">
        <img :src="item.image" :alt="item.title" class="banner-image">
      </el-carousel-item>
    </el-carousel>

    <!-- 特色菜品 -->
    <div class="section">
      <h2 class="section-title">特色菜品</h2>
      <el-row :gutter="20">
        <el-col :span="6" v-for="dish in featuredDishes" :key="dish.id">
          <el-card :body-style="{ padding: '0px' }" class="dish-card">
            <img :src="dish.image" class="dish-image">
            <div class="dish-info">
              <h3>{{ dish.name }}</h3>
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
          <img src="https://via.placeholder.com/600x400" alt="餐厅环境" class="about-image">
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'

const router = useRouter()
const cartStore = useCartStore()

// 轮播图数据
const banners = ref([
  {
    id: 1,
    image: 'https://via.placeholder.com/1200x400',
    title: '美食盛宴'
  },
  {
    id: 2,
    image: 'https://via.placeholder.com/1200x400',
    title: '特色菜品'
  },
  {
    id: 3,
    image: 'https://via.placeholder.com/1200x400',
    title: '优惠活动'
  }
])

// 特色菜品数据
const featuredDishes = ref([
  {
    id: 1,
    name: '宫保鸡丁',
    price: 38.00,
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: 2,
    name: '水煮鱼',
    price: 88.00,
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: 3,
    name: '麻婆豆腐',
    price: 28.00,
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: 4,
    name: '糖醋排骨',
    price: 48.00,
    image: 'https://via.placeholder.com/300x200'
  }
])

const handleOrder = (dish) => {
  cartStore.addToCart(dish)
  router.push('/menu')
}
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
</style> 