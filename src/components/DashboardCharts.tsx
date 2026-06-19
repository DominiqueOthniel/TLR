import { DollarSign, Package, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EMOJI } from '@/lib/emoji-palette';

interface TruckRevenueRow {
  name: string;
  revenue: number;
  tripsCount: number;
  model: string;
}

interface ExpenseCategoryRow {
  name: string;
  value: number;
  percentage: string;
}

interface MonthlyRow {
  month: string;
  recettes: number;
  depenses: number;
}

interface DashboardChartsProps {
  truckRevenue: TruckRevenueRow[];
  expensesData: ExpenseCategoryRow[];
  monthlyData: MonthlyRow[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function DashboardCharts({
  truckRevenue,
  expensesData,
  monthlyData,
}: DashboardChartsProps) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {truckRevenue.length > 0 && truckRevenue.some((t) => t.revenue > 0) ? (
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-br from-background to-muted/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{EMOJI.classement} Top 5 camions par encaissement</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Classement par performance</p>
                </div>
                <Package className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={truckRevenue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [
                      `${value.toLocaleString('fr-FR')} FCFA`,
                      'Encaissement',
                    ]}
                  />
                  <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[0, 8, 8, 0]} />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {expensesData.length > 0 && expensesData.some((e) => e.value > 0) ? (
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-br from-background to-muted/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{EMOJI.argent} Répartition des Dépenses</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Par catégorie</p>
                </div>
                <DollarSign className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={expensesData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    innerRadius={60}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {expensesData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [
                      `${value.toLocaleString('fr-FR')} FCFA`,
                      'Montant',
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {monthlyData.some((m) => m.recettes > 0 || m.depenses > 0) ? (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-br from-background to-muted/20 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{EMOJI.graphique} Évolution Chiffre d&apos;affaires vs Dépenses</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Tendance sur 3 mois</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="recettes"
                  stroke="hsl(var(--chart-2))"
                  fillOpacity={1}
                  fill="url(#colorRecettes)"
                  strokeWidth={3}
                  name="Chiffre d&apos;affaires"
                />
                <Area
                  type="monotone"
                  dataKey="depenses"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorDepenses)"
                  strokeWidth={3}
                  name="Dépenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
