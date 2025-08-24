"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface JarvisModalContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const JarvisModalContext = createContext<JarvisModalContextType | undefined>(undefined);

export function JarvisModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(prev => !prev);

  // Global keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input field
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.contentEditable === 'true';
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isInInput) {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <JarvisModalContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </JarvisModalContext.Provider>
  );
}

export function useJarvisModal() {
  const context = useContext(JarvisModalContext);
  if (context === undefined) {
    throw new Error('useJarvisModal must be used within a JarvisModalProvider');
  }
  return context;
}