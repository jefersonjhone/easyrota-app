import { Users } from "@phosphor-icons/react"
import { Card, CardContent } from '@ui/card'
import { NativeSelect, NativeSelectOption } from '@/lib/ui/native-select'
import type { UserStatsResponse } from '@/features/admin/hooks/dashboard/useUsersCount'
import { PieChart, Pie, Cell, Label, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function TotalUsersCard({ users_data, onFilterChange, isMobile }: { users_data: UserStatsResponse; onFilterChange: (value: number) => void; isMobile: boolean }) {
  const COLORS = ["oklch(0.555 0.163 48.998)", "oklch(0.704 0.14 182.503)"];
  return (
    <Card className="rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users size={20} weight="duotone" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Usuarios</span>
        </div>
        <NativeSelect onChange={(e) => onFilterChange(Number(e.target.value))} className="h-8 text-xs">
          <NativeSelectOption value="-1">Total</NativeSelectOption>
          <NativeSelectOption value="7">7 dias</NativeSelectOption>
          <NativeSelectOption value="15">15 dias</NativeSelectOption>
          <NativeSelectOption value="30">30 dias</NativeSelectOption>
        </NativeSelect>
      </div>
      <CardContent className="p-0 mt-4">
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={isMobile ? 140 : 260}>
            {users_data?.profiles && (
              <PieChart>
                <Pie
                  data={users_data.profiles}
                  dataKey="value"
                  nameKey="label"
                  cx="50%" cy="50%"
                  innerRadius={isMobile ? "70%" : "70%"}
                  outerRadius={isMobile ? "100%" : "80%"}
                  label={!isMobile}
                >
                  {users_data.profiles.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                  <Label value={users_data.total_users} position="center" fill="currentColor" fontSize={isMobile ? 20 : 28} fontWeight="bold" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
