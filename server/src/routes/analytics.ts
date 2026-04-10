import { Router, Request, Response } from "express";
import pool from "../db/index.js";

const router = Router();

const READING_STAGES_ORDERED = [
  "Abstract Read",
  "Introduction Done",
  "Methodology Done",
  "Results Analyzed",
  "Fully Read",
  "Notes Completed",
];

const DOMAINS = [
  "Computer Science",
  "Biology",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Social Sciences",
];

router.get("/", async (_req: Request, res: Response) => {
  try {
    // 1. Funnel data: paper count at each reading stage
    const funnelResult = await pool.query(
      `SELECT reading_stage, COUNT(*)::int as count FROM papers GROUP BY reading_stage`
    );
    const funnelMap = new Map(funnelResult.rows.map((r: any) => [r.reading_stage, r.count]));
    const funnelData = READING_STAGES_ORDERED.map((stage) => ({
      stage,
      count: funnelMap.get(stage) || 0,
    }));

    // 2. Scatter data: all papers with citation count and impact score
    const scatterResult = await pool.query(
      `SELECT id, title, first_author, citation_count, impact_score FROM papers ORDER BY citation_count`
    );
    const scatterData = scatterResult.rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      firstAuthor: r.first_author,
      citationCount: r.citation_count,
      impactScore: r.impact_score,
    }));

    // 3. Stacked bar data: papers by domain and reading stage
    const stackedResult = await pool.query(
      `SELECT domain, reading_stage, COUNT(*)::int as count FROM papers GROUP BY domain, reading_stage`
    );
    const stackedMap = new Map<string, Record<string, number>>();
    for (const row of stackedResult.rows) {
      if (!stackedMap.has(row.domain)) {
        stackedMap.set(row.domain, {});
      }
      stackedMap.get(row.domain)![row.reading_stage] = row.count;
    }
    const stackedBarData = DOMAINS.filter((d) => stackedMap.has(d)).map((domain) => ({
      domain,
      ...Object.fromEntries(READING_STAGES_ORDERED.map((s) => [s, stackedMap.get(domain)?.[s] || 0])),
    }));

    // 4. Summary
    const totalResult = await pool.query(`SELECT COUNT(*)::int as total FROM papers`);
    const total = totalResult.rows[0].total;

    const fullyReadResult = await pool.query(
      `SELECT COUNT(*)::int as count FROM papers WHERE reading_stage = 'Fully Read'`
    );
    const notesCompletedResult = await pool.query(
      `SELECT COUNT(*)::int as count FROM papers WHERE reading_stage = 'Notes Completed'`
    );
    const fullyRead = fullyReadResult.rows[0].count + notesCompletedResult.rows[0].count;

    const avgCitationsResult = await pool.query(
      `SELECT domain, ROUND(AVG(citation_count), 1) as avg_citations FROM papers GROUP BY domain`
    );
    const avgCitationsByDomain: Record<string, number> = {};
    for (const row of avgCitationsResult.rows) {
      avgCitationsByDomain[row.domain] = parseFloat(row.avg_citations);
    }

    const papersByStage: Record<string, number> = {};
    for (const item of funnelData) {
      papersByStage[item.stage] = item.count;
    }

    const summary = {
      totalPapers: total,
      papersByStage,
      avgCitationsByDomain,
      completionRate: total > 0 ? Math.round((fullyRead / total) * 100) : 0,
    };

    res.json({ funnelData, scatterData, stackedBarData, summary });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
