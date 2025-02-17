import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'
import { API } from '../config/api'
import { ElMessage } from 'element-plus'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const total = ref(0)

  // 计算总价
  const totalPrice = computed(() => {
    return items.value.reduce((sum, item) => {
      return sum + item.product_price * item.select_num
    }, 0)
  })

  // 获取购物车列表
  const fetchCartList = async () => {
    try {
      const params = new URLSearchParams({
        index: 1,
        size: 100
      })
      const res = await request(`${API.CART.LIST}?${params}`)
      items.value = res.data || []
      total.value = res.total || 0
    } catch (error) {
      ElMessage.error('获取购物车失败')
    }
  }

  // 添加到购物车
  const addToCart = async (product) => {
    try {
      await request(API.CART.ADD, {
        method: 'POST',
        body: JSON.stringify({
          product_code: product.code,
          product_num: 1
        })
      })
      await fetchCartList()
    } catch (error) {
      ElMessage.error('添加到购物车失败')
    }
  }

  // 更新商品数量
  const updateQuantity = async (code, num) => {
    try {
      await request(API.CART.ADD, {
        method: 'POST',
        body: JSON.stringify({
          product_code: code,
          product_num: num  // 直接传递输入框的值
        })
      })
      await fetchCartList()
    } catch (error) {
      ElMessage.error('更新数量失败')
    }
  }

  // 从购物车移除（支持单个或批量删除）
  const removeFromCart = async (codes) => {
    try {
      await request(API.CART.DELETE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: Array.isArray(codes) ? codes : [codes]
        })
      })
      await fetchCartList()
    } catch (error) {
      console.error('Delete error:', error)
      ElMessage.error('移除商品失败')
    }
  }

  // 清空购物车
  const clearCart = async () => {
    try {
      const codes = items.value.map(item => item.code)
      if (codes.length > 0) {
        await request(API.CART.DELETE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: codes
          })
        })
        ElMessage.success('购物车已清空')
        await fetchCartList()
      }
    } catch (error) {
      console.error('Clear cart error:', error)
      ElMessage.error('清空购物车失败')
    }
  }

  return {
    items,
    total,
    totalPrice,
    fetchCartList,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  }
}) 