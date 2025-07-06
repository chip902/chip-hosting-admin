'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Edit, Plus, Search, RefreshCw, Users, Mail, Shield, Calendar } from 'lucide-react'
import { toast } from 'sonner'

type User = {
  id: string
  email: string
  role?: 'admin' | 'editor' | 'author'
  createdAt: string
  updatedAt: string
  lastLogin?: string
  _count?: {
    posts: number
  }
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'author' as 'admin' | 'editor' | 'author'
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users?limit=100')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.docs || [])
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error loading users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }

    if (!editingUser && !formData.password.trim()) {
      toast.error('Password is required for new users')
      return
    }

    try {
      const method = editingUser ? 'PATCH' : 'POST'
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      
      const body: any = {
        email: formData.email.trim(),
        role: formData.role
      }

      if (!editingUser || formData.password.trim()) {
        body.password = formData.password
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(editingUser ? 'User updated' : 'User created')
        setIsDialogOpen(false)
        resetForm()
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save user')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Error saving user')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      role: user.role || 'author'
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.email}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('User deleted')
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error deleting user')
    }
  }

  const resetForm = () => {
    setFormData({ email: '', password: '', role: 'author' })
    setEditingUser(null)
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3" />
      case 'editor':
        return <Edit className="w-3 h-3" />
      default:
        return <Users className="w-3 h-3" />
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'editor':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update user details and permissions' : 'Create a new user account'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    Password {editingUser ? '(leave empty to keep current)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'New password' : 'Password'}
                    required={!editingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="author">Author</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Authors can create posts, Editors can manage content, Admins have full access
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/6"></div>
                  </div>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                  <div className="h-8 w-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredUsers.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-6 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                          {user.lastLogin && (
                            <>
                              <span>•</span>
                              <span>Last active {new Date(user.lastLogin).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getRoleColor(user.role) as any} className="capitalize">
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{user.role || 'author'}</span>
                      </Badge>
                      {user._count && user._count.posts > 0 && (
                        <Badge variant="outline">
                          {user._count.posts} posts
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No users match your search.' : 'Add team members to collaborate on content.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}