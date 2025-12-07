import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Users, FileText, AlertTriangle, Calendar, TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '../lib/utils'
import { transactionService } from '../services/transactions'
import { complianceService } from '../services/compliance'

export const CADashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>({})
  const [clientData, setClientData] = useState<any[]>([])
  const [complianceData, setComplianceData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load compliance dashboard data
      const compliance = await complianceService.getComplianceDashboard()
      setDashboardData(compliance)

      // Mock client growth data - in real app this would come from backend
      setClientData([
        { month: 'Jan', clients: 45, revenue: 180000 },
        { month: 'Feb', clients: 52, revenue: 208000 },
        { month: 'Mar', clients: 48, revenue: 192000 },
        { month: 'Apr', clients: 61, revenue: 244000 },
        { month: 'May', clients: 55, revenue: 220000 },
        { month: 'Jun', clients: 67, revenue: 268000 }
      ])

      // Mock compliance data
      setComplianceData([
        { type: 'GST Returns', completed: 45, pending: 12, overdue: 3 },
        { type: 'ITR Filing', completed: 28, pending: 15, overdue: 2 },
        { type: 'TDS Returns', completed: 35, pending: 8, overdue: 1 },
        { type: 'Audit Reports', completed: 12, pending: 5, overdue: 1 }
      ])

      // Mock revenue breakdown
      setRevenueData([
        { name: 'GST Services', value: 120000, color: '#3B82F6' },
        { name: 'ITR Filing', value: 80000, color: '#059669' },
        { name: 'Audit Services', value: 45000, color: '#D97706' },
        { name: 'Consulting', value: 23000, color: '#DC2626' }
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewClients = () => {
    // This will be handled by the parent App component
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'clients' }))
  }

  const handleReviewQueue = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'review-queue' }))
  }

  const handleGenerateReport = async () => {
    try {
      const blob = await transactionService.exportTransactions()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ca-client-report.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report. Please try again.')
    }
  }

  const handleComplianceCalendar = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'compliance-calendar' }))
  }

  const totalClients = 67
  const pendingReviews = dashboardData.summary?.total_pending || 24
  const complianceDue = dashboardData.overdue_count || 8
  const monthlyRevenue = 268000

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">CA Dashboard</h1>
          <p className="text-gray-400">Manage clients and track compliance status</p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={handleGenerateReport}>
            <Calendar className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleViewClients}>
            <Users className="w-4 h-4 mr-2" />
            Manage Clients
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-blue-400">Total Clients</CardTitle>
            <Users className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalClients}</div>
            <p className="text-xs text-blue-400 mt-1">+15 new this month</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-yellow-400">Pending Reviews</CardTitle>
            <Clock className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingReviews}</div>
            <p className="text-xs text-yellow-400 mt-1">5 urgent reviews</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-red-400">Compliance Due</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{complianceDue}</div>
            <p className="text-xs text-red-400 mt-1">3 overdue items</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-green-400">Monthly Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(monthlyRevenue)}</div>
            <p className="text-xs text-green-400 mt-1">+22% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Client Growth & Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={clientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis yAxisId="clients" orientation="left" stroke="#3B82F6" />
                <YAxis yAxisId="revenue" orientation="right" stroke="#059669" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Clients'
                  ]}
                />
                <Line yAxisId="clients" type="monotone" dataKey="clients" stroke="#3B82F6" strokeWidth={2} />
                <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Client Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complianceData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="type" type="category" stroke="#9CA3AF" width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Bar dataKey="completed" stackId="a" fill="#059669" />
              <Bar dataKey="pending" stackId="a" fill="#D97706" />
              <Bar dataKey="overdue" stackId="a" fill="#DC2626" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Recent Client Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { client: 'ABC Corp', action: 'Uploaded GST documents', time: '2 hours ago', status: 'pending' },
                { client: 'XYZ Ltd', action: 'ITR filing completed', time: '5 hours ago', status: 'completed' },
                { client: 'Tech Solutions', action: 'TDS return submitted', time: '1 day ago', status: 'completed' },
                { client: 'Retail Store', action: 'Audit documents pending', time: '2 days ago', status: 'overdue' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.client}</p>
                    <p className="text-sm text-gray-400">{activity.action}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Priority Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'GST Return Due Tomorrow', client: 'ABC Corp', priority: 'high', type: 'deadline' },
                { title: 'Audit Documents Missing', client: 'XYZ Ltd', priority: 'high', type: 'missing' },
                { title: 'ITR Filing Due Next Week', client: 'Tech Solutions', priority: 'medium', type: 'deadline' },
                { title: 'Client Query Pending Response', client: 'Retail Store', priority: 'low', type: 'query' }
              ].map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  alert.priority === 'high' ? 'border-red-500 bg-red-500/10' :
                  alert.priority === 'medium' ? 'border-yellow-500 bg-yellow-500/10' :
                  'border-blue-500 bg-blue-500/10'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">{alert.title}</h4>
                      <p className="text-sm text-gray-400">{alert.client}</p>
                    </div>
                    <Button size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={handleGenerateReport}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <FileText className="w-6 h-6" />
              <span className="text-sm">Generate Report</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={handleViewClients}
            >
              <Users className="w-6 h-6" />
              <span className="text-sm">Client Directory</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={handleComplianceCalendar}
            >
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Compliance Calendar</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={handleReviewQueue}
            >
              <AlertTriangle className="w-6 h-6" />
              <span className="text-sm">Review Queue</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}