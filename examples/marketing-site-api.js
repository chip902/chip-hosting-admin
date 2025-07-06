/**
 * Marketing Site API Utility
 * 
 * Copy this file to your marketing site project and use it to fetch content
 * from your Payload CMS admin project.
 */

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:3000/api'

/**
 * Fetch all published posts with optional filtering
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of posts to fetch
 * @param {string} options.category - Filter by category slug
 * @param {string} options.author - Filter by author ID
 * @returns {Promise<Array>} Array of posts
 */
export const getPosts = async (options = {}) => {
  try {
    const params = new URLSearchParams({
      'where[status][equals]': 'published',
      'sort': '-publishedDate',
      'populate': 'author,categories,featuredImage',
      ...options
    })

    const response = await fetch(`${ADMIN_API_URL}/posts?${params}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.docs || []
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

/**
 * Fetch a single post by slug
 * @param {string} slug - Post slug
 * @returns {Promise<Object|null>} Post object or null if not found
 */
export const getPostBySlug = async (slug) => {
  try {
    const params = new URLSearchParams({
      'where[slug][equals]': slug,
      'where[status][equals]': 'published',
      'limit': '1',
      'populate': 'author,categories,featuredImage'
    })

    const response = await fetch(`${ADMIN_API_URL}/posts?${params}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.docs?.[0] || null
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

/**
 * Fetch all categories
 * @returns {Promise<Array>} Array of categories
 */
export const getCategories = async () => {
  try {
    const response = await fetch(`${ADMIN_API_URL}/categories?sort=name`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.docs || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Fetch posts by category
 * @param {string} categorySlug - Category slug
 * @returns {Promise<Array>} Array of posts in the category
 */
export const getPostsByCategory = async (categorySlug) => {
  try {
    const params = new URLSearchParams({
      'where[status][equals]': 'published',
      'where[categories][in]': categorySlug,
      'sort': '-publishedDate',
      'populate': 'author,categories,featuredImage'
    })

    const response = await fetch(`${ADMIN_API_URL}/posts?${params}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.docs || []
  } catch (error) {
    console.error('Error fetching posts by category:', error)
    return []
  }
}

/**
 * Fetch recent posts (useful for sidebars, featured sections)
 * @param {number} limit - Number of posts to fetch (default: 5)
 * @returns {Promise<Array>} Array of recent posts
 */
export const getRecentPosts = async (limit = 5) => {
  return await getPosts({ limit: limit.toString() })
}

/**
 * Get media file URL
 * @param {string} filename - Media filename
 * @returns {string} Full URL to media file
 */
export const getMediaUrl = (filename) => {
  return `${ADMIN_API_URL.replace('/api', '')}/media/${filename}`
}

/**
 * Search posts by title or content
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching posts
 */
export const searchPosts = async (query) => {
  try {
    const params = new URLSearchParams({
      'where[status][equals]': 'published',
      'where[or][0][title][like]': query,
      'where[or][1][excerpt][like]': query,
      'sort': '-publishedDate',
      'populate': 'author,categories,featuredImage'
    })

    const response = await fetch(`${ADMIN_API_URL}/posts?${params}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.docs || []
  } catch (error) {
    console.error('Error searching posts:', error)
    return []
  }
}

/**
 * Fetch posts with pagination
 * @param {number} page - Page number (starts at 1)
 * @param {number} limit - Posts per page
 * @returns {Promise<Object>} Object with posts, pagination info
 */
export const getPostsPaginated = async (page = 1, limit = 10) => {
  try {
    const params = new URLSearchParams({
      'where[status][equals]': 'published',
      'sort': '-publishedDate',
      'populate': 'author,categories,featuredImage',
      'page': page.toString(),
      'limit': limit.toString()
    })

    const response = await fetch(`${ADMIN_API_URL}/posts?${params}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return {
      posts: data.docs || [],
      pagination: {
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
        totalDocs: data.totalDocs,
        hasNextPage: data.hasNextPage,
        hasPrevPage: data.hasPrevPage
      }
    }
  } catch (error) {
    console.error('Error fetching paginated posts:', error)
    return {
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 1,
        totalDocs: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
  }
}

// Example usage in a Next.js page:
/*
import { getPosts, getPostBySlug } from '../lib/api'

export default function Blog({ posts }) {
  return (
    <div>
      <h1>Blog</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <Link href={`/blog/${post.slug}`}>Read More</Link>
        </article>
      ))}
    </div>
  )
}

export async function getStaticProps() {
  const posts = await getPosts()
  return {
    props: { posts },
    revalidate: 60 // Revalidate every 60 seconds
  }
}
*/
