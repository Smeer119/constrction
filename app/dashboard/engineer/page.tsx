'use client'

import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Code,
  Bug,
  FileText,
  PackageOpen
} from 'lucide-react'

export default function EngineerDashboard() {
  const router = useRouter()

  return (
    <DashboardLayout role="engineer">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Engineer Dashboard</h2>
          <p className="text-gray-600">
            Review site logs, manage technical tasks, and monitor system performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <Bug className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">12</div>
              <p className="text-xs text-muted-foreground">3 high priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3h</div>
              <p className="text-xs text-muted-foreground">Target: &lt;3h</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Recent Alerts</span>
              </CardTitle>
              <CardDescription>
                System alerts and issues requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-900">Database Connection Timeout</p>
                  <p className="text-sm text-red-700">Server: prod-db-01</p>
                </div>
                <Badge variant="destructive">High</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-900">High Memory Usage</p>
                  <p className="text-sm text-yellow-700">Server: app-server-02</p>
                </div>
                <Badge variant="secondary">Medium</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">Backup Completed</p>
                  <p className="text-sm text-green-700">All systems backed up</p>
                </div>
                <Badge variant="outline">Info</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Replaced Technical Tools with DPR and Material Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="w-5 h-5" />
                <span>Engineering Actions</span>
              </CardTitle>
              <CardDescription>
                Access project-specific tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push('/engineer/dpr')}
              >
                <FileText className="w-4 h-4 mr-2" />
                DPR
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push('/engineer/material-management')}
              >
                <PackageOpen className="w-4 h-4 mr-2" />
                Material Management
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
