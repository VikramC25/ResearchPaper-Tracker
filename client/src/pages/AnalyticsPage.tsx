import { useState, useEffect } from "react";
import { fetchAnalytics, type AnalyticsData } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from "recharts";
import { BookOpen, TrendingUp, Target, BarChart3 } from "lucide-react";

const READING_STAGES_ORDERED = [
  "Abstract Read",
  "Introduction Done",
  "Methodology Done",
  "Results Analyzed",
  "Fully Read",
  "Notes Completed",
];

// Clean, non-purple color palette
const FUNNEL_COLORS = [
  "#64748b", // slate
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#14b8a6", // teal
  "#22c55e", // green
  "#10b981", // emerald
];

const STAGE_COLORS: Record<string, string> = {
  "Abstract Read": "#64748b",
  "Introduction Done": "#3b82f6",
  "Methodology Done": "#f59e0b",
  "Results Analyzed": "#14b8a6",
  "Fully Read": "#22c55e",
  "Notes Completed": "#10b981",
};

const IMPACT_COLORS: Record<string, string> = {
  "High Impact": "#ef4444",
  "Medium Impact": "#f59e0b",
  "Low Impact": "#94a3b8",
  Unknown: "#d1d5db",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  if (!data || data.summary.totalPapers === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          No data yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Add some papers to see analytics
        </p>
      </div>
    );
  }

  // Prepare scatter data grouped by impact score
  const scatterByImpact: Record<string, any[]> = {};
  for (const item of data.scatterData) {
    if (!scatterByImpact[item.impactScore]) {
      scatterByImpact[item.impactScore] = [];
    }
    scatterByImpact[item.impactScore].push({
      x: item.citationCount,
      y: Object.keys(scatterByImpact).indexOf(item.impactScore) + 1,
      title: item.title,
      author: item.firstAuthor,
      impactScore: item.impactScore,
    });
  }

  // Fix y-values now that we have all groups
  const impactGroups = Object.keys(scatterByImpact);
  for (const group of impactGroups) {
    const yVal = impactGroups.indexOf(group) + 1;
    for (const point of scatterByImpact[group]) {
      point.y = yVal;
    }
  }

  const funnelDataForChart = data.funnelData.map((item, index) => ({
    ...item,
    fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
    name: item.stage,
    value: item.count,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reading Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your research paper reading progress.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <BookOpen className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {data.summary.totalPapers}
                </p>
                <p className="text-xs text-muted-foreground">Total Papers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {data.summary.completionRate}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Completion Rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {(data.summary.papersByStage["Fully Read"] || 0) +
                    (data.summary.papersByStage["Notes Completed"] || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Fully Read
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {Object.keys(data.summary.avgCitationsByDomain).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Domains Covered
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Funnel Chart — Reading Stages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reading Stage Funnel</CardTitle>
            <CardDescription>
              Paper count at each reading stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <FunnelChart>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} papers`,
                    name,
                  ]}
                />
                <Funnel dataKey="value" data={funnelDataForChart} isAnimationActive>
                  {funnelDataForChart.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                  <LabelList
                    position="right"
                    fill="#374151"
                    stroke="none"
                    dataKey="name"
                    className="text-xs"
                  />
                  <LabelList
                    position="center"
                    fill="#fff"
                    stroke="none"
                    dataKey="value"
                    className="text-sm font-semibold"
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Scatter Plot — Citations by Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Citations by Impact Score
            </CardTitle>
            <CardDescription>
              Citation count on x-axis, grouped by impact score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Citations"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  label={{
                    value: "Citation Count",
                    position: "insideBottom",
                    offset: -10,
                    style: { fontSize: 12, fill: "#64748b" },
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Impact Group"
                  tickLine={false}
                  axisLine={false}
                  tick={false}
                  domain={[0, impactGroups.length + 1]}
                  label={{
                    value: "Impact Score",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12, fill: "#64748b" },
                  }}
                />
                <ZAxis range={[60, 200]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
                          <p className="text-sm font-medium">{d.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.author}
                          </p>
                          <p className="mt-1 text-xs">
                            Citations: {d.x} · {d.impactScore}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  wrapperStyle={{ fontSize: 12 }}
                />
                {impactGroups.map((group) => (
                  <Scatter
                    key={group}
                    name={group}
                    data={scatterByImpact[group]}
                    fill={IMPACT_COLORS[group] || "#94a3b8"}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stacked Bar Chart — Domain × Reading Stage */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Papers by Domain & Reading Stage
            </CardTitle>
            <CardDescription>
              Stacked breakdown of reading stages per domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data.stackedBarData}
                margin={{ top: 10, right: 20, bottom: 40, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="domain"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                />
                {READING_STAGES_ORDERED.map((stage) => (
                  <Bar
                    key={stage}
                    dataKey={stage}
                    stackId="a"
                    fill={STAGE_COLORS[stage]}
                    radius={[0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Summary Tables */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Papers by Reading Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Papers by Reading Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {READING_STAGES_ORDERED.map((stage) => {
                const count = data.summary.papersByStage[stage] || 0;
                const pct =
                  data.summary.totalPapers > 0
                    ? Math.round((count / data.summary.totalPapers) * 100)
                    : 0;
                return (
                  <div key={stage}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{stage}</span>
                      <span className="text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: STAGE_COLORS[stage],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Avg Citations by Domain */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Average Citations per Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data.summary.avgCitationsByDomain).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.summary.avgCitationsByDomain)
                  .sort(([, a], [, b]) => b - a)
                  .map(([domain, avg]) => {
                    const maxCitations = Math.max(
                      ...Object.values(data.summary.avgCitationsByDomain)
                    );
                    const pct =
                      maxCitations > 0
                        ? Math.round((avg / maxCitations) * 100)
                        : 0;
                    return (
                      <div key={domain}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{domain}</span>
                          <span className="text-muted-foreground">
                            {avg}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-slate-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
