import { User } from '../types'
import { authAPI } from './api'

function getErrorMessage(error: any): string {
  if (error.response?.data) {
    const data = error.response.data

    if (data.detail) {
      return data.detail
    }

    if (typeof data === 'object') {
      const errorMessages: string[] = []

      for (const [field, messages] of Object.entries(data)) {
        if (Array.isArray(messages)) {
          errorMessages.push(`${field}: ${messages.join(', ')}`)
        } else if (typeof messages === 'string') {
          errorMessages.push(`${field}: ${messages}`)
        }
      }

      if (errorMessages.length > 0) {
        return errorMessages.join('; ')
      }
    }

    if (typeof data === 'string') {
      return data
    }
  }

  return error.message || 'An error occurred'
}

class AuthService {
  private currentUser: User | null = null

  async login(username: string, password: string): Promise<User> {
    try {
      const response = await authAPI.login({ username, password })
      const { user, tokens } = response.data

      localStorage.setItem('accessToken', tokens.access)
      localStorage.setItem('refreshToken', tokens.refresh)
      localStorage.setItem('user', JSON.stringify(user))

      this.currentUser = user
      return user
    } catch (error: any) {
      throw new Error(getErrorMessage(error) || 'Login failed')
    }
  }

  async register(userData: any): Promise<User> {
    try {
      const response = await authAPI.register(userData)
      const { user, tokens } = response.data

      localStorage.setItem('accessToken', tokens.access)
      localStorage.setItem('refreshToken', tokens.refresh)
      localStorage.setItem('user', JSON.stringify(user))

      this.currentUser = user
      return user
    } catch (error: any) {
      throw new Error(getErrorMessage(error) || 'Registration failed')
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  getCurrentUser(): User | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('user')
      if (stored) {
        this.currentUser = JSON.parse(stored)
      }
    }
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && localStorage.getItem('accessToken') !== null
  }

  async updateProfile(data: any): Promise<User> {
    try {
      const response = await authAPI.updateProfile(data)
      const user = response.data

      localStorage.setItem('user', JSON.stringify(user))
      this.currentUser = user
      return user
    } catch (error: any) {
      throw new Error(getErrorMessage(error) || 'Profile update failed')
    }
  }
}

export const authService = new AuthService()
