import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { nextTick } from 'vue'

const routes = [
  {
    path: '/login/github/callback',
    name: 'GithubCallback',
    component: () => import('../views/Login.vue'),
    meta: {
      title: 'GitHub 登录'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  // {
  //   path: '/register',
  //   name: 'Register',
  //   component: () => import('../views/Register.vue')
  // },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { 
          requiresAuth: true,
          permission: { method: 'GET', path: '/api/dashboard' }
        }
      },
      {
        path: 'user',
        component: () => import('../views/admin/UserManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'role',
        component: () => import('../views/admin/RoleManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'dishes',
        name: 'DishManagement',
        component: () => import('../views/admin/DishManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'OrderManagement',
        component: () => import('../views/admin/OrderManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'salary',
        name: 'SalaryManagement',
        component: () => import('../views/admin/SalaryManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'customer-service',
        name: 'CustomerServiceManagement',
        component: () => import('../views/admin/CustomerServiceManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'system',
        name: 'SystemConfig',
        component: () => import('../views/admin/SystemConfig.vue'),
        meta: { requiresAuth: true }
      },
      // {
      //   path: 'images',
      //   name: 'ImageManagement',
      //   component: () => import('../views/admin/ImageManagement.vue'),
      //   meta: { requiresAuth: true }
      // },
      {
        path: 'categories',
        name: 'CategoryManagement',
        component: () => import('../views/admin/CategoryManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'banners',
        name: 'BannerManagement',
        component: () => import('../views/admin/BannerManagement.vue'),
        meta: { 
          requiresAuth: true,
          requiresAdmin: true,
          title: '轮播图管理'
        }
      }
    ]
  },
  {
    path: '/',
    component: () => import('../layouts/ClientLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/client/Home.vue')
      },
      {
        path: 'menu',
        name: 'Menu',
        component: () => import('../views/client/Menu.vue')
      },
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('../views/client/Cart.vue')
      },
      {
        path: 'orders',
        name: 'MyOrders',
        component: () => import('../views/client/MyOrders.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/client/Profile.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'checkout',
        name: 'Checkout',
        component: () => import('../views/client/Checkout.vue'),
        meta: {
          requiresAuth: true,
          layout: 'client'
        }
      }
    ]
  },
  // 用户端订单页面
  {
    path: '/my-orders',
    component: () => import('../views/client/MyOrders.vue'),
    meta: {
      requiresAuth: true,
      title: '我的订单'
    }
  },
  // 管理端订单页面
  {
    path: '/admin/orders',
    component: () => import('../views/admin/OrderManagement.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: '订单管理'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 修改路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 如果是登录页面，直接通过
  if (to.path === '/login' || to.path === '/login/github/callback') {
    next()
    return
  }

  // 如果没有用户信息，尝试获取
  if (!userStore.user) {
    try {
      await userStore.fetchUserRole()
    } catch (error) {
      // 如果获取失败且页面需要认证，跳转到登录页
      if (to.meta.requiresAuth) {
        next('/login')
        return
      }
    }
  }

  // 如果访问管理页面，检查角色
  if (to.path.startsWith('/admin')) {
    if (!userStore.roles || userStore.roles.length === 0) {
      next('/')
      return
    }
  }

  next()
})

export default router 