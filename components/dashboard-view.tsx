"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Download } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface DashboardViewProps {
  onBack: () => void
  data: any
}

const chartConfig = {
  previousMonth: {
    label: "전월",
    color: "oklch(0.769 0.188 70.08)",
  },
  currentMonth: {
    label: "당월",
    color: "oklch(0.879 0.169 91.605)",
  },
} satisfies ChartConfig

export function DashboardView({ onBack, data }: DashboardViewProps) {
  const downloadUnclassifiedCSV = () => {
    const unclassified = data?.unclassified_account_ids
    if (!unclassified) {
      alert("미분류된 광고계정 ID 데이터가 없습니다.")
      return
    }

    const prevIds = unclassified.previous_month || []
    const currIds = unclassified.current_month || []

    if (prevIds.length === 0 && currIds.length === 0) {
      alert("미분류된 광고계정 ID가 없습니다.")
      return
    }

    const maxLength = Math.max(prevIds.length, currIds.length)
    let csvContent = "전월,당월\n"
    for (let i = 0; i < maxLength; i++) {
      const prev = prevIds[i] || ""
      const curr = currIds[i] || ""
      csvContent += `${prev},${curr}\n`
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "미분류_광고계정_리스트.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 1. 매출 구간별 데이터 가공
  const revenueTierData = useMemo(() => {
    if (!data?.category_1_revenue_tiers) return []
    const prev = data.category_1_revenue_tiers.previous_month
    const curr = data.category_1_revenue_tiers.current_month
    
    const tiers = [
      "50,000원 이상",
      "40,000원 이상 ~ 50,000원 미만",
      "30,000원 이상 ~ 40,000원 미만",
      "20,000원 이상 ~ 30,000원 미만",
      "10,000원 이상 ~ 20,000원 미만",
      "1원 이상 ~ 10,000원 미만"
    ]
    
    return tiers.map(tier => ({
      tier: tier.replace(" 이상", "").replace(" 미만", "").replace(" ~ ", "~"),
      previousMonth: prev[tier] || 0,
      currentMonth: curr[tier] || 0
    }))
  }, [data])

  // 2. 팀별 성과 데이터 가공 (5만원 이상)
  const teamPerformanceData = useMemo(() => {
    if (!data?.category_2_team_over_50k) return []
    const prev = data.category_2_team_over_50k.previous_month
    const curr = data.category_2_team_over_50k.current_month
    
    // 모든 팀 이름 추출
    const allTeams = Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)]))
    
    return allTeams.map(team => ({
      team,
      previousMonth: prev[team] || 0,
      currentMonth: curr[team] || 0
    })).sort((a, b) => b.currentMonth - a.currentMonth)
  }, [data])

  // 3. 마케터별 상세 데이터 가공
  const marketerData = useMemo(() => {
    if (!data?.category_3_team_marketer_over_50k) return []
    const prev = data.category_3_team_marketer_over_50k.previous_month
    const curr = data.category_3_team_marketer_over_50k.current_month
    
    const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)]))
    
    return allKeys.map(key => {
      // key: "팀이름 - 마케터이름"
      const parts = key.split(" - ")
      const team = parts[0] || "미분류"
      const marketer = parts[1] || "미분류"
      
      const pVal = prev[key] || 0
      const cVal = curr[key] || 0
      
      return {
        team,
        marketer,
        previousMonth: pVal,
        currentMonth: cVal,
        diff: cVal - pVal
      }
    }).sort((a, b) => b.currentMonth - a.currentMonth || b.diff - a.diff)
  }, [data])

  // 요약 통계 계산
  const summaryStats = useMemo(() => {
    if (!data?.category_1_revenue_tiers) return {
      totalPrev: 0, totalCurr: 0, topTeam: "-", topTeamCount: 0, topMarketer: "-", topMarketerDiff: 0
    }
    
    const prevTiers = data.category_1_revenue_tiers.previous_month
    const currTiers = data.category_1_revenue_tiers.current_month
    const totalPrev = prevTiers["50,000원 이상"] || 0
    const totalCurr = currTiers["50,000원 이상"] || 0
    
    let topTeam = "-"
    let topTeamCount = 0
    if (teamPerformanceData.length > 0) {
      topTeam = teamPerformanceData[0].team
      topTeamCount = teamPerformanceData[0].currentMonth
    }
    
    let topMarketer = "-"
    let topMarketerCount = 0
    if (marketerData.length > 0) {
      // 당월 달성갯수(currentMonth)가 가장 많은 마케터
      const bestPerformer = [...marketerData].sort((a, b) => b.currentMonth - a.currentMonth)[0]
      topMarketer = bestPerformer.marketer
      topMarketerCount = bestPerformer.currentMonth
    }
    
    return { totalPrev, totalCurr, topTeam, topTeamCount, topMarketer, topMarketerCount }
  }, [data, teamPerformanceData, marketerData])

  const diffPercent = summaryStats.totalPrev > 0 
    ? Math.round(((summaryStats.totalCurr - summaryStats.totalPrev) / summaryStats.totalPrev) * 100) 
    : (summaryStats.totalCurr > 0 ? 100 : 0)

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">분석 대시보드</h1>
              <p className="text-sm text-muted-foreground">
                전월 vs 당월 성과 비교
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadUnclassifiedCSV}>
            <Download className="mr-2 h-4 w-4" />
            미분류 계정 다운로드
          </Button>
        </div>

        {/* 당월 5만원 이상 전체 계정 수 */}
        <Card className="border-primary bg-primary/10">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">당월 5만원 이상 전체 계정 수</p>
              <p className="text-4xl font-bold text-foreground">{summaryStats.totalCurr}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={diffPercent >= 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                {diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`}
              </Badge>
              <p className="text-sm text-muted-foreground">전월 대비 {summaryStats.totalCurr - summaryStats.totalPrev > 0 ? "+" : ""}{summaryStats.totalCurr - summaryStats.totalPrev}</p>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Tiers Chart */}
        <Card>
          <CardHeader>
            <CardTitle>ADVOOST쇼핑 라이브 계정 현황</CardTitle>
            <CardDescription>
              양 월의 매출 구간별 계정 수
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-[350px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={revenueTierData} layout="horizontal" margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="tier" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}개`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="previousMonth"
                      name="전월"
                      fill="var(--color-previousMonth)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="currentMonth"
                      name="당월"
                      fill="var(--color-currentMonth)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
              <div className="flex flex-col justify-center">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>매출 구간</TableHead>
                      <TableHead className="text-right">전월</TableHead>
                      <TableHead className="text-right">당월</TableHead>
                      <TableHead className="text-right">변동</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueTierData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm py-3">{row.tier}</TableCell>
                        <TableCell className="text-right">{row.previousMonth}개</TableCell>
                        <TableCell className="text-right">{row.currentMonth}개</TableCell>
                        <TableCell className="text-right">
                          <span className={row.currentMonth - row.previousMonth >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {row.currentMonth - row.previousMonth > 0 ? "▲" : row.currentMonth - row.previousMonth < 0 ? "▼" : "-"}
                            {Math.abs(row.currentMonth - row.previousMonth)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* 합계 행 */}
                    <TableRow className="bg-muted/50 font-bold border-t-2">
                      <TableCell className="py-3">합계</TableCell>
                      <TableCell className="text-right">
                        {revenueTierData.reduce((acc, curr) => acc + curr.previousMonth, 0)}개
                      </TableCell>
                      <TableCell className="text-right">
                        {revenueTierData.reduce((acc, curr) => acc + curr.currentMonth, 0)}개
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const totalPrev = revenueTierData.reduce((acc, curr) => acc + curr.previousMonth, 0);
                          const totalCurr = revenueTierData.reduce((acc, curr) => acc + curr.currentMonth, 0);
                          const diff = totalCurr - totalPrev;
                          return (
                            <span className={diff >= 0 ? "text-green-600" : "text-red-600"}>
                              {diff > 0 ? "▲" : diff < 0 ? "▼" : "-"}
                              {Math.abs(diff)}
                            </span>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>팀별 5만원 이상 계정</CardTitle>
            <CardDescription>
              팀별 5만원 이상 매출 계정 수
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-[300px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={teamPerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="team"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="previousMonth"
                      name="전월"
                      fill="var(--color-previousMonth)"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="currentMonth"
                      name="당월"
                      fill="var(--color-currentMonth)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
              <div className="flex flex-col justify-center">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>팀명</TableHead>
                      <TableHead className="text-right">전월</TableHead>
                      <TableHead className="text-right">당월</TableHead>
                      <TableHead className="text-right">변동</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamPerformanceData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm py-2">{row.team}</TableCell>
                        <TableCell className="text-right">{row.previousMonth}개</TableCell>
                        <TableCell className="text-right">{row.currentMonth}개</TableCell>
                        <TableCell className="text-right">
                          <span className={row.currentMonth - row.previousMonth >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {row.currentMonth - row.previousMonth > 0 ? "▲" : row.currentMonth - row.previousMonth < 0 ? "▼" : "-"}
                            {Math.abs(row.currentMonth - row.previousMonth)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* 합계 행 */}
                    <TableRow className="bg-muted/50 font-bold border-t-2">
                      <TableCell className="py-2">합계</TableCell>
                      <TableCell className="text-right">
                        {teamPerformanceData.reduce((acc, curr) => acc + curr.previousMonth, 0)}개
                      </TableCell>
                      <TableCell className="text-right">
                        {teamPerformanceData.reduce((acc, curr) => acc + curr.currentMonth, 0)}개
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const totalPrev = teamPerformanceData.reduce((acc, curr) => acc + curr.previousMonth, 0);
                          const totalCurr = teamPerformanceData.reduce((acc, curr) => acc + curr.currentMonth, 0);
                          const diff = totalCurr - totalPrev;
                          return (
                            <span className={diff >= 0 ? "text-green-600" : "text-red-600"}>
                              {diff > 0 ? "▲" : diff < 0 ? "▼" : "-"}
                              {Math.abs(diff)}
                            </span>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketer Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>팀 & 마케터별 5만원 이상 계정</CardTitle>
            <CardDescription>
              마케터별 고가치 계정 상세 분석
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>팀</TableHead>
                  <TableHead>마케터</TableHead>
                  <TableHead className="text-right">전월</TableHead>
                  <TableHead className="text-right">당월</TableHead>
                  <TableHead className="text-right">추세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketerData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.team}</TableCell>
                    <TableCell>{row.marketer}</TableCell>
                    <TableCell className="text-right">{row.previousMonth}</TableCell>
                    <TableCell className="text-right">{row.currentMonth}</TableCell>
                    <TableCell className="text-right">
                      {row.diff > 0 ? (
                        <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          +{row.diff}
                        </Badge>
                      ) : row.diff < 0 ? (
                        <Badge variant="outline" className="gap-1 border-red-500 text-red-600">
                          <TrendingDown className="h-3 w-3" />
                          {row.diff}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-muted-foreground text-muted-foreground">
                          <Minus className="h-3 w-3" />
                          0
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardDescription>총 5만원 이상 계정</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{summaryStats.totalCurr}</span>
                <Badge className={diffPercent >= 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                  {diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">전월 {summaryStats.totalPrev}개 대비 {summaryStats.totalCurr - summaryStats.totalPrev >= 0 ? "증가" : "감소"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>최고 성과 팀</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{summaryStats.topTeam}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">5만원 이상 계정 {summaryStats.topTeamCount}개</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>최고 성과자 (당월 달성)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{summaryStats.topMarketer}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">당월 5만원 이상 계정 {summaryStats.topMarketerCount}개</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
