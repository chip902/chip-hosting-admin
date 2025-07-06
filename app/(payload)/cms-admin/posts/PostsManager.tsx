'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Edit, Plus, Search, RefreshCw, FileText, Calendar, Eye, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Post = {
  id: string
  title: string
  slug: string
  content: string
  status: 'draft' | 'published'
  publishedAt?: string
  category?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

type Category = {
  id: string
  name: string
  slug: string
}

export default function PostsManager() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
    categoryId: ''
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts?limit=100&depth=1')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.docs || [])
      } else {
        toast.error('Failed to fetch posts')
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Error loading posts')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?limit=100')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.docs || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Post title is required')
      return
    }

    const slug = formData.slug || generateSlug(formData.title)
    
    try {
      const method = editingPost ? 'PATCH' : 'POST'
      const url = editingPost ? `/api/posts/${editingPost.id}` : '/api/posts'
      
      const body: any = {
        title: formData.title.trim(),
        slug,
        content: formData.content.trim(),
        status: formData.status
      }

      if (formData.categoryId) {
        body.category = formData.categoryId
      }

      if (formData.status === 'published' && !editingPost?.publishedAt) {
        body.publishedAt = new Date().toISOString()
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(editingPost ? 'Post updated' : 'Post created')
        setIsDialogOpen(false)
        resetForm()
        fetchPosts()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save post')
      }
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Error saving post')
    }
  }

  const handleEdit = (post: Post) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      status: post.status,
      categoryId: post.category?.id || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (post: Post) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Post deleted')
        fetchPosts()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Error deleting post')
    }
  }

  const handleStatusChange = async (post: Post, newStatus: 'draft' | 'published') => {
    try {
      const body: any = { status: newStatus }
      if (newStatus === 'published' && !post.publishedAt) {
        body.publishedAt = new Date().toISOString()
      }

      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(`Post ${newStatus}`)
        fetchPosts()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error updating status')
    }
  }

  const resetForm = () => {
    setFormData({ title: '', slug: '', content: '', status: 'draft', categoryId: '' })
    setEditingPost(null)
  }

  const getStatusColor = (status: string) => {
    return status === 'published' ? 'default' : 'secondary'
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground">Create and manage your blog content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPosts} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
                <DialogDescription>
                  {editingPost ? 'Update your blog post' : 'Write a new blog post for your site'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      if (!editingPost && !formData.slug) {
                        setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))
                      }
                    }}
                    placeholder="Post title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="post-slug"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL-friendly version of the title. Leave empty to auto-generate.
                  </p>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your post content here..."
                    rows={8}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPost ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3 mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Created {new Date(post.createdAt).toLocaleDateString()}</span>
                      {post.publishedAt && (
                        <>
                          <span>•</span>
                          <span>Published {new Date(post.publishedAt).toLocaleDateString()}</span>
                        </>
                      )}
                      {post.category && (
                        <>
                          <span>•</span>
                          <Badge variant="outline">{post.category.name}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(post.status) as any} className="capitalize">
                      {post.status}
                    </Badge>
                    <div className="flex gap-1">
                      {post.status === 'draft' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(post, 'published')}
                        >
                          Publish
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(post, 'draft')}
                        >
                          Unpublish
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(post)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.content.substring(0, 200)}...
                </p>
                <div className="flex items-center justify-between mt-4">
                  <code className="text-xs bg-muted px-2 py-1 rounded">/{post.slug}</code>
                  {post.status === 'published' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No posts match your search criteria.' 
                : 'Create your first blog post to get started.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}