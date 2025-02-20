import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'
import { API } from '../config/api'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([])
  const loading = ref(false)

  // 获取分类列表
  const fetchCategories = async () => {
    loading.value = true
    try {
      const res = await request(API.CATEGORY.LIST)
      if (res.data && res.data.code === 200) {
        categories.value = res.data.data || []
      }
    } catch (error) {
      console.error('获取分类列表失败:', error)
      categories.value = []
    } finally {
      loading.value = false
    }
  }

  // 创建分类
  const createCategory = async (data) => {
    try {
      const res = await request(API.CATEGORY.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(data)  // 手动序列化数据
      })
      
      if (res.data && res.data.code === 200) {
        await fetchCategories()  // 刷新列表
        return res.data
      } else {
        throw new Error(res.data?.message || '创建失败')
      }
    } catch (error) {
      console.error('创建分类失败:', error)
      throw error
    }
  }

  // 更新分类
  const updateCategory = async (data) => {
    try {
      const res = await request(API.CATEGORY.UPDATE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(data)  // 手动序列化数据
      })
      
      if (res.data && res.data.code === 200) {
        await fetchCategories()  // 刷新列表
        return res.data
      } else {
        throw new Error(res.data?.message || '更新失败')
      }
    } catch (error) {
      console.error('更新分类失败:', error)
      throw error
    }
  }

  // 删除分类
  const deleteCategory = async (code) => {
    try {
      const res = await request(`${API.CATEGORY.DELETE}?code=${code}`, {
        method: 'DELETE'
      })
      
      if (res.data && res.data.code === 200) {
        await fetchCategories()  // 刷新列表
        return res.data
      } else {
        throw new Error(res.data?.message || '删除失败')
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
}) 