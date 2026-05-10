"use client"

import { useState } from "react"
import { UploadView } from "@/components/upload-view"
import { DashboardView } from "@/components/dashboard-view"

interface UploadedFiles {
  previousMonth: File | null
  currentMonth: File | null
  teamNames: File | null
}

export default function Home() {
  const [view, setView] = useState<"upload" | "dashboard">("upload")
  const [files, setFiles] = useState<UploadedFiles>({
    previousMonth: null,
    currentMonth: null,
    teamNames: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)

  const handleFileChange = (key: keyof UploadedFiles, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }))
  }

  const handleRunAnalysis = async () => {
    if (!files.previousMonth || !files.currentMonth || !files.teamNames) {
      alert("모든 파일을 업로드해주세요.")
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("previousMonth", files.previousMonth)
      formData.append("currentMonth", files.currentMonth)
      formData.append("teamNames", files.teamNames)

      const response = await fetch("/api/index", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "분석 중 오류가 발생했습니다.")
      }

      const data = await response.json()
      setDashboardData(data)
      setView("dashboard")
    } catch (error: any) {
      console.error("API Error:", error)
      alert(`오류가 발생했습니다:\n${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setView("upload")
  }

  if (view === "dashboard" && dashboardData) {
    return <DashboardView onBack={handleBack} data={dashboardData} />
  }

  return (
    <UploadView
      files={files}
      onFileChange={handleFileChange}
      onRunAnalysis={handleRunAnalysis}
      isLoading={isLoading}
    />
  )
}
