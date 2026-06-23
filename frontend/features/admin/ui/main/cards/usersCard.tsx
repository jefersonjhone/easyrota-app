import { CardContent } from "@/lib/ui/card"
import { UsersIcon, ArrowUpRightIcon } from "@phosphor-icons/react"

import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle } from '@ui/card'
import { NativeSelect, NativeSelectOption } from '@/lib/ui/native-select'
import type { UserStatsResponse } from '@/features/admin/hooks/dashboard/useUsersCount'
import { PieChart, Pie, Cell, Label, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function TotalUsersCard({ users_data, onFilterChange, isMobile }: { users_data: UserStatsResponse; onFilterChange: (value: number) => void; isMobile: boolean }) {

  const COLORS = ["oklch(0.666 0.179 58.318)", "oklch(0.704 0.14 182.503)"];
  return (
      <Card className="cursor-pointer hover:shadow-md transition group rounded-lg p-2 md:p-4">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-0 pb-2 p-2">
          <Link to="/admin" className="flex gap-4 text-base p-0 m-0 justify-between items-center">
            <UsersIcon className="min-h-10 min-w-10 md:min-h-12 md:min-w-12 text-white bg-chart-4 p-2 rounded-full" />
              <CardTitle className="text-base md:font-semibold">
                Usuários cadastrados
              </CardTitle>
              <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
          </Link>
          <NativeSelect onChange={(e) => onFilterChange(Number(e.target.value))}>
            <NativeSelectOption value="-1">Total</NativeSelectOption>
            <NativeSelectOption value="7">Últimos 7 dias</NativeSelectOption>
            <NativeSelectOption value="15">Últimos 15 dias</NativeSelectOption>
            <NativeSelectOption value="30">Últimos 30 dias</NativeSelectOption>
          </NativeSelect>
        </CardHeader>

        <CardContent>
            <div className="flex flex-col items-center">
            <ResponsiveContainer
              width="100%"
              height={isMobile ? 140 : 260}
            >
              {users_data?.profiles &&
                      <PieChart>
                  <Pie data={users_data.profiles}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? "70%" : "70%"}
                    outerRadius={isMobile ? "100%" : "80%"}
                    label={!isMobile}
                  >
                    {users_data.profiles.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                  ))}
                                  <Label
                                              value={users_data.total_users}
                                              position="center"
                                              fill="currentColor"
                                              fontSize={isMobile ? 20 : 28}
                                              fontWeight="bold"
                                            />
                              </Pie>
                                <Tooltip />
                                <Legend />
                      </PieChart>
            }
            </ResponsiveContainer>
                  </div>
                </CardContent>
      </Card>
  )
}
