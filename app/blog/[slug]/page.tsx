'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'

// Helper to extract and render rich text content
const renderRichText = (richText: any): string => {
  if (!richText || typeof richText !== 'object') return ''
  
  const renderNode = (node: any): string => {
    if (node.text) {
      let text = node.text
      // Apply formatting based on format number
      if (node.format) {
        if (node.format & 1) text = `<strong>${text}</strong>` // bold
        if (node.format & 2) text = `<em>${text}</em>` // italic
        if (node.format & 8) text = `<u>${text}</u>` // underline
        if (node.format & 16) text = `<code>${text}</code>` // code
      }
      return text
    }
    
    if (node.type === 'paragraph' && node.children) {
      const content = node.children.map((child: any) => renderNode(child)).join('')
      return content ? `<p>${content}</p>` : ''
    }
    
    if (node.type === 'heading' && node.children) {
      const content = node.children.map((child: any) => renderNode(child)).join('')
      const tag = node.tag || 'h2'
      return `<${tag}>${content}</${tag}>`
    }
    
    if (node.type === 'link' && node.children) {
      const content = node.children.map((child: any) => renderNode(child)).join('')
      return `<a href="${node.url}" target="_blank" rel="noopener noreferrer">${content}</a>`
    }
    
    if (node.children && Array.isArray(node.children)) {
      return node.children.map((child: any) => renderNode(child)).join('')
    }
    
    return ''
  }
  
  if (richText.root && richText.root.children) {
    return richText.root.children.map((child: any) => renderNode(child)).join('')
  }
  
  return ''
}

interface Post {
  id: string
  title: string
  slug: string
  content: any
  excerpt?: any
  featuredImage?: any
  author?: any
  category?: any
  tags?: string[]
  publishedAt?: string
  meta?: {
    title?: string
    description?: string
    image?: any
  }
}

export default function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (!resolvedParams) return
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts?where[slug][equals]=${resolvedParams.slug}&limit=1&depth=2`)
        if (response.ok) {
          const data = await response.json()
          const foundPost = data.docs?.[0]
          if (foundPost) {
            setPost(foundPost)
          } else {
            setPost(null)
          }
        } else {
          setPost(null)
        }
      } catch (error) {
        console.error('Error fetching post:', error)
        setPost(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [resolvedParams])

  if (loading || !resolvedParams) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    notFound()
  }

  const contentHtml = renderRichText(post.content)
  const excerptHtml = post.excerpt ? renderRichText(post.excerpt) : ''

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <article className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          {/* Meta information */}
          <div className="flex items-center text-sm text-gray-600 mb-6">
            {post.author && typeof post.author === 'object' && (
              <span>By {post.author.email}</span>
            )}
            {post.publishedAt && (
              <>
                <span className="mx-2">•</span>
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </>
            )}
            {post.category && typeof post.category === 'object' && (
              <>
                <span className="mx-2">•</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {post.category.name}
                </span>
              </>
            )}
          </div>

          {/* Featured Image */}
          {post.featuredImage && typeof post.featuredImage === 'object' && (
            <div className="mb-8">
              <img
                src={post.featuredImage.url || `/api/media/${post.featuredImage.id}`}
                alt={post.featuredImage.alt || post.title}
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Excerpt */}
          {excerptHtml && (
            <div 
              className="text-lg text-gray-600 mb-8 italic border-l-4 border-blue-500 pl-4"
              dangerouslySetInnerHTML={{ __html: excerptHtml }}
            />
          )}
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div 
            className="text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
            style={{
              lineHeight: '1.7',
            }}
          />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Back to Posts
          </button>
        </div>
      </article>
    </div>
  )
}