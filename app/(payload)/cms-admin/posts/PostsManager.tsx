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
import { Trash2, Edit, Plus, Search, RefreshCw, FileText, Calendar, Eye, ExternalLink, Image, Tag, User } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Post, Category, User as UserType, Media } from '../../../payload-types'

// Helper to extract text from rich text content while preserving all line breaks
const extractTextFromRichText = (richText: any): string => {
  if (!richText || typeof richText !== 'object') return ''
  
  console.log('Extracting from richText:', JSON.stringify(richText, null, 2))
  
  const extractText = (node: any): string => {
    console.log('Processing node:', node.type, node)
    
    if (node.text) return node.text
    
    if (node.type === 'heading' && node.children) {
      // For headings, add the appropriate number of # symbols
      const level = node.tag ? parseInt(node.tag.replace('h', '')) : 2
      const headingText = node.children.map((child: any) => extractText(child)).join('')
      const result = headingText ? '#'.repeat(level) + ' ' + headingText : ''
      console.log('Heading result:', result)
      return result
    }
    
    if (node.type === 'paragraph' && node.children) {
      // For paragraphs, extract text without adding extra newlines
      const paragraphText = node.children.map((child: any) => extractText(child)).join('')
      console.log('Paragraph result:', paragraphText.substring(0, 50) + '...')
      return paragraphText
    }
    
    if (node.type === 'linebreak') {
      return '\n'
    }
    
    if (node.children && Array.isArray(node.children)) {
      return node.children.map((child: any) => extractText(child)).join('')
    }
    
    return ''
  }
  
  if (richText.root && richText.root.children) {
    // Join children with single newlines to preserve line breaks
    const result = richText.root.children.map((child: any) => {
      const childText = extractText(child)
      return childText
    }).join('\n')
    
    console.log('Final extracted text:', result.substring(0, 200) + '...')
    return result.trim()
  }
  
  return ''
}

// Helper to create Lexical structure from text - preserving all line breaks
const createLexicalFromText = (text: string) => {
  if (!text || !text.trim()) {
    // Return minimal empty structure
    return {
      root: {
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [],
          direction: null,
          format: '',
          indent: 0,
          version: 1
        }],
        direction: null,
        format: '',
        indent: 0,
        version: 1
      }
    }
  }
  
  // Split by single newlines to preserve all line breaks
  // Each line becomes its own paragraph to preserve formatting
  const lines = text.split('\n')
  const children: any[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip completely empty lines but preserve spacing
    if (line === '') {
      // Add empty paragraph to maintain spacing
      children.push({
        type: 'paragraph',
        children: [],
        direction: null,
        format: '',
        indent: 0,
        version: 1
      })
      continue
    }
    
    // Check if this is a heading
    if (line.startsWith('#')) {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        children.push({
          type: 'heading',
          children: [{
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: headingMatch[2],
            version: 1
          }],
          direction: null,
          format: '',
          indent: 0,
          version: 1,
          tag: `h${level}`
        })
        continue
      }
    }
    
    // Regular text line - create paragraph
    children.push({
      type: 'paragraph',
      children: [{
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: line,
        version: 1
      }],
      direction: null,
      format: '',
      indent: 0,
      version: 1
    })
  }
  
  // If no children, create an empty paragraph
  if (children.length === 0) {
    children.push({
      type: 'paragraph',
      children: [],
      direction: null,
      format: '',
      indent: 0,
      version: 1
    })
  }
  
  return {
    root: {
      type: 'root',
      children: children,
      direction: null,
      format: '',
      indent: 0,
      version: 1
    }
  }
}

export default function PostsManager() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
    categoryId: 'none',
    featuredImageId: 'none',
    authorId: 'none',
    tags: [] as string[],
    metaTitle: '',
    metaDescription: '',
    metaImageId: 'none'
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkData, setLinkData] = useState({ url: '', text: '' })
  const [currentTextArea, setCurrentTextArea] = useState<'content' | 'excerpt' | null>(null)

  useEffect(() => {
    fetchPosts()
    fetchCategories()
    fetchUsers()
    fetchMedia()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts?limit=100&depth=2')
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=100')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.docs || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchMedia = async () => {
    try {
      const response = await fetch('/api/media?limit=100')
      if (response.ok) {
        const data = await response.json()
        setMedia(data.docs || [])
      }
    } catch (error) {
      console.error('Error fetching media:', error)
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
      
      const contentLexical = createLexicalFromText(formData.content.trim())
      const excerptLexical = formData.excerpt.trim() ? createLexicalFromText(formData.excerpt.trim()) : null
      
      console.log('Content being sent:', JSON.stringify(contentLexical, null, 2))
      
      const body: any = {
        title: formData.title.trim(),
        slug,
        content: contentLexical,
        status: formData.status
      }

      // Add excerpt if provided
      if (excerptLexical) {
        body.excerpt = excerptLexical
      }

      // Add relationships
      if (formData.categoryId && formData.categoryId !== 'none') {
        body.category = formData.categoryId
      }

      if (formData.featuredImageId && formData.featuredImageId !== 'none') {
        body.featuredImage = formData.featuredImageId
      }

      if (formData.authorId && formData.authorId !== 'none') {
        body.author = formData.authorId
      }

      // Add tags - ensure it's always an array, even if empty
      body.tags = formData.tags.length > 0 ? formData.tags : []

      // Add SEO meta fields - always include meta object even if empty
      body.meta = {}
      if (formData.metaTitle.trim()) {
        body.meta.title = formData.metaTitle.trim()
      }
      if (formData.metaDescription.trim()) {
        body.meta.description = formData.metaDescription.trim()
      }
      if (formData.metaImageId && formData.metaImageId !== 'none') {
        body.meta.image = formData.metaImageId
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

    // Debug logging to see what's in the post object
    console.log('Editing post:', post)
    console.log('Post tags:', post.tags)
    console.log('Post meta:', post.meta)

    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: extractTextFromRichText(post.excerpt) || '',
      content: extractTextFromRichText(post.content) || '',
      status: post.status,
      categoryId: typeof post.category === 'object' && post.category ? post.category.id : 'none',
      featuredImageId: typeof post.featuredImage === 'object' && post.featuredImage ? post.featuredImage.id : 'none',
      authorId: typeof post.author === 'object' && post.author ? post.author.id : 'none',
      tags: Array.isArray(post.tags) ? post.tags : [],
      metaTitle: post.meta?.title || '',
      metaDescription: post.meta?.description || '',
      metaImageId: typeof post.meta?.image === 'object' && post.meta?.image ? post.meta.image.id : 'none'
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
    setFormData({ 
      title: '', 
      slug: '', 
      excerpt: '', 
      content: '', 
      status: 'draft', 
      categoryId: 'none',
      featuredImageId: 'none',
      authorId: 'none',
      tags: [],
      metaTitle: '',
      metaDescription: '',
      metaImageId: 'none'
    })
    setEditingPost(null)
  }

  const handleInsertLink = (field: 'content' | 'excerpt') => {
    setCurrentTextArea(field)
    setLinkData({ url: '', text: '' })
    setShowLinkDialog(true)
  }

  const insertLink = () => {
    if (linkData.url && linkData.text && currentTextArea) {
      const linkMarkdown = `[${linkData.text}](${linkData.url})`
      const currentValue = formData[currentTextArea]
      const newValue = currentValue + linkMarkdown
      
      setFormData(prev => ({
        ...prev,
        [currentTextArea]: newValue
      }))
      
      setShowLinkDialog(false)
      setLinkData({ url: '', text: '' })
      setCurrentTextArea(null)
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'published' ? 'default' : 'secondary'
  }

  const filteredPosts = posts.filter(post => {
    const contentText = extractTextFromRichText(post.content)
    const excerptText = extractTextFromRichText(post.excerpt)
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contentText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         excerptText.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <Label htmlFor="featuredImage">Featured Image</Label>
                  <Select value={formData.featuredImageId} onValueChange={(value) => setFormData({ ...formData, featuredImageId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select featured image" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No featured image</SelectItem>
                      {media.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.filename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsertLink('excerpt')}
                      className="h-auto p-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Link
                    </Button>
                  </div>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief summary of the post..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Brief summary used for previews and SEO description.
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">Content *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsertLink('content')}
                      className="h-auto p-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Link
                    </Button>
                  </div>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your post content here..."
                    className="min-h-[300px]"
                    rows={12}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Main content will be converted to rich text in Payload CMS. Use [link text](url) for links.
                  </p>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Select value={formData.authorId} onValueChange={(value) => setFormData({ ...formData, authorId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select author" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No author</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags.join(', ')}
                    onChange={(e) => {
                      const newTags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      setFormData({ ...formData, tags: newTags })
                    }}
                    onBlur={(e) => {
                      // Clean up tags on blur to ensure proper formatting
                      const cleanedTags = e.target.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(Boolean)
                        .filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
                      setFormData({ ...formData, tags: cleanedTags })
                    }}
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter tags separated by commas. {formData.tags.length > 0 && `(${formData.tags.length} tags)`}
                  </p>
                  {formData.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs cursor-pointer"
                          onClick={() => {
                            const newTags = formData.tags.filter((_, i) => i !== index)
                            setFormData({ ...formData, tags: newTags })
                          }}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* SEO Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">SEO Meta Data</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                        placeholder="SEO title for search engines"
                      />
                    </div>
                    <div>
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        placeholder="SEO description for search engines"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="metaImage">Meta Image</Label>
                      <Select value={formData.metaImageId} onValueChange={(value) => setFormData({ ...formData, metaImageId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select meta image" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No meta image</SelectItem>
                          {media.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.filename}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
                  {editingPost && (
                    <Button type="button" variant="outline" asChild>
                      <Link href={`/cms-admin/posts/${editingPost.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Edit in Full Window
                      </Link>
                    </Button>
                  )}
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
                      {typeof post.category === 'object' && post.category && (
                        <>
                          <span>•</span>
                          <Badge variant="outline">{post.category.name}</Badge>
                        </>
                      )}
                      {typeof post.author === 'object' && post.author && (
                        <>
                          <span>•</span>
                          <User className="w-4 h-4" />
                          <span>{post.author.email}</span>
                        </>
                      )}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {typeof post.featuredImage === 'object' && post.featuredImage && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Image className="w-3 h-3" />
                        <span>Featured image: {post.featuredImage.filename}</span>
                      </div>
                    )}
                    {(post.meta?.title || post.meta?.description) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3" />
                        <span>SEO: {post.meta?.title ? '✓ Title' : ''} {post.meta?.description ? '✓ Description' : ''}</span>
                      </div>
                    )}
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
                <div className="space-y-2">
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <strong>Excerpt:</strong> {extractTextFromRichText(post.excerpt).substring(0, 150)}...
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {extractTextFromRichText(post.content).substring(0, 200)}...
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <code className="text-xs bg-muted px-2 py-1 rounded">/{post.slug}</code>
                  <div className="flex gap-1">
                    {post.status === 'published' && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                    {post.status === 'draft' && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/blog/${post.slug}?preview=true`} target="_blank">
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
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

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Add a link to your {currentTextArea === 'content' ? 'content' : 'excerpt'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="linkText">Link Text</Label>
              <Input
                id="linkText"
                value={linkData.text}
                onChange={(e) => setLinkData({ ...linkData, text: e.target.value })}
                placeholder="Enter link text"
              />
            </div>
            <div>
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkData.url}
                onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowLinkDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={insertLink}
                disabled={!linkData.text || !linkData.url}
              >
                Insert Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}