function calculateSEOScore(seo) {
  let score = 0;

  const issues = [];
  const passed = [];

  // =========================================================
  // 1. TITLE
  // =========================================================

  if (seo.title.status === "good") {
    score += 10;

    passed.push({
      category: "On-Page SEO",
      title: "Title is properly optimized",
      message:
        "The page has a title with a suitable length.",
    });
  } else if (seo.title.status === "warning") {
    score += 5;

    issues.push({
      category: "On-Page SEO",
      severity: "medium",
      title: "Title length needs improvement",
      message:
        `The title contains ${seo.title.length} characters. ` +
        "Keep it within a suitable SEO length.",
    });
  } else {
    issues.push({
      category: "On-Page SEO",
      severity: "high",
      title: "Title tag is missing",
      message:
        "Add a descriptive and relevant title tag.",
    });
  }

  // =========================================================
  // 2. META DESCRIPTION
  // =========================================================

  if (seo.metaDescription.status === "good") {
    score += 10;

    passed.push({
      category: "On-Page SEO",
      title: "Meta description found",
      message:
        "The page contains a meta description with a suitable length.",
    });
  } else if (seo.metaDescription.status === "warning") {
    score += 5;

    issues.push({
      category: "On-Page SEO",
      severity: "medium",
      title: "Meta description length needs improvement",
      message:
        `The meta description contains ${seo.metaDescription.length} characters.`,
    });
  } else {
    issues.push({
      category: "On-Page SEO",
      severity: "high",
      title: "Meta description is missing",
      message:
        "Add a relevant meta description for the page.",
    });
  }

  // =========================================================
  // 3. H1
  // =========================================================

  if (seo.headings.h1Count === 1) {
    score += 10;

    passed.push({
      category: "On-Page SEO",
      title: "Exactly one H1 heading found",
      message:
        "The page has a single primary H1 heading.",
    });
  } else if (seo.headings.h1Count === 0) {
    issues.push({
      category: "On-Page SEO",
      severity: "high",
      title: "H1 heading is missing",
      message:
        "Add one clear primary H1 heading to the page.",
    });
  } else {
    score += 5;

    issues.push({
      category: "On-Page SEO",
      severity: "medium",
      title: "Multiple H1 headings found",
      message:
        `The page contains ${seo.headings.h1Count} H1 headings. ` +
        "Consider using one primary H1.",
    });
  }

  // =========================================================
  // 4. IMAGE ALT
  // =========================================================

  if (seo.images.total === 0) {
    score += 10;

    passed.push({
      category: "Image SEO",
      title: "No images detected",
      message:
        "No images were found on the page.",
    });
  } else if (seo.images.withoutAlt === 0) {
    score += 10;

    passed.push({
      category: "Image SEO",
      title: "All images have ALT text",
      message:
        "All detected images contain ALT text.",
    });
  } else {
    const imagesWithAlt =
      seo.images.total - seo.images.withoutAlt;

    const imageScore =
      (imagesWithAlt / seo.images.total) * 10;

    score += Math.round(imageScore);

    issues.push({
      category: "Image SEO",
      severity: "medium",
      title:
        `${seo.images.withoutAlt} images are missing ALT text`,
      message:
        "Add descriptive ALT text to images where appropriate.",
    });
  }

  // =========================================================
  // 5. CANONICAL
  // =========================================================

  if (seo.canonical) {
    score += 10;

    passed.push({
      category: "Technical SEO",
      title: "Canonical URL found",
      message:
        "A canonical URL is present on the page.",
    });
  } else {
    issues.push({
      category: "Technical SEO",
      severity: "medium",
      title: "Canonical URL is missing",
      message:
        "Add a canonical URL to help search engines " +
        "understand the preferred page URL.",
    });
  }

  // =========================================================
  // 6. OPEN GRAPH
  // =========================================================

  if (
    seo.openGraph.title &&
    seo.openGraph.description &&
    seo.openGraph.image
  ) {
    score += 10;

    passed.push({
      category: "Social SEO",
      title: "Open Graph metadata found",
      message:
        "Open Graph title, description and image are available.",
    });
  } else {
    issues.push({
      category: "Social SEO",
      severity: "low",
      title: "Open Graph metadata is incomplete",
      message:
        "Add Open Graph title, description and image metadata.",
    });
  }

  // =========================================================
  // 7. ROBOTS META
  // =========================================================

  if (seo.robotsMeta) {
    score += 10;

    passed.push({
      category: "Technical SEO",
      title: "Robots meta tag found",
      message:
        "A robots meta tag is present.",
    });
  } else {
    issues.push({
      category: "Technical SEO",
      severity: "low",
      title: "Robots meta tag is missing",
      message:
        "Consider adding a robots meta tag when appropriate.",
    });
  }

  // =========================================================
  // 8. INTERNAL LINKS
  // =========================================================

  if (seo.links.internal > 0) {
    score += 10;

    passed.push({
      category: "Link SEO",
      title: "Internal links found",
      message:
        `${seo.links.internal} internal links were detected.`,
    });
  } else {
    issues.push({
      category: "Link SEO",
      severity: "medium",
      title: "No internal links found",
      message:
        "Add relevant internal links to help users and " +
        "search engines navigate the website.",
    });
  }

  // =========================================================
  // 9. HTTPS
  // =========================================================

  if (seo.technical?.https?.enabled) {
    score += 5;

    passed.push({
      category: "Security",
      title: "HTTPS is enabled",
      message:
        "The analyzed website is using a secure HTTPS connection.",
    });
  } else {
    issues.push({
      category: "Security",
      severity: "high",
      title: "HTTPS is not enabled",
      message:
        "Use HTTPS to secure the website connection.",
    });
  }

  // =========================================================
  // 10. ROBOTS.TXT
  // =========================================================

  if (seo.technical?.robotsTxt?.found) {
    score += 5;

    passed.push({
      category: "Technical SEO",
      title: "robots.txt found",
      message:
        "A robots.txt file was found at the website root.",
    });
  } else {
    issues.push({
      category: "Technical SEO",
      severity: "medium",
      title: "robots.txt not found",
      message:
        "Consider adding a robots.txt file to provide " +
        "crawling instructions to search engines.",
    });
  }

  // =========================================================
  // 11. SITEMAP
  // =========================================================

  if (seo.technical?.sitemap?.found) {
    score += 5;

    passed.push({
      category: "Technical SEO",
      title: "XML sitemap found",
      message:
        "An XML sitemap was found at the expected location.",
    });
  } else {
    issues.push({
      category: "Technical SEO",
      severity: "medium",
      title: "XML sitemap not found",
      message:
        "No sitemap.xml was found at the expected location.",
    });
  }

  // =========================================================
  // 12. MOBILE VIEWPORT
  // =========================================================

  if (seo.technical?.mobile?.friendly) {
    score += 5;

    passed.push({
      category: "Mobile SEO",
      title: "Mobile viewport found",
      message:
        "The page contains a mobile viewport meta tag.",
    });
  } else {
    issues.push({
      category: "Mobile SEO",
      severity: "medium",
      title: "Mobile viewport is missing",
      message:
        "Add a responsive viewport meta tag for mobile devices.",
    });
  }

  // =========================================================
  // 13. SCHEMA / STRUCTURED DATA
  // =========================================================

  if (seo.technical?.schema?.found) {
    score += 5;

    passed.push({
      category: "Structured Data",
      title: "Structured data found",
      message:
        `${seo.technical.schema.count} JSON-LD block(s) were detected.`,
    });
  } else {
    issues.push({
      category: "Structured Data",
      severity: "low",
      title: "Structured data not found",
      message:
        "Consider adding relevant Schema.org structured data " +
        "where appropriate.",
    });
  }

  // =========================================================
  // 14. CONTENT
  // =========================================================

  if (seo.technical?.content?.wordCount >= 300) {
    score += 5;

    passed.push({
      category: "Content SEO",
      title: "Sufficient page content detected",
      message:
        `${seo.technical.content.wordCount} words were detected on the page.`,
    });
  } else if (
    seo.technical?.content?.wordCount > 0
  ) {
    issues.push({
      category: "Content SEO",
      severity: "medium",
      title: "Low page content",
      message:
        `Only ${seo.technical.content.wordCount} words were detected. ` +
        "Consider providing more useful, relevant content where appropriate.",
    });
  } else {
    issues.push({
      category: "Content SEO",
      severity: "high",
      title: "No page content detected",
      message:
        "No meaningful text content was detected on the page.",
    });
  }

  // =========================================================
  // FINAL SCORE
  // =========================================================

  /*
    Maximum possible raw score:

    Title              = 10
    Meta Description   = 10
    H1                 = 10
    Image ALT          = 10
    Canonical          = 10
    Open Graph         = 10
    Robots Meta        = 10
    Internal Links     = 10
    HTTPS              = 5
    robots.txt         = 5
    Sitemap            = 5
    Mobile Viewport    = 5
    Structured Data    = 5
    Content            = 5

    Total = 115
  */

  const maxScore = 115;

  const normalizedScore = Math.round(
    (score / maxScore) * 100
  );

  const finalScore = Math.min(
    100,
    Math.max(0, normalizedScore)
  );

  // =========================================================
  // RATING
  // =========================================================

  let rating;

  if (finalScore >= 90) {
    rating = "Excellent";
  } else if (finalScore >= 75) {
    rating = "Good";
  } else if (finalScore >= 50) {
    rating = "Average";
  } else {
    rating = "Needs Improvement";
  }

  // =========================================================
  // CATEGORY SCORES
  // =========================================================

  const categoryScores = {};

  const categoryMax = {
    "On-Page SEO": 30,
    "Image SEO": 10,
    "Technical SEO": 25,
    "Social SEO": 10,
    "Link SEO": 10,
    Security: 5,
    "Mobile SEO": 5,
    "Structured Data": 5,
    "Content SEO": 5,
  };

  const categoryRawScores = {
    "On-Page SEO": 0,
    "Image SEO": 0,
    "Technical SEO": 0,
    "Social SEO": 0,
    "Link SEO": 0,
    Security: 0,
    "Mobile SEO": 0,
    "Structured Data": 0,
    "Content SEO": 0,
  };

  // ---------------------------------------------------------
  // On-Page SEO
  // ---------------------------------------------------------

  if (seo.title.status === "good") {
    categoryRawScores["On-Page SEO"] += 10;
  } else if (seo.title.status === "warning") {
    categoryRawScores["On-Page SEO"] += 5;
  }

  if (seo.metaDescription.status === "good") {
    categoryRawScores["On-Page SEO"] += 10;
  } else if (
    seo.metaDescription.status === "warning"
  ) {
    categoryRawScores["On-Page SEO"] += 5;
  }

  if (seo.headings.h1Count === 1) {
    categoryRawScores["On-Page SEO"] += 10;
  } else if (seo.headings.h1Count > 1) {
    categoryRawScores["On-Page SEO"] += 5;
  }

  // ---------------------------------------------------------
  // Image SEO
  // ---------------------------------------------------------

  if (seo.images.total === 0) {
    categoryRawScores["Image SEO"] += 10;
  } else if (seo.images.withoutAlt === 0) {
    categoryRawScores["Image SEO"] += 10;
  } else {
    const imagesWithAlt =
      seo.images.total - seo.images.withoutAlt;

    categoryRawScores["Image SEO"] += Math.round(
      (imagesWithAlt / seo.images.total) * 10
    );
  }

  // ---------------------------------------------------------
  // Technical SEO
  // ---------------------------------------------------------

  if (seo.canonical) {
    categoryRawScores["Technical SEO"] += 10;
  }

  if (seo.robotsMeta) {
    categoryRawScores["Technical SEO"] += 10;
  }

  if (seo.technical?.robotsTxt?.found) {
    categoryRawScores["Technical SEO"] += 5;
  }

  // ---------------------------------------------------------
  // Social SEO
  // ---------------------------------------------------------

  if (
    seo.openGraph.title &&
    seo.openGraph.description &&
    seo.openGraph.image
  ) {
    categoryRawScores["Social SEO"] += 10;
  }

  // ---------------------------------------------------------
  // Link SEO
  // ---------------------------------------------------------

  if (seo.links.internal > 0) {
    categoryRawScores["Link SEO"] += 10;
  }

  // ---------------------------------------------------------
  // Security
  // ---------------------------------------------------------

  if (seo.technical?.https?.enabled) {
    categoryRawScores.Security += 5;
  }

  // ---------------------------------------------------------
  // Mobile SEO
  // ---------------------------------------------------------

  if (seo.technical?.mobile?.friendly) {
    categoryRawScores["Mobile SEO"] += 5;
  }

  // ---------------------------------------------------------
  // Structured Data
  // ---------------------------------------------------------

  if (seo.technical?.schema?.found) {
    categoryRawScores["Structured Data"] += 5;
  }

  // ---------------------------------------------------------
  // Content SEO
  // ---------------------------------------------------------

  if (seo.technical?.content?.wordCount >= 300) {
    categoryRawScores["Content SEO"] += 5;
  } else if (
    seo.technical?.content?.wordCount > 0
  ) {
    categoryRawScores["Content SEO"] += 0;
  }

  // ---------------------------------------------------------
  // Normalize category scores to 100
  // ---------------------------------------------------------

  Object.keys(categoryMax).forEach((category) => {
    const raw = categoryRawScores[category] || 0;
    const max = categoryMax[category];

    categoryScores[category] = Math.round(
      (raw / max) * 100
    );
  });

  // =========================================================
  // FINAL RESULT
  // =========================================================

  return {
    score: finalScore,
    rating,
    issues,
    passed,

    // Category-wise SEO performance
    categoryScores,

    // Useful for debugging / future dashboard
    rawScore: score,
    maxScore,

    summary: {
      totalIssues: issues.length,
      totalPassed: passed.length,
      categories: Object.keys(categoryScores).length,
    },
  };
}

module.exports = calculateSEOScore;