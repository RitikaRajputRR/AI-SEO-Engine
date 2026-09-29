const express = require("express");
const cors = require("cors");
const seoRoutes = require("./routes/seoRoutes");

const app = express();

/* =========================================================
   CONFIGURATION
========================================================= */

const PORT = process.env.PORT || 5000;


/* =========================================================
   MIDDLEWARE
========================================================= */

// Enable CORS so frontend can communicate with backend
app.use(
  cors({
    origin: "*",
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// Parse JSON request body
app.use(express.json({ limit: "1mb" }));

// Parse URL-encoded request body
app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);


/* =========================================================
   REQUEST LOGGER
========================================================= */

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.originalUrl}`
  );

  next();
});


/* =========================================================
   HOME / HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI SEO Engine Backend is running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      analyze: "POST /api/analyze",
      crawl: "POST /api/crawl",
    },
  });
});


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    service: "AI SEO Engine Backend",
    timestamp: new Date().toISOString(),
  });
});


/* =========================================================
   SEO API ROUTES
========================================================= */

app.use("/api", seoRoutes);


/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
    availableEndpoints: {
      health: "GET /health",
      analyze: "POST /api/analyze",
      crawl: "POST /api/crawl",
    },
  });
});


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error(
    "Server error:",
    err.stack || err.message
  );

  res.status(
    err.status || 500
  ).json({
    success: false,
    message:
      err.message ||
      "Internal server error",
  });
});


/* =========================================================
   START SERVER
========================================================= */

const server = app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log("");
    console.log(
      "=========================================="
    );
    console.log(
      "       AI SEO ENGINE BACKEND"
    );
    console.log(
      "=========================================="
    );
    console.log(
      `Server running on http://localhost:${PORT}`
    );
    console.log(
      `Health check: http://localhost:${PORT}/health`
    );
    console.log(
      `Analyze API: POST http://localhost:${PORT}/api/analyze`
    );
    console.log(
      `Crawl API: POST http://localhost:${PORT}/api/crawl`
    );
    console.log(
      "=========================================="
    );
    console.log("");
  }
);


/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

process.on(
  "SIGINT",
  () => {
    console.log(
      "\nShutting down server..."
    );

    server.close(() => {
      console.log(
        "Server stopped."
      );

      process.exit(0);
    });
  }
);

process.on(
  "SIGTERM",
  () => {
    console.log(
      "\nSIGTERM received. Shutting down..."
    );

    server.close(() => {
      console.log(
        "Server stopped."
      );

      process.exit(0);
    });
  }
);