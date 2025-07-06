'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, Download, Plus, Search, RefreshCw, Upload, Image as ImageIcon, File, Eye } from 'lucide-react'
import { toast } from 'sonner'

type MediaFile = {
  id: string
  filename: string
  alt?: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
  url: string
  createdAt: string
  updatedAt: string
}

export default function MediaManager() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/media?limit=100')
      if (response.ok) {
        const data = await response.json()
        setMediaFiles(data.docs || [])
      } else {
        toast.error('Failed to fetch media files')
      }
    } catch (error) {
      console.error('Error fetching media:', error)
      toast.error('Error loading media files')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setUploading(true)
    const uploadPromises = Array.from(selectedFiles).map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      
      try {
        const response = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }
        
        return await response.json()
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        toast.error(`Failed to upload ${file.name}`)
        return null
      }
    })

    try {
      const results = await Promise.all(uploadPromises)
      const successCount = results.filter(r => r !== null).length
      
      if (successCount > 0) {
        toast.success(`Uploaded ${successCount} file${successCount === 1 ? '' : 's'}`)
        setIsUploadDialogOpen(false)
        setSelectedFiles(null)
        fetchMedia()
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/media/${file.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('File deleted')
        fetchMedia()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Error deleting file')
    }
  }

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImage = (mimeType: string) => mimeType.startsWith('image/')

  const filteredFiles = mediaFiles.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.alt?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Manage images, documents, and other files</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMedia} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Media Files</DialogTitle>
                <DialogDescription>
                  Select images, documents, or other files to upload to your media library
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported: Images, PDF, Word docs, Text files
                  </p>
                </div>
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected files:</p>
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{file.name}</span>
                        <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={uploading || !selectedFiles}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredFiles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <div className="aspect-square relative bg-muted">
                {isImage(file.mimeType) ? (
                  <img
                    src={file.url}
                    alt={file.alt || file.filename}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <File className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setPreviewFile(file)
                      setIsPreviewOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="font-medium text-sm truncate">{file.filename}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline">{file.mimeType}</Badge>
                    <span>{formatFileSize(file.filesize)}</span>
                  </div>
                  {file.width && file.height && (
                    <p className="text-xs text-muted-foreground">
                      {file.width} × {file.height}
                    </p>
                  )}
                  <div className="flex gap-1 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(file)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No media files found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No files match your search.' : 'Upload your first media files to get started.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.filename}</DialogTitle>
            <DialogDescription>
              {previewFile && `${previewFile.mimeType} • ${formatFileSize(previewFile.filesize)}`}
            </DialogDescription>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              {isImage(previewFile.mimeType) ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.alt || previewFile.filename}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center py-12 bg-muted rounded-lg">
                  <File className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Filename:</strong> {previewFile.filename}
                </div>
                <div>
                  <strong>Type:</strong> {previewFile.mimeType}
                </div>
                <div>
                  <strong>Size:</strong> {formatFileSize(previewFile.filesize)}
                </div>
                <div>
                  <strong>Uploaded:</strong> {new Date(previewFile.createdAt).toLocaleDateString()}
                </div>
                {previewFile.width && previewFile.height && (
                  <>
                    <div>
                      <strong>Width:</strong> {previewFile.width}px
                    </div>
                    <div>
                      <strong>Height:</strong> {previewFile.height}px
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleDownload(previewFile)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(previewFile)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}