import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'
import { API } from '../config/api'
import { ElMessage } from 'element-plus'

export const useOrderStore = defineStore('order', () => {
  const orders = ref([])
  const total = ref(0)

  const fetchOrders = async (params) => {
    try {
      const queryString = new URLSearchParams({
        index: params.index || 1,
        size: params.size || 10,
        ...(params.status ? { status: params.status } : {})
      }).toString()

      const res = await request(`${API.ORDER.LIST}?${queryString}`)

      // 转换每个订单的 created 字段为日期
      orders.value = (res.data || []).map(order => {
        return {
          ...order,
          created: new Date(order.created * 1000).toLocaleString() // 转换时间戳
        }
      })

      total.value = res.total || 0
    } catch (error) {
      ElMessage.error('获取订单列表失败')
      throw error
    }
  }


  // 创建订单
  const createOrder = async (orderData) => {
    try {
      await request(API.ORDER.CREATE, {
        method: 'POST',
        body: JSON.stringify(orderData)
      })
      ElMessage.success('订单创建成功')
      return true
    } catch (error) {
      ElMessage.error('创建订单失败')
      return false
    }
  }

  // 更新订单
  const updateOrder = async (orderData) => {
    try {
      await request(API.ORDER.UPDATE, {
        method: 'PUT',
        body: JSON.stringify(orderData)
      })
      ElMessage.success('订单更新成功')
      return true
    } catch (error) {
      ElMessage.error('更新订单失败')
      return false
    }
  }

  // 删除订单
  const deleteOrder = async (code) => {
    try {
      await request(API.ORDER.DELETE, {
        method: 'DELETE',
        body: JSON.stringify({ code })
      })
      ElMessage.success('订单删除成功')
      return true
    } catch (error) {
      ElMessage.error('删除订单失败')
      return false
    }
  }

  // 从购物车创建订单
  const createOrderFromCart = async (cartItems, remark = '') => {
    try {
      const orderData = {
        total_price: cartItems.reduce((sum, item) => sum + item.product_price * item.select_num, 0),
        details: cartItems.map(item => ({
          product_code: item.product_code,
          product_name: item.product_name,
          quantity: item.select_num,
          price: item.product_price
        })),
        remark
      }
      return await createOrder(orderData)
    } catch (error) {
      ElMessage.error('创建订单失败')
      return false
    }
  }


  return {
    orders,
    total,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    createOrderFromCart
  }
}) 