"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react"
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
}

// 매출 구간별 데이터
const revenueTierData = [
  { tier: "5만원 이상", previousMonth: 12, currentMonth: 18 },
  { tier: "4만~5만원", previousMonth: 8, currentMonth: 11 },
  { tier: "3만~4만원", previousMonth: 15, currentMonth: 14 },
  { tier: "2만~3만원", previousMonth: 22, currentMonth: 28 },
  { tier: "1만~2만원", previousMonth: 35, currentMonth: 42 },
  { tier: "1원~1만원", previousMonth: 58, currentMonth: 67 },
]

// 팀별 성과 데이터
const teamPerformanceData = [
  { team: "엔터프라이즈", previousMonth: 5, currentMonth: 8 },
  { team: "SMB", previousMonth: 4, currentMonth: 6 },
  { team: "미드마켓", previousMonth: 2, currentMonth: 3 },
  { team: "전략영업", previousMonth: 1, currentMonth: 1 },
]

// 마케터별 상세 데이터
const marketerData = [
  { team: "엔터프라이즈", marketer: "김민수", previousMonth: 3, currentMonth: 4, diff: 1 },
  { team: "엔터프라이즈", marketer: "이지현", previousMonth: 2, currentMonth: 4, diff: 2 },
  { team: "SMB", marketer: "박서연", previousMonth: 2, currentMonth: 3, diff: 1 },
  { team: "SMB", marketer: "최준혁", previousMonth: 2, currentMonth: 3, diff: 1 },
  { team: "미드마켓", marketer: "정하나", previousMonth: 1, currentMonth: 2, diff: 1 },
  { team: "미드마켓", marketer: "강동훈", previousMonth: 1, currentMonth: 1, diff: 0 },
  { team: "전략영업", marketer: "윤서영", previousMonth: 1, currentMonth: 1, diff: 0 },
]

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

export function DashboardView({ onBack }: DashboardViewProps) {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
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

        {/* 당월 5만원 이상 전체 계정 수 */}
        <Card className="border-primary bg-primary/10">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">당월 5만원 이상 전체 계정 수</p>
              <p className="text-4xl font-bold text-foreground">18</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="bg-green-500 text-white">+50%</Badge>
              <p className="text-sm text-muted-foreground">전월 대비 +6</p>
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
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart data={revenueTierData} layout="horizontal">
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
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
                <span className="text-3xl font-bold text-foreground">18</span>
                <Badge className="bg-green-500 text-white">+50%</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">전월 12개 대비 증가</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>최고 성과 팀</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">엔터프라이즈</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">5만원 이상 계정 8개</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>최고 성과자</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">김마케터</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">계정 +2 성장</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
