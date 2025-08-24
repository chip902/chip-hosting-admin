import type { CollectionConfig } from 'payload';
import { commentAfterChangeHook } from '../hooks/comments/afterChange';
import { commentAfterDeleteHook } from '../hooks/comments/afterDelete';

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['post', 'authorName', 'isApproved', 'createdAt'],
  },
  access: {
    read: () => true, // Public read access
    create: () => true, // Anyone can create comments (with spam protection)
    update: ({ req: { user } }) => {
      // Only admins can update comments
      if (user) return true;
      return false;
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete comments
      if (user) return true;
      return false;
    },
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      index: true,
      admin: {
        description: 'The post this comment belongs to',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      validate: (value) => {
        if (!value || (typeof value === 'object' && !value.root?.children?.length)) {
          return 'Comment content is required';
        }
        // Check content length (approximate)
        const textContent = JSON.stringify(value);
        if (textContent.length < 10) {
          return 'Comment must be at least 10 characters';
        }
        if (textContent.length > 5000) {
          return 'Comment cannot exceed 5000 characters';
        }
        return true;
      },
      admin: {
        description: 'The comment content',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        description: 'Registered user who posted the comment',
      },
    },
    {
      name: 'anonymousId',
      type: 'text',
      required: false,
      index: true,
      admin: {
        description: 'Anonymous user identifier',
        condition: (data) => !data.author,
      },
    },
    {
      name: 'authorName',
      type: 'text',
      required: false,
      validate: (value, { data }) => {
        // If no author (registered user), require a name
        if (!data?.author && !value) {
          return 'Name is required for anonymous comments';
        }
        if (value && value.length > 100) {
          return 'Name cannot exceed 100 characters';
        }
        return true;
      },
      admin: {
        description: 'Display name for anonymous users',
        condition: (data) => !data.author,
      },
    },
    {
      name: 'parentComment',
      type: 'relationship',
      relationTo: 'comments' as const,
      required: false,
      admin: {
        description: 'Parent comment for threaded replies',
      },
    },
    {
      name: 'votes',
      type: 'group',
      fields: [
        {
          name: 'upvotes',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'downvotes',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'score',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
      ],
      admin: {
        description: 'Vote counts and score',
      },
    },
    {
      name: 'voters',
      type: 'array',
      fields: [
        {
          name: 'userId',
          type: 'text',
          required: true,
        },
        {
          name: 'vote',
          type: 'number',
          required: true,
          validate: (value) => {
            if (value !== 1 && value !== -1) {
              return 'Vote must be either 1 or -1';
            }
            return true;
          },
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
        },
      ],
      admin: {
        hidden: true, // Hide from admin UI
      },
    },
    {
      name: 'isApproved',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the comment is approved for public display',
      },
    },
    {
      name: 'isSpam',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the comment was flagged as spam',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        hidden: true, // Hide from admin UI for privacy
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        hidden: true, // Hide from admin UI
      },
    },
    // Honeypot field for spam protection
    {
      name: '_honeypot',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [commentAfterChangeHook],
    afterDelete: [commentAfterDeleteHook],
  },
};