<template>
  <el-dialog
    v-model="visible"
    title="订单支付"
    width="400px"
    :close-on-click-modal="false"
  >
    <div class="payment-content">
      <div class="amount">
        支付金额：<span class="price">¥{{ amount.toFixed(2) }}</span>
      </div>
      
      <div class="payment-methods">
        <div 
          class="method-item"
          :class="{ active: paymentMethod === 'wechat' }"
          @click="paymentMethod = 'wechat'"
        >
          <img src="/wechat-pay.png" alt="微信支付">
          <span>微信支付</span>
        </div>
        
        <div 
          class="method-item"
          :class="{ active: paymentMethod === 'alipay' }"
          @click="paymentMethod = 'alipay'"
        >
          <img src="/alipay.png" alt="支付宝">
          <span>支付宝</span>
        </div>
      </div>

      <div v-if="showQRCode" class="qrcode-container">
        <div class="qrcode">
          <!-- 这里放二维码图片 -->
          <img :src="qrcodeUrl" alt="支付二维码">
        </div>
        <p class="tip">请使用{{ paymentMethod === 'wechat' ? '微信' : '支付宝' }}扫码支付</p>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handlePay" :loading="paying">
          确认支付
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: Boolean,
  amount: Number
})

const emit = defineEmits(['update:visible', 'success', 'cancel'])

const paymentMethod = ref('wechat')
const showQRCode = ref(false)
const paying = ref(false)
const qrcodeUrl = ref('')

const handlePay = async () => {
  paying.value = true
  try {
    // TODO: 调用支付API
    showQRCode.value = true
    qrcodeUrl.value = '模拟的二维码URL'
    
    // 模拟支付成功
    setTimeout(() => {
      emit('success')
      emit('update:visible', false)
    }, 2000)
  } finally {
    paying.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.payment-content {
  padding: 20px 0;
}

.amount {
  text-align: center;
  margin-bottom: 30px;
}

.price {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}

.payment-methods {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.method-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 8px;
}

.method-item img {
  width: 40px;
  height: 40px;
  margin-bottom: 8px;
}

.method-item.active {
  border-color: #409EFF;
  background: #ecf5ff;
}

.qrcode-container {
  text-align: center;
}

.qrcode {
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
  border: 1px solid #ddd;
}

.qrcode img {
  width: 100%;
  height: 100%;
}

.tip {
  color: #666;
}
</style> 