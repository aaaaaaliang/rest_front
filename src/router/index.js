import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'roles',
        name: 'RoleManagement',
        component: () => import('../views/admin/RoleManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('../views/admin/UserManagement.vue'),
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
      {
        path: 'images',
        name: 'ImageManagement',
        component: () => import('../views/admin/ImageManagement.vue'),
        meta: { requiresAuth: true }
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
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 修改路由守卫
router.beforeEach((to, from, next) => {
  // 暂时移除登录检查
  next()
})

export default router 