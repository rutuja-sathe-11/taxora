import { Transaction } from '../types'
import { transactionAPI } from './api'

class TransactionService {
  async getTransactions(filters?: any): Promise<Transaction[]> {
    try {
      const response = await transactionAPI.list(filters)
      return response.data.results || response.data
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  }

  async createTransaction(data: any): Promise<Transaction> {
    try {
      const response = await transactionAPI.create(data)
      return response.data
    } catch (error) {
      console.error('Error creating transaction:', error)
      throw error
    }
  }

  async updateTransaction(id: string, data: any): Promise<Transaction> {
    try {
      const response = await transactionAPI.update(id, data)
      return response.data
    } catch (error) {
      console.error('Error updating transaction:', error)
      throw error
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await transactionAPI.delete(id)
    } catch (error) {
      console.error('Error deleting transaction:', error)
      throw error
    }
  }

  async getTransactionSummary(filters?: any): Promise<any> {
    try {
      const response = await transactionAPI.summary(filters)
      return response.data
    } catch (error) {
      console.error('Error fetching transaction summary:', error)
      throw error
    }
  }

  async exportTransactions(filters?: any): Promise<Blob> {
    try {
      const response = await transactionAPI.export(filters)
      return response.data
    } catch (error) {
      console.error('Error exporting transactions:', error)
      throw error
    }
  }

  async getCategories(): Promise<any[]> {
    try {
      const response = await transactionAPI.categories()
      return response.data
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }
}

export const transactionService = new TransactionService()