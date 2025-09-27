import type { Plugin } from 'payload';
import { spamProtectionHook } from './hooks';

export const spamProtectionPlugin = (): Plugin => {
  return (config) => {
    const collections = config.collections?.map((collection) => {
      if (collection.slug !== 'comments') {
        return collection;
      }

      const hooks = collection.hooks ?? {};
      const beforeValidate = hooks.beforeValidate ?? [];

      return {
        ...collection,
        hooks: {
          ...hooks,
          beforeValidate: [...beforeValidate, spamProtectionHook],
        },
      };
    });

    return {
      ...config,
      collections,
    };
  };
};

// Helper function to sanitize HTML content
export function sanitizeContent(content: any): any {
  // For Lexical rich text, we need to traverse the tree
  if (typeof content === 'object' && content.root) {
    return sanitizeLexicalContent(content);
  }
  
  // For plain text
  if (typeof content === 'string') {
    // Remove script tags and other dangerous elements
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers
  }
  
  return content;
}

function sanitizeLexicalContent(content: any): any {
  // Deep clone to avoid mutations
  const sanitized = JSON.parse(JSON.stringify(content));
  
  // Recursively sanitize nodes
  function sanitizeNode(node: any) {
    if (!node) return;
    
    // Remove script nodes or any suspicious content
    if (node.type === 'html' && node.value) {
      node.value = sanitizeContent(node.value);
    }
    
    // Recursively sanitize children
    if (node.children && Array.isArray(node.children)) {
      node.children = node.children.map((child: any) => {
        sanitizeNode(child);
        return child;
      });
    }
  }
  
  if (sanitized.root) {
    sanitizeNode(sanitized.root);
  }
  
  return sanitized;
}