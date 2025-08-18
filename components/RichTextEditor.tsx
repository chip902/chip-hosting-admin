'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List, 
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Table,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Type,
  ChevronDown,
  Indent,
  Outdent
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  className,
  autoFocus = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [textColor, setTextColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#FFFF00')
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [selectedText, setSelectedText] = useState('')

  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus()
    }
  }, [autoFocus])

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      onChange?.(html)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle formatting shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          document.execCommand('bold', false)
          break
        case 'i':
          e.preventDefault()
          document.execCommand('italic', false)
          break
        case 'u':
          e.preventDefault()
          document.execCommand('underline', false)
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            document.execCommand('redo', false)
          } else {
            document.execCommand('undo', false)
          }
          break
        case 'k':
          e.preventDefault()
          handleInsertLink()
          break
      }
    }
  }

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleInsertLink = () => {
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      setSelectedText(selection.toString())
      setShowLinkDialog(true)
    } else {
      const url = prompt('Enter URL:')
      if (url) {
        formatText('createLink', url)
      }
    }
  }

  const insertLink = () => {
    if (linkUrl) {
      formatText('createLink', linkUrl)
      setShowLinkDialog(false)
      setLinkUrl('')
      setSelectedText('')
    }
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      formatText('insertImage', url)
    }
  }

  const insertTable = () => {
    const rows = prompt('Number of rows:', '3')
    const cols = prompt('Number of columns:', '3')
    if (rows && cols) {
      const rowCount = parseInt(rows)
      const colCount = parseInt(cols)
      let tableHtml = '<table class="border-collapse border border-gray-300 my-4"><tbody>'
      for (let i = 0; i < rowCount; i++) {
        tableHtml += '<tr>'
        for (let j = 0; j < colCount; j++) {
          tableHtml += '<td class="border border-gray-300 p-2">Cell</td>'
        }
        tableHtml += '</tr>'
      }
      tableHtml += '</tbody></table>'
      formatText('insertHTML', tableHtml)
    }
  }

  const insertCodeBlock = () => {
    const code = prompt('Enter code:')
    if (code) {
      const codeHtml = `<pre class="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto my-2"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
      formatText('insertHTML', codeHtml)
    }
  }

  return (
    <div className={cn('relative rounded-md border bg-background', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b p-2 flex-wrap">
        {/* Text Format Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Type className="h-4 w-4" />
              Format
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => formatText('formatBlock', '<p>')}>
              Normal Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatText('formatBlock', '<h1>')}>
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatText('formatBlock', '<h2>')}>
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatText('formatBlock', '<h3>')}>
              Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatText('formatBlock', '<h4>')}>
              Heading 4
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => formatText('formatBlock', '<blockquote>')}>
              Blockquote
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-border" />

        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          title="Bold (Cmd+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          title="Italic (Cmd+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('underline')}
          title="Underline (Cmd+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('strikeThrough')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={insertCodeBlock}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Text Color">
              <Type className="h-4 w-4" style={{ color: textColor }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Text Color</Label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value)
                  formatText('foreColor', e.target.value)
                }}
                className="h-8 w-full cursor-pointer"
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Background Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Highlight Color">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Highlight Color</Label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => {
                  setBgColor(e.target.value)
                  formatText('hiliteColor', e.target.value)
                }}
                className="h-8 w-full cursor-pointer"
              />
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-border" />

        {/* Alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('justifyLeft')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('justifyCenter')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('justifyRight')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('justifyFull')}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('indent')}
          title="Indent"
        >
          <Indent className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('outdent')}
          title="Outdent"
        >
          <Outdent className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Insert */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInsertLink}
          title="Insert Link (Cmd+K)"
        >
          <Link className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={insertImage}
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={insertTable}
          title="Insert Table"
        >
          <Table className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('formatBlock', '<blockquote>')}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('undo')}
          title="Undo (Cmd+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('redo')}
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText('removeFormat')}
          title="Clear Formatting"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.9999 7L11.8999 4.8C11.6999 4.3 11.1999 4 10.6999 4H6.8999C6.3999 4 5.9999 4.4 5.9999 4.9V12.4C5.9999 12.9 6.3999 13.4 6.8999 13.4H8.9999L12.4999 20H14.7999L11.1499 13.4H12.9999C13.5499 13.4 13.9999 12.95 13.9999 12.4V8C13.9999 7.45 13.5499 7 12.9999 7Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 4L6 20" />
          </svg>
        </Button>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          className={cn(
            "min-h-[200px] p-4 outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "[&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-4",
            "[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mb-3", 
            "[&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mb-2",
            "[&_h4]:text-xl [&_h4]:font-bold [&_h4]:mb-2",
            "[&_p]:mb-2",
            "[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-2",
            "[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-2",
            "[&_li]:mb-1",
            "[&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4",
            "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono",
            "[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre]:my-2",
            "[&_table]:border-collapse [&_table]:border [&_table]:border-border [&_table]:my-4",
            "[&_td]:border [&_td]:border-border [&_td]:p-2",
            "[&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:font-bold [&_th]:bg-muted",
            "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2"
          )}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
        {!value && (
          <div className="pointer-events-none absolute left-4 top-4 text-muted-foreground">
            {placeholder}
          </div>
        )}
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-4 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Insert Link</h3>
            <p className="text-sm text-muted-foreground mb-4">Link for: &ldquo;{selectedText}&rdquo;</p>
            <Input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLinkDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={insertLink}>
                Insert
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}