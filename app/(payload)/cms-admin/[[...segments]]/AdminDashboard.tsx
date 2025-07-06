'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, FolderOpen, Image as ImageIcon, Users, Plus, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import PostsManager from '../posts/PostsManager'
import CategoriesManager from '../categories/CategoriesManager'
import MediaManager from '../media/MediaManager'
import UsersManager from '../users/UsersManager'

type AdminDashboardProps = {
  segments?: string[]
  searchParams?: { [key: string]: string | string[] }
}

type CollectionStats = {
  posts: { total: number; published: number; draft: number }
  categories: { total: number }
  media: { total: number; images: number; documents: number }
  users: { total: number; admins: number }
}

export default function AdminDashboard({ segments, searchParams }: AdminDashboardProps) {
  const [stats, setStats] = useState<CollectionStats>({
    posts: { total: 0, published: 0, draft: 0 },
    categories: { total: 0 },
    media: { total: 0, images: 0, documents: 0 },
    users: { total: 1, admins: 1 }
  })
  const [loading, setLoading] = useState(true)
  const [recentPosts, setRecentPosts] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch stats from Payload API
      const [postsRes, categoriesRes, mediaRes, usersRes] = await Promise.all([
        fetch('/api/posts?limit=5&sort=-createdAt').catch(() => null),
        fetch('/api/categories').catch(() => null),
        fetch('/api/media').catch(() => null),
        fetch('/api/users').catch(() => null)
      ])

      if (postsRes?.ok) {
        const postsData = await postsRes.json()
        setRecentPosts(postsData.docs || [])
        setStats(prev => ({
          ...prev,
          posts: {
            total: postsData.totalDocs || 0,
            published: postsData.docs?.filter((p: any) => p.status === 'published').length || 0,
            draft: postsData.docs?.filter((p: any) => p.status === 'draft').length || 0
          }
        }))
      }

      if (categoriesRes?.ok) {
        const categoriesData = await categoriesRes.json()
        setStats(prev => ({
          ...prev,
          categories: { total: categoriesData.totalDocs || 0 }
        }))
      }

      if (mediaRes?.ok) {
        const mediaData = await mediaRes.json()
        setStats(prev => ({
          ...prev,
          media: {
            total: mediaData.totalDocs || 0,
            images: mediaData.docs?.filter((m: any) => m.mimeType?.startsWith('image/')).length || 0,
            documents: mediaData.docs?.filter((m: any) => !m.mimeType?.startsWith('image/')).length || 0
          }
        }))
      }

      if (usersRes?.ok) {
        const usersData = await usersRes.json()
        setStats(prev => ({
          ...prev,
          users: {
            total: usersData.totalDocs || 0,
            admins: usersData.docs?.filter((u: any) => u.role === 'admin').length || 0
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle different admin routes
  const currentPage = segments?.[0] || 'dashboard'

  // Route to specific collection views
  if (currentPage === 'posts') {
    return <PostsManager />
  }
  if (currentPage === 'categories') {
    return <CategoriesManager />
  }
  if (currentPage === 'media') {
    return <MediaManager />
  }
  if (currentPage === 'users') {
    return <UsersManager />
  }

  // Main dashboard view
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CMS Dashboard</h1>
        <p className="text-muted-foreground">Manage your blog content and media assets</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.posts.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.posts.published} published, {stats.posts.draft} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.categories.total}</div>
            <p className="text-xs text-muted-foreground">Organize your content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.media.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.media.images} images, {stats.media.documents} documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.users.total}</div>
            <p className="text-xs text-muted-foreground">{stats.users.admins} administrators</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/cms-admin/posts/new'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-base">New Post</span>
              <Plus className="h-4 w-4" />
            </CardTitle>
            <CardDescription>Create a new blog post</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/cms-admin/media/upload'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-base">Upload Media</span>
              <Plus className="h-4 w-4" />
            </CardTitle>
            <CardDescription>Add images or documents</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/cms-admin/categories/new'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-base">New Category</span>
              <Plus className="h-4 w-4" />
            </CardTitle>
            <CardDescription>Organize your content</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/cms-admin/users/new'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-base">Add User</span>
              <Plus className="h-4 w-4" />
            </CardTitle>
            <CardDescription>Invite team members</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Posts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cms-admin/posts">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : recentPosts.length > 0 ? (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="space-y-1">
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {post.status === 'published' ? 'Published' : 'Draft'} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cms-admin/posts/${post.id}`}>Edit</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No posts yet. Create your first post!</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

