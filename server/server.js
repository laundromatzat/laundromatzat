// backend/server.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const db = require("./database.js");
const pdfParse = require("pdf-parse");
const fetch = require("node-fetch");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const port = process.env.PORT || 4000;
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.mjs");
const fs = require("fs");

// Security Middleware (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://generativelanguage.googleapis.com",
          process.env.LM_STUDIO_API_URL || "http://localhost:1234",
        ],
        imgSrc: ["'self'", "data:", "blob:", "https:", "http:"], // Allow images from various sources
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // React/Vite often needs unsafe-inline/eval in dev, try to tighten for prod
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Often causes issues with images/PDFs
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use("/api", limiter); // Apply to API routes

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://laundromatzat.com",
  "https://www.laundromatzat.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // Warn but allow (for now) to unblock user if the origin list is slightly off
        console.warn(`Untrusted Origin: ${origin}`);
        return callback(null, true);
        // return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "X-Requested-With",
      "Accept",
    ],
  })
);
app.use(express.json({ limit: "10mb" })); // Increased from default 100kb to handle compressed images

// Multer setup for in-memory file storage
// Multer setup for in-memory file storage (for PDF processing)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Multer setup for Avatar uploads (Disk Storage)
// Multer setup for Avatar uploads (Disk Storage)
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads/avatars");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Unique filename: user-{id}-{timestamp}.ext
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

// Serve uploads directory
// Serve uploads directory with proper headers for COOP/COEP
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// LM Studio API configuration
const LM_STUDIO_API = process.env.LM_STUDIO_API_URL || "http://localhost:1234";
const MODEL_NAME = process.env.LM_STUDIO_MODEL_NAME || "qwen3-vl-8b-instruct";

// Health check endpoint for wait-on
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// --- Authentication ---
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-prod";

// Auth middleware
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Now contains role
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Rate limiter for file uploads to prevent DoS
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 uploads per 15 minutes
  message: "Too many file uploads from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
};
// Register endpoint
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, hashedPassword]
    );
    const newUserId = result.rows[0].id;
    // New users are NOT approved by default and have role 'user'
    // Do NOT return a token. Force them to wait for approval.
    res.status(201).json({
      message: "Registration successful. Please wait for admin approval.",
      user: { id: newUserId, username, role: "user", is_approved: false },
    });

    // Send Admin Notification (Async - fire and forget)
    const { sendAdminNotification } = require("./utils/email");
    sendAdminNotification({ id: newUserId, username }).catch((err) =>
      console.error("Email trigger failed:", err)
    );
  } catch (err) {
    if (err.message.includes("unique constraint") || err.code === "23505") {
      return res.status(400).json({ error: "Username already exists" });
    }
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];

    console.log("Login attempt for:", username);
    console.log("User found:", user ? "YES" : "NO");

    if (!user) {
      console.log("User not found in DB");
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log("Password mismatch or user missing");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_approved) {
      console.log("User not approved");
      return res
        .status(403)
        .json({ error: "Account pending approval. Please contact an admin." });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error("Login error details:", err);
    res.status(500).json({ error: "Login failed: " + err.message });
  }
});

// Get Current User endpoint
app.get("/api/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch latest user data from DB to get profile picture
    const userQuery = await db.query(
      "SELECT id, username, profile_picture, role, is_approved FROM users WHERE id = $1",
      [decoded.id]
    );
    const user = userQuery.rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    // Optional: Enforce approval check on every request?
    // if (!user.is_approved) return res.status(403).json({ error: "Account pending" });

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Update Profile endpoint
app.put("/api/auth/me", requireAuth, async (req, res) => {
  const { username, password } = req.body;
  const userId = req.user.id;

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET username = $1, password = $2 WHERE id = $3",
        [username, hashedPassword, userId]
      );
    } else {
      await db.query("UPDATE users SET username = $1 WHERE id = $2", [
        username,
        userId,
      ]);
    }

    // Fetch updated user
    const result = await db.query(
      "SELECT id, username, profile_picture FROM users WHERE id = $1",
      [userId]
    );
    const user = result.rows[0];
    res.json({ user, message: "Profile updated successfully" });
  } catch (err) {
    if (err.message.includes("unique constraint") || err.code === "23505") {
      return res.status(400).json({ error: "Username already exists" });
    }
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Upload Avatar endpoint
app.post(
  "/api/auth/upload-avatar",
  requireAuth,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // File path relative to server URL
    const fileUrl = `/uploads/avatars/${req.file.filename}`;

    try {
      await db.query("UPDATE users SET profile_picture = $1 WHERE id = $2", [
        fileUrl,
        req.user.id,
      ]);

      res.json({
        profile_picture: fileUrl,
        message: "Avatar uploaded successfully",
      });
    } catch (err) {
      console.error("Avatar DB update failed:", err);
      res.status(500).json({ error: "Failed to update profile picture" });
    }
  }
);

// --- Links API Endpoints ---

// GET all links for the user
// --- Links API Endpoints ---

// GET all links for the user
app.get("/api/links", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM links WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    const links = result.rows.map((row) => ({
      ...row,
      tags: JSON.parse(row.tags || "[]"),
    }));
    res.json(links);
  } catch (err) {
    console.error("Failed to fetch links:", err.message);
    res.status(500).json({ error: "Failed to fetch links" });
  }
});

// POST a new link
app.post("/api/links", requireAuth, async (req, res) => {
  const { title, url, description, tags, image_url } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: "Title and URL are required" });
  }

  try {
    const result = await db.query(
      "INSERT INTO links (user_id, title, url, description, tags, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [
        req.user.id,
        title,
        url,
        description || "",
        JSON.stringify(tags || []),
        image_url || "",
      ]
    );
    res.status(201).json({
      id: result.rows[0].id,
      user_id: req.user.id,
      title,
      url,
      description,
      tags: tags || [],
      image_url,
    });
  } catch (err) {
    console.error("Failed to create link:", err.message);
    res.status(500).json({ error: "Failed to create link" });
  }
});

// PUT (update) a link
app.put("/api/links/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, url, description, tags, image_url } = req.body;

  try {
    const result = await db.query(
      "UPDATE links SET title = $1, url = $2, description = $3, tags = $4, image_url = $5 WHERE id = $6 AND user_id = $7",
      [
        title,
        url,
        description || "",
        JSON.stringify(tags || []),
        image_url || "",
        id,
        req.user.id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Link not found or unauthorized" });
    }

    res.json({ message: "Link updated successfully" });
  } catch (err) {
    console.error("Failed to update link:", err.message);
    res.status(500).json({ error: "Failed to update link" });
  }
});

// DELETE a link
app.delete("/api/links/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM links WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Link not found or unauthorized" });
    }

    res.json({ message: "Link deleted successfully" });
  } catch (err) {
    console.error("Failed to delete link:", err.message);
    res.status(500).json({ error: "Failed to delete link" });
  }
});

// --- Dev Tasks API Endpoints ---

// GET all dev tasks for the user
app.get("/api/dev-tasks", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM dev_tasks WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch dev tasks:", err.message);
    res.status(500).json({ error: "Failed to fetch dev tasks" });
  }
});

// POST a new dev task
app.post("/api/dev-tasks", requireAuth, async (req, res) => {
  const { title, description, category, priority, status, tags, ai_prompt, notes } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO dev_tasks (user_id, title, description, category, priority, status, tags, ai_prompt, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        req.user.id,
        title,
        description || null,
        category || 'feature',
        priority || 'medium',
        status || 'new',
        tags || null,
        ai_prompt || null,
        notes || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to create dev task:", err.message);
    res.status(500).json({ error: "Failed to create dev task" });
  }
});

// PUT (update) a dev task
app.put("/api/dev-tasks/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, description, category, priority, status, tags, ai_prompt, notes } = req.body;

  try {
    const result = await db.query(
      `UPDATE dev_tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           priority = COALESCE($4, priority),
           status = COALESCE($5, status),
           tags = COALESCE($6, tags),
           ai_prompt = COALESCE($7, ai_prompt),
           notes = COALESCE($8, notes),
           updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [title, description, category, priority, status, tags, ai_prompt, notes, id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Dev task not found or unauthorized" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to update dev task:", err.message);
    res.status(500).json({ error: "Failed to update dev task" });
  }
});

// DELETE a dev task
app.delete("/api/dev-tasks/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM dev_tasks WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Dev task not found or unauthorized" });
    }

    res.json({ message: "Dev task deleted successfully" });
  } catch (err) {
    console.error("Failed to delete dev task:", err.message);
    res.status(500).json({ error: "Failed to delete dev task" });
  }
});

// --- Admin Routes ---

// List all users
app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, role, is_approved, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Approve user
app.patch(
  "/api/admin/users/:id/approve",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      await db.query("UPDATE users SET is_approved = TRUE WHERE id = $1", [id]);
      res.json({ message: "User approved" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to approve user" });
    }
  }
);

// Delete/Reject user
app.delete(
  "/api/admin/users/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      // Prevent deleting self
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: "Cannot delete yourself" });
      }
      await db.query("DELETE FROM users WHERE id = $1", [id]);
      res.json({ message: "User deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);

// IMPORTANT: Emergency Password Reset (DISABLED FOR SECURITY)
// Usage: POST /api/admin/reset-password-emergency { "secret_key": "YOUR_SECRET", "username": "stephen", "new_password": "..." }
/*
app.post("/api/admin/reset-password-emergency", async (req, res) => {
  const { secret_key, username, new_password } = req.body;
  const EMERGENCY_SECRET =
    process.env.EMERGENCY_SECRET || "temp_emergency_reset_2025";

  if (secret_key !== EMERGENCY_SECRET) {
    return res.status(403).json({ error: "Invalid secret key" });
  }

  try {
    const hashedPassword = await bcrypt.hash(new_password, 10);
    // Force role=admin and is_approved=true as well
    await db.query(
      `
      UPDATE users 
      SET password = $1, role = 'admin', is_approved = TRUE 
      WHERE username = $2
      RETURNING id, username, role
    `,
      [hashedPassword, username]
    );

    res.json({ message: "Admin access restored successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});
*/

// IMPORTANT: Hard Reset Users (Clear all and create one admin) (DISABLED FOR SECURITY)
/*
app.post("/api/admin/hard-reset-users", async (req, res) => {
  const { secret_key, admin_password } = req.body;
  const EMERGENCY_SECRET =
    process.env.EMERGENCY_SECRET || "temp_emergency_reset_2025";

  if (secret_key !== EMERGENCY_SECRET) {
    return res.status(403).json({ error: "Invalid secret key" });
  }

  try {
    // 1. Delete Dependent Data (Manual Cascade)
    await db.query("DELETE FROM paychecks");
    await db.query("DELETE FROM links");

    // 2. Delete ALL users
    await db.query("DELETE FROM users");

    // 3. Create the new Super Admin
    const hashedPassword = await bcrypt.hash(admin_password, 10);
    await db.query(
      "INSERT INTO users (username, password, role, is_approved) VALUES ($1, $2, $3, $4)",
      ["laundromatzat-admin", hashedPassword, "admin", true]
    );

    res.json({ message: "All users wiped. Created 'laundromatzat-admin'." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset users: " + err.message });
  }
});
*/

// --- API Endpoints ---

// GET all paychecks for the user
// GET all paychecks for the user
app.get("/paychecks", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM paychecks WHERE user_id = $1 ORDER BY payPeriodStart DESC",
      [req.user.id]
    );
    const paychecks = result.rows.map((row) => ({
      ...row,
      paidHours: JSON.parse(row.paidhours || "[]"), // Postgres lowecases column names in result objects usually
      bankedHours: JSON.parse(row.bankedhours || "[]"),
      userReportedHours: JSON.parse(row.userreportedhours || "{}"),
    }));
    res.json(paychecks);
  } catch (err) {
    console.error("Failed to fetch paychecks:", err.message);
    res.status(500).json({ error: "Failed to fetch paychecks" });
  }
});

// DELETE all paychecks for the user
app.delete("/paychecks", requireAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM paychecks WHERE user_id = $1", [req.user.id]);
    console.log(`Database cleared for user ${req.user.id} via API.`);
    res.json({ message: "All data cleared successfully" });
  } catch (err) {
    console.error("Failed to clear data:", err.message);
    res.status(500).json({ error: "Failed to clear data" });
  }
});

// UPDATE user reported hours
app.put("/paychecks/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { userReportedHours } = req.body;

  try {
    const result = await db.query(
      "UPDATE paychecks SET userReportedHours = $1 WHERE id = $2 AND user_id = $3",
      [JSON.stringify(userReportedHours), id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Paycheck not found or unauthorized" });
    }

    res.json({ message: "Updated successfully" });
  } catch (err) {
    console.error("Failed to update paycheck:", err.message);
    res.status(500).json({ error: "Failed to update paycheck" });
  }
});

// POST a new paycheck PDF for analysis
const { convertPdfToImages } = require("./pdf_renderer");

// ... (imports)

// ... (middleware and setup)

// POST a new paycheck PDF for analysis
app.post(
  "/analyze",
  requireAuth,
  uploadLimiter,
  upload.single("paystub"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    try {
      console.log("File received:", {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      // Save the PDF locally
      const uploadsDir = path.join(__dirname, "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }
      // Generate safe filename to prevent path traversal attacks
      const fileExt = path.extname(req.file.originalname);
      const safeFilename = `${crypto.randomUUID()}${fileExt}`;
      const filePath = path.join(uploadsDir, safeFilename);
      fs.writeFileSync(filePath, req.file.buffer);
      console.log(`Saved PDF to: ${filePath}`);

      // 1. Convert PDF to Image (First page only)
      console.log("Converting PDF to image...");
      console.log("File details:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferType: req.file.buffer
          ? req.file.buffer.constructor.name
          : "undefined",
        bufferLength: req.file.buffer ? req.file.buffer.length : 0,
      });

      let outputImages;
      try {
        // Use custom renderer
        outputImages = await convertPdfToImages(req.file.buffer, {
          page_numbers: [1],
        });
      } catch (conversionErr) {
        console.error("PDF Conversion Failed:", conversionErr);
        throw new Error(`PDF Conversion Failed: ${conversionErr.message}`);
      }

      if (!outputImages || outputImages.length === 0) {
        throw new Error("Failed to convert PDF to image: No images returned.");
      }

      // --- PATH A: DETERMINISTIC PARSING (Digital PDFs) ---
      console.log("Attempting deterministic parsing...");
      const { parsePdfDeterministically } = require("./deterministic_parser");
      const deterministicData = await parsePdfDeterministically(
        req.file.buffer
      );

      if (deterministicData) {
        console.log("Deterministic parsing successful! Skipping LLM.");

        // Save to database directly
        const result = await db.query(
          `INSERT INTO paychecks (user_id, payPeriodStart, payPeriodEnd, paidHours, bankedHours, userReportedHours)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            req.user.id,
            deterministicData.payPeriodStart,
            deterministicData.payPeriodEnd,
            JSON.stringify(deterministicData.paidHours),
            JSON.stringify(deterministicData.bankedHours),
            JSON.stringify({}),
          ]
        );

        const responseData = {
          id: result.rows[0].id,
          payPeriodStart: deterministicData.payPeriodStart,
          payPeriodEnd: deterministicData.payPeriodEnd,
          paidHours: deterministicData.paidHours,
          bankedHours: deterministicData.bankedHours,
          userReportedHours: {},
        };

        console.log(
          "DEBUG: Final response data (Deterministic) sent to frontend:",
          JSON.stringify(responseData, null, 2)
        );
        return res.status(201).json(responseData);
      }

      console.log(
        "Deterministic parsing failed or not applicable. Falling back to Vision LLM..."
      );

      // --- RESEARCH PHASE: Extract Raw Text for Grounding ---
      let extractedTextContext = "";
      try {
        const pdfData = await pdfParse(req.file.buffer);
        extractedTextContext = pdfData.text.trim();
        console.log("Extracted raw text from PDF for LLM grounding.");
      } catch (textErr) {
        console.warn(
          "Failed to extract raw text for grounding:",
          textErr.message
        );
      }
      // --- END PATH A ---

      // DEBUG: Save the raw PDF to disk for layout analysis
      fs.writeFileSync("debug_last.pdf", req.file.buffer);
      console.log("DEBUG: Saved debug_last.pdf");

      // DEBUG: Attempt to extract text coordinates (to see if we can use deterministic parsing)
      try {
        const pdfDoc = await pdfjsLib.getDocument(
          new Uint8Array(req.file.buffer)
        ).promise;
        const page = await pdfDoc.getPage(1);
        const textContent = await page.getTextContent();

        let layoutLog = "--- PDF TEXT LAYOUT ANALYSIS ---\n";
        textContent.items.forEach((item) => {
          // item.transform is [scaleX, skewY, skewX, scaleY, x, y]
          // PDF coordinates: (0,0) is usually bottom-left.
          const x = Math.round(item.transform[4]);
          const y = Math.round(item.transform[5]);
          const str = item.str;
          if (str.trim()) {
            layoutLog += `X: ${x.toString().padEnd(4)} | Y: ${y.toString().padEnd(4)} | Text: "${str}"\n`;
          }
        });

        fs.writeFileSync("debug_text_layout.txt", layoutLog);
        console.log(
          "DEBUG: Saved debug_text_layout.txt with text coordinates."
        );
      } catch (e) {
        console.error("DEBUG: Failed to extract text layout:", e);
      }

      const base64Image = outputImages[0];
      console.log(
        "PDF converted to image successfully. Image length:",
        base64Image.length
      );

      // 2. Create the prompt for the Vision LLM
      const prompt = `You are a vision OCR model that extracts data from City and County of San Francisco paystubs.
Return ONLY a single JSON object with this shape:

{
  "pay_period_start": "YYYY-MM-DD",
  "pay_period_end": "YYYY-MM-DD",
  "total_current_hours": number | null,
  "hours_paid": [
    { "category": "string", "hours": number }
  ],
  "banked_hours": [
    { "category": "string", "hours": number }
  ]
}

RULES (CRITICAL):

1. Dates
   - Read “Pay Period Begin Date” and “Pay Period End Date”.
   - Use these as authoritative.
   - If years disagree anywhere on the page, choose the most recent (largest) year.
   - Reject any year < 2024 unless ALL visible dates show that same year.
   - Output in YYYY-MM-DD.

2. total_current_hours
   - In the “HOURS AND EARNINGS” section, find the “TOTAL” line.
   - The first numeric in the “Current” part of that line is total_current_hours.
   - If you cannot find it, set "total_current_hours" to null (do not guess).

3. Hours & Earnings → hours_paid
   - Find the “HOURS AND EARNINGS” section.
   - Treat everything under “----- YTD -----” as completely forbidden for hours_paid.
   - For each row (RegularPay, OvertimStr, StndBy$15, Legal Hol, CTPay, Vacation, Sick Pay, EduLeavPay, UAPD Reimb, etc):
       a) Identify the value directly under the Current HOURS column, if any.
       b) If that cell is blank or ambiguous, treat current hours as 0 and DO NOT include that row.
       c) It is valid for RegularPay to have 0 current hours and then be omitted from hours_paid.

   Sanity constraints:
   - If total_current_hours is not null:
       • For any row, if |hours| > total_current_hours, treat it as YTD and exclude it.
       • After selecting rows, let S = sum of their hours.
       • If S > total_current_hours, drop rows starting from the bottom until S <= total_current_hours.
   - If total_current_hours is null:
       • Typical pay periods are 1–2 weeks; any |hours| > 200 is almost certainly YTD and must be excluded.
   - On CCSF paystubs, many rows (Legal Hol, CTPay, Vacation, Sick Pay, EduLeavPay, UAPD Reimb) are often YTD-only; if their Current HOURS cell is blank, they MUST be excluded.

   Final format:
   "hours_paid": [
     { "category": "DescriptionTextExactlyAsSeen", "hours": number }
   ]

4. Paid time off → banked_hours
   - Read the “PAID TIME OFF” / “Balance” table.
   - For each category (Vacation, Sick Leave, Floating Holiday, Public Health Emergency Leave, Compensatory Time Off, Management Leave):
       • If a numeric Balance value is visible, use it.
       • If the balance is blank or unreadable, omit that category.

If any required field cannot be read, use null for that field. Do NOT include any text outside the JSON object.

CONTEXT DATA (Grounding):
The following text was extracted programmatically from the PDF file. 
1. Use this text to verify numbers and spelling.
2. If the image is unclear, trust this text if it makes sense in context.
3. IGNORE this text if it seems completely unrelated or garbled (OCR noise).

EXTRACTED TEXT START:
${extractedTextContext}
EXTRACTED TEXT END
`;

      // DEBUG: Save the image to disk to verify quality
      const base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync("debug_last_capture.png", base64Data, "base64");
      console.log(
        "DEBUG: Saved debug_last_capture.png to check image quality."
      );

      // 3. Call LM Studio Vision API
      console.log(
        `Sending image payload to LM Studio Vision model (${LM_STUDIO_API})...`
      );

      const apiResponse = await fetch(`${LM_STUDIO_API}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that outputs only JSON.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          model: MODEL_NAME, // Ensure the user has loaded a Vision model!
          temperature: 0.0,
          max_tokens: 2000,
          stream: false,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(
          `LM Studio API error: ${apiResponse.status} ${apiResponse.statusText}`
        );
      }

      const llmResponse = await apiResponse.json();
      console.log("LM Studio response received");

      // Parse the content from the response
      const content = llmResponse.choices[0].message.content;
      // Attempt to clean markdown code blocks if present
      let jsonString = content.replace(/```json\n?|\n?```/g, "").trim();

      // --- JSON REPAIR STRATEGY ---
      // The model often hallucinates extra fields or text after the main object.
      // We will try to find the end of the 'banked_hours' array and cut it off there.
      const bankedHoursIndex = jsonString.indexOf('"banked_hours"');
      if (bankedHoursIndex !== -1) {
        // Find the start of the array
        const arrayStartIndex = jsonString.indexOf("[", bankedHoursIndex);
        if (arrayStartIndex !== -1) {
          // Find the matching closing bracket for this array
          let openBrackets = 0;
          let arrayEndIndex = -1;

          for (let i = arrayStartIndex; i < jsonString.length; i++) {
            if (jsonString[i] === "[") openBrackets++;
            if (jsonString[i] === "]") openBrackets--;

            if (openBrackets === 0) {
              arrayEndIndex = i;
              break;
            }
          }

          if (arrayEndIndex !== -1) {
            // We found the end of banked_hours array.
            // The JSON object should end shortly after.
            // We will force-close the object here to ignore trailing garbage.
            // Construct: { ... "banked_hours": [...] }
            // But we need to make sure we keep the front part.

            // Check if there is a closing } after the array
            const nextClosingBrace = jsonString.indexOf("}", arrayEndIndex);
            if (nextClosingBrace !== -1) {
              // Ideally, we take up to that brace
              jsonString = jsonString.substring(0, nextClosingBrace + 1);
            } else {
              // If missing, we append it
              jsonString = jsonString.substring(0, arrayEndIndex + 1) + "\n}";
            }
            console.log(
              "DEBUG: Repaired JSON string by truncating after banked_hours."
            );
          }
        }
      }
      // ---------------------------

      let parsedData;
      try {
        parsedData = JSON.parse(jsonString);
      } catch (e) {
        console.error("Failed to parse JSON from LLM:", jsonString);
        throw new Error("Invalid JSON received from LLM");
      }

      // Normalize keys if the LLM returns the PascalCase format
      if (parsedData.PayPeriodBeginDate) {
        parsedData = {
          payPeriodStart: parsedData.PayPeriodBeginDate,
          payPeriodEnd: parsedData.PayPeriodEndDate,
          paidHours: parsedData.HourlyBreakdown || [],
          bankedHours: parsedData.BankedHoursBreakdown || [],
          ...parsedData,
        };
      }

      // Helper function to normalize dates to YYYY-MM-DD
      const normalizeDate = (dateStr) => {
        if (!dateStr) return null;
        // Handle MM-DD-YYYY or MM/DD/YYYY
        const match = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (match) {
          const [_, month, day, year] = match;
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
        // Return original if it already looks like YYYY-MM-DD or otherwise
        return dateStr;
      };

      // Helper function to clean hours (parse string -> float -> truncate)
      // Used for banked_hours which don't have a strict "current period" cap
      const cleanGenericHours = (data) => {
        let hoursArray = [];
        if (data && typeof data === "object" && !Array.isArray(data)) {
          hoursArray = Object.entries(data).map(([key, value]) => ({
            category: key,
            hours: value,
          }));
        } else if (Array.isArray(data)) {
          hoursArray = data;
        } else {
          return [];
        }

        return hoursArray.map((entry) => {
          const category = entry.category || entry.Category || "Unknown";
          let hoursVal = entry.hours || entry.Hours;
          if (typeof hoursVal === "string")
            hoursVal = parseFloat(hoursVal.replace(/,/g, ""));

          let finalHours = 0;
          if (typeof hoursVal === "number" && !isNaN(hoursVal)) {
            finalHours = Math.floor(hoursVal * 100) / 100;
          }
          return { category, hours: finalHours };
        });
      };

      // New Heuristic Cleaner for Paid Hours (User Provided Logic + Robustness)
      const cleanHoursPaid = (data) => {
        const { total_current_hours, hours_paid } = data;
        const MAX_PERIOD_HOURS = 200; // Hard cap for a single pay period

        const total =
          typeof total_current_hours === "number"
            ? Math.abs(total_current_hours)
            : null;
        // If we have a valid total, use it as the cap. Otherwise use the hard max.
        let cap = total && total > 0 ? total : MAX_PERIOD_HOURS;

        let sum = 0;
        const cleaned = [];

        // Normalize input to array
        const list = Array.isArray(hours_paid) ? hours_paid : [];

        for (const row of list) {
          // Robust parsing
          let val = row.hours;
          if (typeof val === "string") val = parseFloat(val.replace(/,/g, ""));
          const h = Number(val);

          if (!Number.isFinite(h)) continue;

          // 1. Drop obviously YTD-ish or absurd values (exceeding the cap)
          if (Math.abs(h) > cap + 0.01) continue;

          // 2. Enforce sum constraint when total_current_hours is known
          // If adding this row would exceed the total, skip it (it's likely a YTD value or duplicate)
          if (total && Math.abs(sum + h) > cap + 0.01) continue;

          // Round to 2 decimals
          const finalH = Math.floor(h * 100) / 100;

          cleaned.push({
            category: row.category || row.Category || "Unknown",
            hours: finalH,
          });
          sum += finalH;
        }

        return cleaned;
      };

      // Map snake_case to camelCase if needed
      const payPeriodStart = normalizeDate(
        parsedData.payPeriodStart || parsedData.pay_period_start
      );
      const payPeriodEnd = normalizeDate(
        parsedData.payPeriodEnd || parsedData.pay_period_end
      );

      // Clean up the hours data using the new logic
      const paidHours = cleanHoursPaid(parsedData);
      const bankedHours = cleanGenericHours(
        parsedData.bankedHours || parsedData.banked_hours || []
      );

      // 4. Save to database
      // 4. Save to database
      // Ensure we have valid dates before inserting
      if (!payPeriodStart || !payPeriodEnd) {
        throw new Error(
          `Invalid date format received from LLM. Start: ${parsedData.payPeriodStart}, End: ${parsedData.payPeriodEnd}`
        );
      }

      const result = await db.query(
        `INSERT INTO paychecks (user_id, payPeriodStart, payPeriodEnd, paidHours, bankedHours, userReportedHours)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          req.user.id,
          payPeriodStart,
          payPeriodEnd,
          JSON.stringify(paidHours),
          JSON.stringify(bankedHours),
          JSON.stringify({}), // Default empty user hours
        ]
      );

      // 5. Return the new data to the frontend
      // IMPORTANT: Return the CLEANED data (paidHours, bankedHours) which has numbers, not the raw LLM strings
      const responseData = {
        id: result.rows[0].id,
        payPeriodStart,
        payPeriodEnd,
        paidHours, // <--- Correct key, cleaned data (numbers)
        bankedHours, // <--- Correct key, cleaned data (numbers)
        userReportedHours: {},
      };

      console.log(
        "DEBUG: Final response data sent to frontend:",
        JSON.stringify(responseData, null, 2)
      );

      // Removed debug_pdf_text.txt writing as we no longer have text extraction

      res.status(201).json(responseData);
    } catch (err) {
      console.error("Analysis failed:", err.message);
      res
        .status(500)
        .json({ error: "Failed to analyze paycheck with the LM Studio API." });
    }
  }
);
// --- Mediscribe API Endpoints ---

app.get("/api/mediscribe/examples", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM mediscribe_examples WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({
      examples: result.rows.map((r) => ({
        id: r.id.toString(),
        original: r.original_text,
        rewritten: r.rewritten_text,
        tags: JSON.parse(r.style_tags || "[]"),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/mediscribe/examples", requireAuth, async (req, res) => {
  const { original, rewritten, tags } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO mediscribe_examples (user_id, original_text, rewritten_text, style_tags) VALUES ($1, $2, $3, $4) RETURNING id",
      [req.user.id, original, rewritten, JSON.stringify(tags || [])]
    );
    res.json({ id: result.rows[0].id, message: "Example saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/mediscribe/examples/:id", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM mediscribe_examples WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Example not found" });
    }
    res.json({ message: "Example deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Public Health API Endpoints ---

app.get("/api/public-health/docs", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM public_health_docs WHERE user_id = $1 ORDER BY uploaded_at DESC",
      [req.user.id]
    );
    res.json({
      docs: result.rows.map((r) => ({
        id: r.id.toString(),
        filename: r.filename,
        rag_store_name: r.rag_store_name,
        analysis: JSON.parse(r.analysis_result_json || "null"),
        tags: JSON.parse(r.tags || "[]"),
        category: r.category,
        version: r.version,
        uploaded_at: r.uploaded_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/public-health/docs", requireAuth, async (req, res) => {
  const {
    filename,
    rag_store_name,
    analysis_result_json,
    tags,
    category,
    version,
  } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO public_health_docs (user_id, filename, rag_store_name, analysis_result_json, tags, category, version) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [
        req.user.id,
        filename,
        rag_store_name,
        JSON.stringify(analysis_result_json),
        JSON.stringify(tags || []),
        category || null,
        version || null,
      ]
    );
    res.json({ id: result.rows[0].id, message: "Document saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Neuroaesthetic API Endpoints ---

app.get("/api/neuroaesthetic/preferences", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT sensitivities, colorPreferences, designGoals FROM neuroaesthetic_preferences WHERE user_id = $1",
      [req.user.id]
    );
    const row = result.rows[0];
    if (!row) {
      // Return defaults if not found
      res.json({
        sensitivities: "",
        colorPreferences: "",
        designGoals: "General Well-being",
      });
    } else {
      res.json(row);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/neuroaesthetic/preferences", requireAuth, async (req, res) => {
  const { sensitivities, colorPreferences, designGoals } = req.body;
  try {
    // Upsert for Postgres
    await db.query(
      `INSERT INTO neuroaesthetic_preferences (user_id, sensitivities, colorPreferences, designGoals, updated_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET sensitivities = $2, colorPreferences = $3, designGoals = $4, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, sensitivities, colorPreferences, designGoals]
    );
    res.json({ message: "Preferences saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/neuroaesthetic/history", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM neuroaesthetic_history WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({
      history: result.rows.map((r) => ({
        id: r.id,
        originalImage: r.original_image_url,
        generatedImage: r.generated_image_url,
        analysis: JSON.parse(r.analysis_json || "null"),
        timestamp: r.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/neuroaesthetic/history", requireAuth, async (req, res) => {
  const { originalImage, generatedImage, analysis, preferencesSnapshot } =
    req.body;
  try {
    const result = await db.query(
      "INSERT INTO neuroaesthetic_history (user_id, original_image_url, generated_image_url, analysis_json, preferences_snapshot_json) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [
        req.user.id,
        originalImage,
        generatedImage,
        JSON.stringify(analysis),
        JSON.stringify(preferencesSnapshot),
      ]
    );
    res.json({ id: result.rows[0].id, message: "History saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Pin Pals API Endpoints ---

app.get("/api/pin-pals/gallery", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM pin_pals_gallery WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({
      pins: result.rows.map((r) => ({
        id: r.id,
        imageUrl: r.image_url,
        petType: r.pet_type,
        petCount: r.pet_count,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/pin-pals/gallery", requireAuth, async (req, res) => {
  const { imageUrl, petType, petCount } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO pin_pals_gallery (user_id, image_url, pet_type, pet_count) VALUES ($1, $2, $3, $4) RETURNING id",
      [req.user.id, imageUrl, petType, petCount]
    );
    res.json({ id: result.rows[0].id, message: "Pin saved to gallery" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Fallback Route (API Only) ---
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
