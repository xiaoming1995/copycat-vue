import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, getProfile, type User, type LoginRequest, type RegisterRequest } from '../services/auth'
import { getToken, setToken, clearToken } from '../services/api'

export interface UserPreferences {
  emailNotifications: boolean
  marketingEmails: boolean
  darkMode: boolean
}

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const user = ref<User | null>(null)

  // 用户偏好设置
  const preferences = ref<UserPreferences>({
    emailNotifications: true,
    marketingEmails: false,
    darkMode: false
  })

  // 会员信息
  const membership = ref({
    plan: 'Free', // Free, Pro, Enterprise
    validUntil: ''
  })

  // 计算属性：是否已登录（只判断 token 存在）
  const isLoggedIn = computed(() => {
    return !!getToken()
  })

  // 计算属性：用户显示信息（兼容旧代码）
  const userInfo = computed(() => ({
    name: user.value?.nickname || 'CopyCat 用户',
    email: user.value?.email || '',
    bio: '专注于爆款文案拆解与创作',
    title: '文案创作者'
  }))

  /**
   * 用户登录
   */
  async function login(data: LoginRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiLogin(data)

      if (response.code === 0 && response.data) {
        setToken(response.data.token)
        user.value = response.data.user
        return { success: true, message: '登录成功' }
      }

      return { success: false, message: response.msg || '登录失败' }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  /**
   * 用户注册
   */
  async function register(data: RegisterRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRegister(data)

      if (response.code === 0) {
        return { success: true, message: '注册成功' }
      }

      return { success: false, message: response.msg || '注册失败' }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  /**
   * 用户登出
   */
  function logout() {
    clearToken()
    user.value = null
  }

  /**
   * 获取用户信息
   */
  async function fetchProfile(): Promise<boolean> {
    try {
      const token = getToken()
      if (!token) return false

      const response = await getProfile()

      if (response.code === 0 && response.data) {
        user.value = response.data
        return true
      }

      // Token 无效，清除
      clearToken()
      return false
    } catch (error) {
      console.error('获取用户信息失败:', error)
      clearToken()
      return false
    }
  }

  /**
   * 初始化：检查本地 Token 并恢复登录状态
   */
  async function initialize(): Promise<void> {
    const token = getToken()
    if (token) {
      await fetchProfile()
    }
  }

  /**
   * 更新用户偏好设置
   */
  function updatePreferences(updates: Partial<UserPreferences>) {
    preferences.value = { ...preferences.value, ...updates }
  }

  /**
   * 更新用户资料
   */
  async function updateProfile(data: { nickname?: string; avatar?: string; bio?: string }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('http://localhost:8088/api/v1/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(data)
      })
      const result = await response.json()

      if (result.code === 0) {
        // 更新本地用户数据
        if (user.value) {
          if (data.nickname) user.value.nickname = data.nickname
        }
        return { success: true, message: '资料更新成功' }
      }
      return { success: false, message: result.msg || '更新失败' }
    } catch (error) {
      console.error('更新资料失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  /**
   * 修改密码
   */
  async function changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('http://localhost:8088/api/v1/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      })
      const result = await response.json()

      if (result.code === 0) {
        return { success: true, message: '密码修改成功' }
      }
      return { success: false, message: result.msg || '修改失败' }
    } catch (error) {
      console.error('修改密码失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  return {
    user,
    userInfo,
    preferences,
    membership,
    isLoggedIn,
    login,
    register,
    logout,
    fetchProfile,
    initialize,
    updatePreferences,
    updateProfile,
    changePassword
  }
})
