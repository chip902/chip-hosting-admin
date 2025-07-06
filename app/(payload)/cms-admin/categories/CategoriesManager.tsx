'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, Edit, Plus, Search, RefreshCw, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'

type Category = {
  id: string
  name: string
  slug: string
  description?: string
  createdAt: string
  updatedAt: string
  _count?: {
    posts: number
  }
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories?limit=100')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.docs || [])
      } else {
        toast.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Error loading categories')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    const slug = formData.slug || generateSlug(formData.name)
    
    try {
      const method = editingCategory ? 'PATCH' : 'POST'
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug,
          description: formData.description.trim() || undefined
        }),
      })

      if (response.ok) {
        toast.success(editingCategory ? 'Category updated' : 'Category created')
        setIsDialogOpen(false)
        resetForm()
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Error saving category')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Category deleted')
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Error deleting category')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '' })
    setEditingCategory(null)
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Organize your blog content with categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCategories} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Debug info */}
          <div className="text-xs text-muted-foreground">
            Dialog: {isDialogOpen ? 'OPEN' : 'CLOSED'}
          </div>
          
          {/* Force close button for debugging */}
          {isDialogOpen && (
            <Button variant="destructive" size="sm" onClick={() => setIsDialogOpen(false)}>
              Force Close Dialog
            </Button>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            console.log('Dialog state changing to:', open)
            setIsDialogOpen(open)
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                console.log('New Category button clicked')
                resetForm()
                setIsDialogOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Update category details' : 'Add a new category to organize your content'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (!editingCategory && !formData.slug) {
                        setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))
                      }
                    }}
                    placeholder="Category name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="category-slug"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL-friendly version of the name. Leave empty to auto-generate.
                  </p>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this category"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCategory ? 'Update' : 'Create'}
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
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
      ) : filteredCategories.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      /{category.slug}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(category)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.description ? (
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic mb-3">No description</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created {new Date(category.createdAt).toLocaleDateString()}</span>
                  <Badge variant="secondary">
                    <FolderOpen className="w-3 h-3 mr-1" />
                    {category._count?.posts || 0} posts
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No categories match your search.' : 'Create your first category to start organizing content.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Category
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}