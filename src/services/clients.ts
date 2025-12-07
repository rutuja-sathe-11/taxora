import { clientAPI } from './api'

export interface Client {
  id: string
  name: string
  email: string
  businessName: string
  gstNumber?: string
  phone?: string
  status: 'active' | 'inactive'
  lastActivity: string
  complianceScore: number
  totalTransactions: number
  pendingReviews: number
  monthlyRevenue: number
  joinedDate: string
  // Additional fields for reports
  address?: string
  city?: string
  state?: string
  pincode?: string
  panNumber?: string
  businessType?: string
  industry?: string
  annualTurnover?: number
  employeeCount?: number
  registrationDate?: string
  gstRegistrationDate?: string
  lastGstFiling?: string
  lastItrFiling?: string
  complianceStatus?: 'compliant' | 'non-compliant' | 'pending'
  riskLevel?: 'low' | 'medium' | 'high'
}

class ClientService {
  async getClients(filters?: any): Promise<Client[]> {
    try {
      const response = await clientAPI.list(filters)
      return response.data.results || response.data
    } catch (error) {
      console.error('Error fetching clients:', error)
      // Return mock data for now
      return this.getMockClients()
    }
  }

  async createClient(data: any): Promise<Client> {
    try {
      const response = await clientAPI.create(data)
      return response.data
    } catch (error) {
      console.error('Error creating client:', error)
      // Create a mock client with the provided data
      const newClient: Client = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        businessName: data.businessName,
        gstNumber: data.gstNumber || '',
        phone: data.phone || '',
        status: data.status || 'active',
        lastActivity: new Date().toISOString().split('T')[0],
        complianceScore: 0,
        totalTransactions: 0,
        pendingReviews: 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        joinedDate: new Date().toISOString().split('T')[0],
        // Additional fields
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        panNumber: data.panNumber || '',
        businessType: data.businessType || '',
        industry: data.industry || '',
        annualTurnover: data.annualTurnover || 0,
        employeeCount: data.employeeCount || 0,
        registrationDate: data.registrationDate || '',
        gstRegistrationDate: data.gstRegistrationDate || '',
        lastGstFiling: data.lastGstFiling || '',
        lastItrFiling: data.lastItrFiling || '',
        complianceStatus: data.complianceStatus || 'pending',
        riskLevel: data.riskLevel || 'low'
      }
      return newClient
    }
  }

  async updateClient(id: string, data: any): Promise<Client> {
    try {
      const response = await clientAPI.update(id, data)
      return response.data
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      await clientAPI.delete(id)
    } catch (error) {
      console.error('Error deleting client:', error)
      throw error
    }
  }

  async getClientDetails(id: string): Promise<Client> {
    try {
      const response = await clientAPI.details(id)
      return response.data
    } catch (error) {
      console.error('Error fetching client details:', error)
      throw error
    }
  }

  private getMockClients(): Client[] {
    return [
      {
        id: '1',
        name: 'Rajesh Kumar',
        email: 'rajesh@abccorp.com',
        businessName: 'ABC Corp',
        gstNumber: '27AABCU9603R1ZX',
        phone: '+91 98765 43210',
        status: 'active',
        lastActivity: '2024-01-15',
        complianceScore: 95,
        totalTransactions: 156,
        pendingReviews: 3,
        monthlyRevenue: 45000,
        joinedDate: '2023-06-15'
      },
      {
        id: '2',
        name: 'Priya Sharma',
        email: 'priya@xyzltd.com',
        businessName: 'XYZ Ltd',
        gstNumber: '29AABCU9603R1ZY',
        phone: '+91 87654 32109',
        status: 'active',
        lastActivity: '2024-01-14',
        complianceScore: 88,
        totalTransactions: 89,
        pendingReviews: 1,
        monthlyRevenue: 32000,
        joinedDate: '2023-08-20'
      },
      {
        id: '3',
        name: 'Amit Patel',
        email: 'amit@techsolutions.com',
        businessName: 'Tech Solutions',
        gstNumber: '24AABCU9603R1ZZ',
        phone: '+91 76543 21098',
        status: 'active',
        lastActivity: '2024-01-12',
        complianceScore: 76,
        totalTransactions: 234,
        pendingReviews: 8,
        monthlyRevenue: 67000,
        joinedDate: '2023-04-10'
      }
    ]
  }
}

export const clientService = new ClientService()
