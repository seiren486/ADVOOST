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

  const handleFileChange = (key: keyof UploadedFiles, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }))
  }

  const handleRunAnalysis = () => {
    setView("dashboard")
  }

  const handleBack = () => {
    setView("upload")
  }

  if (view === "dashboard") {
    return <DashboardView onBack={handleBack} />
  }

  return (
    <UploadView
      files={files}
      onFileChange={handleFileChange}
      onRunAnalysis={handleRunAnalysis}
    />
  )
}
