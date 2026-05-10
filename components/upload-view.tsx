"use client"

import { FileUploadSlot } from "@/components/file-upload-slot"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Upload, Loader2 } from "lucide-react"

interface UploadViewProps {
  files: {
    previousMonth: File | null
    currentMonth: File | null
    teamNames: File | null
  }
  onFileChange: (key: keyof UploadViewProps["files"], file: File | null) => void
  onRunAnalysis: () => void
  isLoading?: boolean
}

export function UploadView({ files, onFileChange, onRunAnalysis, isLoading = false }: UploadViewProps) {
  const allFilesUploaded = files.previousMonth && files.currentMonth && files.teamNames

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <BarChart3 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">ADVOOST쇼핑 라이브 계정 체크</CardTitle>
          <CardDescription className="text-balance">
            매출 데이터 파일을 업로드하여 월별 성과를 비교하고 팀 및 마케터별 인사이트를 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-6">
            <div className="mb-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Upload className="h-5 w-5" />
              <span className="text-sm font-medium">파일을 드래그 앤 드롭하세요</span>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <FileUploadSlot
                label="전월 매출"
                file={files.previousMonth}
                onFileSelect={(file) => onFileChange("previousMonth", file)}
              />
              <FileUploadSlot
                label="당월 매출"
                file={files.currentMonth}
                onFileSelect={(file) => onFileChange("currentMonth", file)}
              />
              <FileUploadSlot
                label="팀 & 마케터 명단"
                file={files.teamNames}
                onFileSelect={(file) => onFileChange("teamNames", file)}
              />
            </div>
          </div>

          <Button
            onClick={onRunAnalysis}
            disabled={!allFilesUploaded || isLoading}
            size="lg"
            className="w-full text-base font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                분석 중...
              </>
            ) : (
              "분석 실행"
            )}
          </Button>

          {!allFilesUploaded && (
            <p className="text-center text-sm text-muted-foreground">
              분석을 실행하려면 세 개의 파일을 모두 업로드해 주세요
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
