import { defineStore } from 'pinia'
import request from '../utils/request'
import { API } from '../config/api'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    loading: false
  }),

  actions: {
    // 获取分类列表
    async fetchCategories() {
      this.loading = true
      try {
        const res = await request(API.CATEGORY.LIST)
        this.categories = res.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    // 创建分类
    async createCategory(data) {
      try {
        await request(API.CATEGORY.CREATE, {
          method: 'POST',
          body: JSON.stringify(data)
        })
        await this.fetchCategories()
      } catch (error) {
        throw error
      }
    },

    // 更新分类
    async updateCategory(data) {
      try {
        await request(API.CATEGORY.UPDATE, {
          method: 'PUT',
          body: JSON.stringify(data)
        })
        await this.fetchCategories()
      } catch (error) {
        throw error
      }
    },

    // 删除分类
    async deleteCategory(code) {
      try {
        await request(`${API.CATEGORY.DELETE}?code=${code}`, {
          method: 'DELETE'
        })
        await this.fetchCategories()
      } catch (error) {
        throw error
      }
    }
  }
}) 