import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, Target, Calendar, FileText, Calculator, CheckCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '../lib/utils'
import { AIInsight } from '../types'
import { aiService } from '../services/ai'
import { transactionService } from '../services/transactions'
import { complianceService } from '../services/compliance'

export const SMEDashboard: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>({})
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [expenseData, setExpenseData] = useState<any[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load AI insights
        const aiInsights = await aiService.analyzeTransactions([])
        setInsights(aiInsights)
        
        // Load transaction summary
        const transactionSummary = await transactionService.getTransactionSummary()
        setSummary(transactionSummary)
        
        // Mock monthly data for now - in real app, this would come from backend
        setMonthlyData([
          { month: 'Jan', income: 45000, expenses: 32000 },
          { month: 'Feb', income: 52000, expenses: 38000 },
          { month: 'Mar', income: 48000, expenses: 35000 },
          { month: 'Apr', income: 61000, expenses: 42000 },
          { month: 'May', income: 55000, expenses: 39000 },
          { month: 'Jun', income: 67000, expenses: 45000 }
        ])
        
        setExpenseData([
          { name: 'Office Expenses', value: 15000, color: '#3B82F6' },
          { name: 'Travel', value: 8000, color: '#059669' },
          { name: 'Materials', value: 12000, color: '#D97706' },
          { name: 'Others', value: 10000, color: '#DC2626' }
        ])
      } catch (error) {
        console.error('Failed to load AI insights:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const totalIncome = summary.total_income || monthlyData.reduce((sum, item) => sum + item.income, 0)
  const totalExpenses = summary.total_expenses || monthlyData.reduce((sum, item) => sum + item.expenses, 0)
  const netProfit = summary.net_profit || (totalIncome - totalExpenses)

  const handleFileGSTReturn = async () => {
    try {
      // Navigate to GST filing or show GST filing modal
      const gstData = await complianceService.generateGSTR3B(new Date().toISOString().slice(0, 7))
      console.log('GST Return data:', gstData)
      // You could show a modal or navigate to a dedicated GST filing page
      alert('GST Return data prepared. Check console for details.')
    } catch (error) {
      console.error('Error preparing GST return:', error)
      alert('Error preparing GST return. Please try again.')
    }
  }

  const handleTaxPlanning = () => {
    // Navigate to tax planning page or show tax planning modal
    alert('Tax Planning feature - showing tax optimization suggestions')
  }

  const handleComplianceCheck = async () => {
    try {
      const complianceData = await complianceService.getComplianceScore()
      alert(`Compliance Score: ${complianceData.overall_score}/100`)
    } catch (error) {
      console.error('Error checking compliance:', error)
      alert('Error checking compliance. Please try again.')
    }
  }

  const handleGenerateReport = async () => {
    try {
      const blob = await transactionService.exportTransactions()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'financial-report.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report. Please try again.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Track your business performance and get AI-powered insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-green-400">Total Income</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-green-400 mt-1">+12.5% from last period</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-red-400">Total Expenses</CardTitle>
            <ArrowDownRight className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-red-400 mt-1">+8.2% from last period</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-blue-400">Net Profit</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(netProfit)}</div>
            <p className="text-xs text-blue-400 mt-1">+18.3% from last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Income vs Expenses Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {expenseData.map((entry, index) => (
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

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>AI Insights & Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.priority === 'high'
                      ? 'border-red-500 bg-red-500/10'
                      : insight.priority === 'medium'
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-green-500 bg-green-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{insight.title}</h4>
                      <p className="text-sm text-gray-300 mt-1">{insight.description}</p>
                    </div>
                    {insight.actionRequired && (
                      <Button size="sm" className="ml-4">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button 
          onClick={handleFileGSTReturn}
          className="h-16 flex flex-col items-center justify-center space-y-1"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-sm">File GST Return</span>
        </Button>
        <Button 
          onClick={handleGenerateReport}
          variant="outline" 
          className="h-16 flex flex-col items-center justify-center space-y-1"
        >
          <FileText className="w-5 h-5" />
          <span className="text-sm">Generate Report</span>
        </Button>
        <Button 
          onClick={handleComplianceCheck}
          variant="outline" 
          className="h-16 flex flex-col items-center justify-center space-y-1"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">Compliance Check</span>
        </Button>
        <Button 
          onClick={handleTaxPlanning}
          variant="outline" 
          className="h-16 flex flex-col items-center justify-center space-y-1"
        >
          <Calculator className="w-5 h-5" />
          <span className="text-sm">Tax Planning</span>
        </Button>
      </div>
    </div>
  )
}