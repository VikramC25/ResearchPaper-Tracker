import { Router, Request, Response } from "express";
import pool from "../db/index.js";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Valid enum values
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

async function handleFileUpload(file: Express.Multer.File | undefined): Promise<string | null> {
  if (!file || !supabase) return null;
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from("papers")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
    
  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error("Failed to upload file to storage");
  }
  
  const { data: publicData } = supabase.storage.from("papers").getPublicUrl(fileName);
  return publicData.publicUrl;
}

// POST /api/papers — Create a new paper
router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const {
      title,
      first_author,
      domain,
      reading_stage,
      citation_count,
      impact_score,
      date_added,
    } = req.body;

    // Validation
    if (!title || !first_author || !domain || !reading_stage || !impact_score || !date_added) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    if (!DOMAINS.includes(domain)) {
      res.status(400).json({ error: `Invalid domain. Must be one of: ${DOMAINS.join(", ")}` });
      return;
    }
    if (!READING_STAGES.includes(reading_stage)) {
      res.status(400).json({ error: `Invalid reading stage. Must be one of: ${READING_STAGES.join(", ")}` });
      return;
    }
    if (!IMPACT_SCORES.includes(impact_score)) {
      res.status(400).json({ error: `Invalid impact score. Must be one of: ${IMPACT_SCORES.join(", ")}` });
      return;
    }

    let file_url = null;
    if (req.file) {
      try {
        file_url = await handleFileUpload(req.file);
      } catch (uploadErr: any) {
        res.status(500).json({ error: uploadErr.message });
        return;
      }
    }

    const result = await pool.query(
      `INSERT INTO papers (title, first_author, domain, reading_stage, citation_count, impact_score, date_added, file_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, first_author, domain, reading_stage, citation_count || 0, impact_score, date_added, file_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating paper:", err);
    res.status(500).json({ error: "Failed to create paper" });
  }
});

// GET /api/papers — List papers with optional filters
router.get("/", async (req: Request, res: Response) => {
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Reading stage filter (comma-separated, multiple)
    if (req.query.reading_stage) {
      const stages = (req.query.reading_stage as string).split(",").map((s) => s.trim());
      const placeholders = stages.map(() => `$${paramIndex++}`);
      conditions.push(`reading_stage IN (${placeholders.join(",")})`);
      params.push(...stages);
    }

    // Domain filter (comma-separated, multiple)
    if (req.query.domain) {
      const domains = (req.query.domain as string).split(",").map((s) => s.trim());
      const placeholders = domains.map(() => `$${paramIndex++}`);
      conditions.push(`domain IN (${placeholders.join(",")})`);
      params.push(...domains);
    }

    // Impact score filter (comma-separated, multiple)
    if (req.query.impact_score) {
      const scores = (req.query.impact_score as string).split(",").map((s) => s.trim());
      const placeholders = scores.map(() => `$${paramIndex++}`);
      conditions.push(`impact_score IN (${placeholders.join(",")})`);
      params.push(...scores);
    }

    // Date range filter
    if (req.query.date_range && req.query.date_range !== "all_time") {
      const now = new Date();
      let cutoff: Date;

      switch (req.query.date_range) {
        case "this_week":
          cutoff = new Date(now);
          cutoff.setDate(now.getDate() - 7);
          break;
        case "this_month":
          cutoff = new Date(now);
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case "last_3_months":
          cutoff = new Date(now);
          cutoff.setMonth(now.getMonth() - 3);
          break;
        default:
          cutoff = new Date(0);
      }

      conditions.push(`date_added >= $${paramIndex++}`);
      params.push(cutoff.toISOString().split("T")[0]);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM papers ${whereClause} ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching papers:", err);
    res.status(500).json({ error: "Failed to fetch papers" });
  }
});

// GET /api/papers/:id — Get single paper
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM papers WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching paper:", err);
    res.status(500).json({ error: "Failed to fetch paper" });
  }
});

// PUT /api/papers/:id — Update a paper
router.put("/:id", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const {
      title,
      first_author,
      domain,
      reading_stage,
      citation_count,
      impact_score,
      date_added,
    } = req.body;

    let file_url: string | null = null;
    let urlUpdatesql = "";
    const params: any[] = [title, first_author, domain, reading_stage, citation_count, impact_score, date_added, req.params.id];

    if (req.file) {
      try {
        file_url = await handleFileUpload(req.file);
        urlUpdatesql = ", file_url = $9";
        params.push(file_url);
      } catch (uploadErr: any) {
        res.status(500).json({ error: uploadErr.message });
        return;
      }
    }

    const result = await pool.query(
      `UPDATE papers 
       SET title = $1, first_author = $2, domain = $3, reading_stage = $4,
           citation_count = $5, impact_score = $6, date_added = $7${urlUpdatesql}
       WHERE id = $8
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating paper:", err);
    res.status(500).json({ error: "Failed to update paper" });
  }
});

// DELETE /api/papers/:id — Delete a paper
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM papers WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }
    res.json({ message: "Paper deleted", paper: result.rows[0] });
  } catch (err) {
    console.error("Error deleting paper:", err);
    res.status(500).json({ error: "Failed to delete paper" });
  }
});

export default router;
