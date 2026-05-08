"use client"

import { Upload, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadSlotProps {
  label: string
  file: File | null
  onFileSelect: (file: File | null) => void
}

export function FileUploadSlot({ label, file, onFileSelect }: FileUploadSlotProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      onFileSelect(droppedFile)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileSelect(null)
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-all",
        file
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleChange}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      
      {file ? (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="max-w-full truncate text-xs text-muted-foreground">
            {file.name}
          </span>
          <button
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">
            CSV 또는 Excel 파일을 놓으세요
          </span>
        </>
      )}
    </div>
  )
}
