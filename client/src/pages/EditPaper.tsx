import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updatePaper, fetchPaper, type PaperInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

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

export default function EditPaper() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const paperId = parseInt(id || "0", 10);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<PaperInput>({
    title: "",
    first_author: "",
    domain: "",
    reading_stage: "",
    citation_count: 0,
    impact_score: "",
    date_added: "",
  });

  useEffect(() => {
    if (!paperId) return;
    fetchPaper(paperId)
      .then((paper) => {
        setForm({
          title: paper.title,
          first_author: paper.first_author,
          domain: paper.domain,
          reading_stage: paper.reading_stage,
          citation_count: paper.citation_count,
          impact_score: paper.impact_score,
          date_added: paper.date_added.split("T")[0],
        });
      })
      .catch((err: any) => setError(err.message || "Failed to load paper"))
      .finally(() => setInitialLoading(false));
  }, [paperId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.first_author || !form.domain || !form.reading_stage || !form.impact_score) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      if ((form as any).file) {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value as any);
          }
        });
        await updatePaper(paperId, formData);
      } else {
        await updatePaper(paperId, form);
      }
      setSuccess(true);
      setTimeout(() => {
        navigate("/library");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to update paper");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Paper Updated</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Redirecting to library...
        </p>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Paper</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the details of your research paper.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paper Details</CardTitle>
          <CardDescription>
            Modify the details about the research paper.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Paper Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Attention Is All You Need"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* First Author */}
            <div className="space-y-2">
              <Label htmlFor="first_author">First Author Name *</Label>
              <Input
                id="first_author"
                placeholder="e.g. Vaswani"
                value={form.first_author}
                onChange={(e) =>
                  setForm({ ...form, first_author: e.target.value })
                }
              />
            </div>

            {/* Domain & Reading Stage row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Research Domain *</Label>
                <Select
                  value={form.domain}
                  onValueChange={(val) => setForm({ ...form, domain: val })}
                >
                  <SelectTrigger id="domain">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reading Stage *</Label>
                <Select
                  value={form.reading_stage}
                  onValueChange={(val) =>
                    setForm({ ...form, reading_stage: val })
                  }
                >
                  <SelectTrigger id="reading_stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {READING_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Citation Count & Impact Score row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="citation_count">Citation Count</Label>
                <Input
                  id="citation_count"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.citation_count}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      citation_count: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Impact Score *</Label>
                <Select
                  value={form.impact_score}
                  onValueChange={(val) =>
                    setForm({ ...form, impact_score: val })
                  }
                >
                  <SelectTrigger id="impact_score">
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPACT_SCORES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Upload PDF (Optional - Replaces existing if set)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setForm({ ...form, file: e.target.files[0] } as any);
                  }
                }}
              />
            </div>

            {/* Date Added */}
            <div className="space-y-2">
              <Label htmlFor="date_added">Date Added *</Label>
              <Input
                id="date_added"
                type="date"
                value={form.date_added}
                onChange={(e) =>
                  setForm({ ...form, date_added: e.target.value })
                }
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/library")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
