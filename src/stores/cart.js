import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  
  getters: {
    totalCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },
  
  actions: {
    addToCart(dish) {
      const existingItem = this.items.find(item => item.id === dish.id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        this.items.push({
          ...dish,
          quantity: 1
        })
      }
    },
    
    removeFromCart(dishId) {
      const index = this.items.findIndex(item => item.id === dishId)
      if (index > -1) {
        this.items.splice(index, 1)
      }
    },
    
    updateQuantity(dishId, quantity) {
      const item = this.items.find(item => item.id === dishId)
      if (item) {
        item.quantity = quantity
      }
    },
    
    clearCart() {
      this.items = []
    }
  }
}) 