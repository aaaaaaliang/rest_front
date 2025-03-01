import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'
import { API } from '../config/api'
import { ElMessage } from 'element-plus'
import router from '../router'
import axios from 'axios';
export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const total = ref(0)
  const count = ref(0)  // 添加购物车数量


  // 计算总价
  const totalPrice = computed(() => {
    return items.value.reduce((sum, item) => {
      return sum + item.product_price * item.select_num
    }, 0)
  })

  // 添加 totalCount 计算属性
  const totalCount = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.select_num || 0), 0)
  })

  // 获取购物车列表
  const fetchCartList = async () => {
    try {
      // 添加分页参数
      const params = new URLSearchParams({
        index: 1,  // 默认第一页
        size: 100  // 设置一个较大的数值，确保能获取所有购物车商品
      })

      const res = await request(`${API.CART.LIST}?${params}`)
      if (res.data && res.data.code === 200) {
        items.value = res.data.data || []
        total.value = res.data.total || 0
        count.value = items.value.length  // 更新数量
      }
    } catch (error) {
      console.error('获取购物车失败:', error)
      ElMessage.error('获取购物车失败')
    }
  }

  // 更新购物车数量
  const updateCartCount = async () => {
    try {
      // 同样添加分页参数
      const params = new URLSearchParams({
        index: 1,
        size: 100
      })

      const res = await request(`${API.CART.LIST}?${params}`)
      if (res.data && res.data.code === 200) {
        count.value = (res.data.data || []).length
      }
    } catch (error) {
      console.error('更新购物车数量失败:', error)
    }
  }


  // 添加到购物车
  const addToCart = async (product) => {
    console.log('Product data:', product.code);  // 打印 product 对象，确保它有值

    // 获取购物车中该商品的当前数量
    let existingProductNum = cartItems.value.find(item => item.product_code === product.code)?.select_num || 0;
    // 设置增量为 1（每次添加 1 个商品）
    const increment = 1;

    try {
      // 发送请求给后端，传递增量
      await request(API.CART.ADD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          product_code: product.code,
          product_num: increment  // 传递增量
        })
      });

      // 重新获取购物车列表
      await fetchCartList();
      await router.push("/menu");  // 假设你想跳转到其他页面
    } catch (error) {
      ElMessage.error('添加到购物车失败');
    }
  };



  // 更新商品数量
  const updateQuantity = async (productCode, quantity) => {
    try {
      const res = await request(API.CART.UPDATE, {
        method: 'PUT',
        data: {
          product_code: productCode,  // 商品编号
          product_num: quantity  // 更新的数量
        }
      })
      
      if (res.data && res.data.code === 200) {
        await fetchCartList()  // 重新获取购物车列表
      }
    } catch (error) {
      console.error('更新数量失败:', error)
      ElMessage.error('更新数量失败')
    }
  }

  // 从购物车移除
  const removeFromCart = async (code) => {
    try {
      const res = await request(API.CART.DELETE, {
        method: 'POST',
        data: {
          code: [code]  // 修改这里，传递商品的 code
        }
      })
      
      if (res.data && res.data.code === 200) {
        await fetchCartList()
        ElMessage.success('移除成功')
      }
    } catch (error) {
      console.error('移除失败:', error)
      ElMessage.error('移除失败')
    }
  }

  // 清空购物车
  const clearCart = async () => {
    try {
      const res = await request(API.CART.DELETE, {
        method: 'POST',
        data: {
          code: items.value.map(item => item.code)  // 传递所有商品的 code
        }
      })
      
      if (res.data && res.data.code === 200) {
        items.value = []
        total.value = 0
        count.value = 0
        ElMessage.success('清空购物车成功')
      }
    } catch (error) {
      console.error('清空购物车失败:', error)
      ElMessage.error('清空购物车失败')
    }
  }

  return {
    items,
    total,
    totalPrice,
    count,
    totalCount,  // 导出 totalCount
    fetchCartList,
    updateCartCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  }
}) 