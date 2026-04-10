import { useState, useEffect, useCallback } from "react";
import { fetchPapers, deletePaper, type Paper, type FilterParams } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Trash2,
  Filter,
  X,
  Search,
  FileText,
  Maximize2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DOMAINS = [
  "Computer Science",
  "Biology",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Social Sciences",
];

const READING_STAGES = [
  "Abstract Read",
  "Introduction Done",
  "Methodology Done",
  "Results Analyzed",
  "Fully Read",
  "Notes Completed",
];

const IMPACT_SCORES = ["High Impact", "Medium Impact", "Low Impact", "Unknown"];

const DATE_RANGES = [
  { value: "all_time", label: "All Time" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_3_months", label: "Last 3 Months" },
];

const STAGE_COLORS: Record<string, string> = {
  "Abstract Read": "bg-slate-100 text-slate-700",
  "Introduction Done": "bg-blue-50 text-blue-700",
  "Methodology Done": "bg-amber-50 text-amber-700",
  "Results Analyzed": "bg-teal-50 text-teal-700",
  "Fully Read": "bg-emerald-50 text-emerald-700",
  "Notes Completed": "bg-green-100 text-green-800",
};

const IMPACT_COLORS: Record<string, string> = {
  "High Impact": "bg-red-50 text-red-700 border-red-200",
  "Medium Impact": "bg-orange-50 text-orange-700 border-orange-200",
  "Low Impact": "bg-slate-50 text-slate-600 border-slate-200",
  Unknown: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function LibraryPage() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);

  // Filter state
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedImpact, setSelectedImpact] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("all_time");

  const activeFilterCount =
    selectedStages.length +
    selectedDomains.length +
    selectedImpact.length +
    (dateRange !== "all_time" ? 1 : 0);

  const loadPapers = useCallback(async () => {
    setLoading(true);
    try {
      const filters: FilterParams = {};
      if (selectedStages.length) filters.reading_stage = selectedStages;
      if (selectedDomains.length) filters.domain = selectedDomains;
      if (selectedImpact.length) filters.impact_score = selectedImpact;
      if (dateRange !== "all_time") filters.date_range = dateRange;

      const data = await fetchPapers(filters);
      setPapers(data);
    } catch (err) {
      console.error("Failed to load papers:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStages, selectedDomains, selectedImpact, dateRange]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this paper?")) return;
    try {
      await deletePaper(id);
      setPapers((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const toggleFilter = (
    list: string[],
    setter: (val: string[]) => void,
    value: string
  ) => {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  const clearFilters = () => {
    setSelectedStages([]);
    setSelectedDomains([]);
    setSelectedImpact([]);
    setDateRange("all_time");
  };

  return (
    <div>
      {/* PDF Modal */}
      {viewingPdf && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" 
          onClick={() => setViewingPdf(null)}
        >
          <div 
            className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold">Paper Viewer</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingPdf(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <iframe 
              src={`${viewingPdf}#toolbar=1&navpanes=0&scrollbar=1`} 
              className="h-full w-full flex-1"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Paper Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {papers.length} paper{papers.length !== 1 ? "s" : ""} in your
            library
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] text-background">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button size="sm" onClick={() => navigate("/add")} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Add Paper
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        {showFilters && (
          <div className="w-64 shrink-0">
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">Filters</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Reading Stage */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Reading Stage
                  </p>
                  <div className="space-y-2">
                    {READING_STAGES.map((stage) => (
                      <div key={stage} className="flex items-center gap-2">
                        <Checkbox
                          id={`stage-${stage}`}
                          checked={selectedStages.includes(stage)}
                          onCheckedChange={() =>
                            toggleFilter(
                              selectedStages,
                              setSelectedStages,
                              stage
                            )
                          }
                        />
                        <Label
                          htmlFor={`stage-${stage}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {stage}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Domain */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Research Domain
                  </p>
                  <div className="space-y-2">
                    {DOMAINS.map((domain) => (
                      <div key={domain} className="flex items-center gap-2">
                        <Checkbox
                          id={`domain-${domain}`}
                          checked={selectedDomains.includes(domain)}
                          onCheckedChange={() =>
                            toggleFilter(
                              selectedDomains,
                              setSelectedDomains,
                              domain
                            )
                          }
                        />
                        <Label
                          htmlFor={`domain-${domain}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {domain}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Impact Score */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Impact Score
                  </p>
                  <div className="space-y-2">
                    {IMPACT_SCORES.map((score) => (
                      <div key={score} className="flex items-center gap-2">
                        <Checkbox
                          id={`impact-${score}`}
                          checked={selectedImpact.includes(score)}
                          onCheckedChange={() =>
                            toggleFilter(
                              selectedImpact,
                              setSelectedImpact,
                              score
                            )
                          }
                        />
                        <Label
                          htmlFor={`impact-${score}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {score}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Date Range */}
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date Added
                  </p>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_RANGES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paper Grid */}
        <div className="flex-1">
          {/* Active filter badges */}
          {activeFilterCount > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedStages.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() =>
                    toggleFilter(selectedStages, setSelectedStages, s)
                  }
                >
                  {s}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              {selectedDomains.map((d) => (
                <Badge
                  key={d}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() =>
                    toggleFilter(selectedDomains, setSelectedDomains, d)
                  }
                >
                  {d}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              {selectedImpact.map((i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() =>
                    toggleFilter(selectedImpact, setSelectedImpact, i)
                  }
                >
                  {i}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              {dateRange !== "all_time" && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setDateRange("all_time")}
                >
                  {DATE_RANGES.find((r) => r.value === dateRange)?.label}
                  <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              Loading papers...
            </div>
          ) : papers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No papers found
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {activeFilterCount > 0
                  ? "Try adjusting your filters"
                  : "Add your first paper to get started"}
              </p>
              {activeFilterCount === 0 && (
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate("/add")}
                >
                  Add Paper
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              {papers.map((paper, index) => (
                <div
                  key={paper.id}
                  className={`group relative flex cursor-pointer items-start gap-4 p-5 transition-colors hover:bg-muted/40 ${
                    index !== papers.length - 1 ? "border-b" : ""
                  }`}
                  onClick={() => {
                    if (paper.file_url) {
                      setViewingPdf(paper.file_url);
                    }
                  }}
                >
                  {/* Colored Dot Indicator */}
                  <div className="mt-1.5 shrink-0">
                    <div 
                      className="h-3.5 w-3.5 rounded-full"
                      style={{
                        backgroundColor: 
                          paper.reading_stage === "Fully Read" || paper.reading_stage === "Notes Completed" 
                            ? "#10b981" // emerald
                            : paper.reading_stage === "Abstract Read" || paper.reading_stage === "Results Analyzed"
                            ? "#94a3b8" // slate
                            : "#3b82f6" // blue for in-progress
                      }}
                    />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-muted-foreground/80">
                        {paper.first_author}, {new Date(paper.date_added).getFullYear()}
                      </p>
                      
                      {/* Action buttons ALWAYS VISIBLE */}
                      <div className="flex shrink-0 items-center text-muted-foreground/60" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/edit/${paper.id}`)}
                          className="rounded p-2 transition-colors hover:bg-slate-200 hover:text-foreground"
                          title="Edit paper"
                        >
                          <BookOpen className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(paper.id)}
                          className="rounded p-2 text-muted-foreground/60 transition-colors hover:bg-red-100 hover:text-red-600"
                          title="Delete paper"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="mt-1 text-lg font-medium leading-snug text-foreground">
                      {paper.title}
                    </h3>
                    
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                       <span className="text-sm text-muted-foreground/80">
                         {paper.domain} • {paper.reading_stage} • {paper.impact_score} • {paper.citation_count} citations
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
