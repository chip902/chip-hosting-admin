'use client'

import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Bold, 
  Italic, 
  Underline,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EnhancedTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
}

interface FormatButton {
  icon: React.ComponentType<{ className?: string }>
  label: string
  format: string
  action: () => void
}

export default function EnhancedTextEditor({
  value = '',
  onChange,
  placeholder,
  className,
  rows = 12
}: EnhancedTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkData, setLinkData] = useState({ url: '', text: '' })
  const [selection, setSelection] = useState({ start: 0, end: 0 })

  // Save selection before opening dialogs
  const saveSelection = () => {
    if (textareaRef.current) {
      setSelection({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      })
    }
  }

  // Insert text at cursor position
  const insertText = (textBefore: string, textAfter: string = '', defaultText: string = '') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end) || defaultText
    
    const newValue = 
      value.substring(0, start) + 
      textBefore + 
      selectedText + 
      textAfter + 
      value.substring(end)
    
    onChange?.(newValue)
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + textBefore.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Wrap selected text with markers
  const wrapSelection = (wrapper: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    if (!selectedText) {
      insertText(wrapper, wrapper, 'text')
      return
    }

    // Check if already wrapped
    const before = value.substring(start - wrapper.length, start)
    const after = value.substring(end, end + wrapper.length)
    
    if (before === wrapper && after === wrapper) {
      // Unwrap
      const newValue = 
        value.substring(0, start - wrapper.length) + 
        selectedText + 
        value.substring(end + wrapper.length)
      onChange?.(newValue)
      
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start - wrapper.length, end - wrapper.length)
      }, 0)
    } else {
      // Wrap
      insertText(wrapper, wrapper)
    }
  }

  // Insert at line start
  const insertLinePrefix = (prefix: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const lines = value.split('\n')
    let currentPos = 0
    let lineIndex = 0
    
    // Find current line
    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length >= start) {
        lineIndex = i
        break
      }
      currentPos += lines[i].length + 1 // +1 for newline
    }
    
    // Toggle prefix
    if (lines[lineIndex].startsWith(prefix)) {
      lines[lineIndex] = lines[lineIndex].substring(prefix.length)
    } else {
      lines[lineIndex] = prefix + lines[lineIndex]
    }
    
    const newValue = lines.join('\n')
    onChange?.(newValue)
    
    // Restore cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start, start)
    }, 0)
  }

  const handleInsertLink = () => {
    saveSelection()
    const selectedText = textareaRef.current 
      ? value.substring(textareaRef.current.selectionStart, textareaRef.current.selectionEnd)
      : ''
    setLinkData({ url: '', text: selectedText })
    setShowLinkDialog(true)
  }

  const insertLink = () => {
    if (linkData.url) {
      const linkText = `[${linkData.text || 'link'}](${linkData.url})`
      
      if (textareaRef.current) {
        const newValue = 
          value.substring(0, selection.start) + 
          linkText + 
          value.substring(selection.end)
        
        onChange?.(newValue)
        
        // Close dialog and reset
        setShowLinkDialog(false)
        setLinkData({ url: '', text: '' })
        
        // Focus back on textarea
        setTimeout(() => {
          textareaRef.current?.focus()
          const newPos = selection.start + linkText.length
          textareaRef.current?.setSelectionRange(newPos, newPos)
        }, 0)
      }
    }
  }

  const formatButtons: FormatButton[] = [
    {
      icon: Bold,
      label: 'Bold',
      format: 'bold',
      action: () => wrapSelection('**')
    },
    {
      icon: Italic,
      label: 'Italic',
      format: 'italic',
      action: () => wrapSelection('*')
    },
    {
      icon: Underline,
      label: 'Underline',
      format: 'underline',
      action: () => wrapSelection('__')
    },
    {
      icon: Code,
      label: 'Code',
      format: 'code',
      action: () => wrapSelection('`')
    },
    {
      icon: Link,
      label: 'Link',
      format: 'link',
      action: handleInsertLink
    },
  ]

  const blockButtons: FormatButton[] = [
    {
      icon: Heading1,
      label: 'Heading 1',
      format: 'h1',
      action: () => insertLinePrefix('# ')
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      format: 'h2',
      action: () => insertLinePrefix('## ')
    },
    {
      icon: Heading3,
      label: 'Heading 3',
      format: 'h3',
      action: () => insertLinePrefix('### ')
    },
    {
      icon: List,
      label: 'Bullet List',
      format: 'ul',
      action: () => insertLinePrefix('- ')
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      format: 'ol',
      action: () => insertLinePrefix('1. ')
    },
    {
      icon: Quote,
      label: 'Quote',
      format: 'quote',
      action: () => insertLinePrefix('> ')
    },
  ]

  return (
    <div className={cn('relative rounded-md border bg-background', className)}>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-1 border-b bg-background p-2 flex-wrap">
        {/* Text formatting */}
        <div className="flex items-center gap-1">
          {formatButtons.map((button) => (
            <Button
              key={button.format}
              type="button"
              variant="ghost"
              size="sm"
              onClick={button.action}
              title={button.label}
              className="h-8 w-8 p-0"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Block formatting */}
        <div className="flex items-center gap-1">
          {blockButtons.map((button) => (
            <Button
              key={button.format}
              type="button"
              variant="ghost"
              size="sm"
              onClick={button.action}
              title={button.label}
              className="h-8 w-8 p-0"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="border-0 focus-visible:ring-0 resize-none whitespace-pre-wrap"
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          lineHeight: '1.5'
        }}
      />

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Add a link to your content
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
                disabled={!linkData.url}
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