import { useState } from "react";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // AI Assistant
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");

  // AI Fix
  const [fixOpen, setFixOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  /* =========================================================
     ANALYZE WEBSITE
  ========================================================= */

  const analyzeWebsite = async () => {
    if (!url.trim()) {
      setError("Please enter a website URL.");
      return;
    }

    let websiteUrl = url.trim();

    if (
      !websiteUrl.startsWith("http://") &&
      !websiteUrl.startsWith("https://")
    ) {
      websiteUrl = `https://${websiteUrl}`;
      setUrl(websiteUrl);
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: websiteUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to analyze website."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the SEO backend."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SCORE CLASS
  ========================================================= */

  const getScoreClass = (score) => {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 50) return "average";
    return "poor";
  };

  /* =========================================================
     OPEN AI FIX
  ========================================================= */

  const openAIFix = (issue) => {
    setSelectedIssue(issue);
    setFixOpen(true);
  };

  /* =========================================================
     LOCAL AI FIX ENGINE
     NO API KEY REQUIRED
  ========================================================= */

  const generateFix = (issue) => {
    if (!issue) {
      return {
        explanation: "No SEO issue was selected.",
        solution:
          "Run the website analysis again and select an issue.",
        example: "",
      };
    }

    const title = issue.title?.toLowerCase() || "";
    const message = issue.message?.toLowerCase() || "";

    /* ---------------- TITLE ---------------- */

    if (title.includes("title")) {
      const currentTitle =
        result?.seo?.title?.value || "";

      return {
        explanation:
          "The page title is missing or its length is outside the recommended range. The title helps search engines and users understand the main topic of the page.",

        solution:
          "Create a unique and descriptive title that clearly explains the main topic of the page. Keep it concise and avoid unnecessary keyword repetition.",

        example:
          `<title>
${currentTitle
  ? "Improved Page Title - Your Brand"
  : "Your Main Keyword - Your Brand"}
</title>`,
      };
    }

    /* ---------------- META DESCRIPTION ---------------- */

    if (
      title.includes("meta description") ||
      message.includes("meta description")
    ) {
      const currentDescription =
        result?.seo?.metaDescription?.value || "";

      return {
        explanation:
          "The meta description is missing or its length needs improvement. It summarizes the page and may be used as the search-result snippet.",

        solution:
          "Write a unique, useful description that naturally explains what the page offers. Avoid keyword stuffing.",

        example:
          `<meta
  name="description"
  content="${
    currentDescription
      ? "Discover our services, features and solutions for your business."
      : "Learn about our services, features and solutions for your business."
  }"
/>`,
      };
    }

    /* ---------------- H1 ---------------- */

    if (
      title.includes("h1") ||
      title.includes("heading")
    ) {
      return {
        explanation:
          "The page does not have the expected H1 heading structure.",

        solution:
          "Add one clear primary H1 heading that describes the main content of the page.",

        example:
          "<h1>Professional Website Development Services</h1>",
      };
    }

    /* ---------------- ALT TEXT ---------------- */

    if (
      title.includes("alt") ||
      title.includes("image")
    ) {
      const total =
        result?.seo?.images?.total || 0;

      const missing =
        result?.seo?.images?.withoutAlt || 0;

      return {
        explanation:
          `The analyzer found ${total} image(s), and ${missing} image(s) are missing ALT text. ALT text provides a text description for informative images.`,

        solution:
          "Add meaningful ALT text to informative images. For decorative images, use an empty ALT attribute when appropriate.",

        example:
          `<img
  src="product.jpg"
  alt="Blue business laptop on a desk"
/>`,
      };
    }

    /* ---------------- CANONICAL ---------------- */

    if (title.includes("canonical")) {
      return {
        explanation:
          "The page does not contain a canonical URL. A canonical URL helps identify the preferred version of a page when similar URLs exist.",

        solution:
          "Add a canonical link inside the HTML <head> pointing to the preferred URL.",

        example:
          `<link
  rel="canonical"
  href="https://example.com/page"
/>`,
      };
    }

    /* ---------------- OPEN GRAPH ---------------- */

    if (
      title.includes("open graph") ||
      title.includes("og")
    ) {
      return {
        explanation:
          "Open Graph metadata is incomplete. These tags control important information when a page is shared on social platforms.",

        solution:
          "Add Open Graph title, description and image metadata.",

        example:
          `<meta
  property="og:title"
  content="Your Page Title"
/>

<meta
  property="og:description"
  content="Your page description"
/>

<meta
  property="og:image"
  content="https://example.com/image.jpg"
/>`,
      };
    }

    /* ---------------- ROBOTS ---------------- */

    if (title.includes("robots")) {
      return {
        explanation:
          "The robots metadata or robots.txt configuration needs attention.",

        solution:
          "Review your crawling and indexing rules. Make sure important pages are allowed to be crawled and indexed when appropriate.",

        example:
          `<meta
  name="robots"
  content="index, follow"
/>`,
      };
    }

    /* ---------------- SITEMAP ---------------- */

    if (title.includes("sitemap")) {
      return {
        explanation:
          "An XML sitemap was not detected at the expected location.",

        solution:
          "Create an XML sitemap containing the important canonical URLs of your website.",

        example:
          `https://example.com/sitemap.xml`,
      };
    }

    /* ---------------- MOBILE ---------------- */

    if (
      title.includes("mobile") ||
      title.includes("viewport")
    ) {
      return {
        explanation:
          "The page does not contain the expected mobile viewport configuration.",

        solution:
          "Add a responsive viewport meta tag inside the HTML <head>.",

        example:
          `<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>`,
      };
    }

    /* ---------------- STRUCTURED DATA ---------------- */

    if (
      title.includes("structured") ||
      title.includes("schema")
    ) {
      return {
        explanation:
          "No structured data was detected on the page.",

        solution:
          "Add relevant Schema.org structured data when it accurately describes the page.",

        example:
          `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Your Website",
  "url": "https://example.com"
}
</script>`,
      };
    }

    /* ---------------- CONTENT ---------------- */

    if (
      title.includes("content") ||
      title.includes("word")
    ) {
      return {
        explanation:
          "The analyzer detected a relatively small amount of page text.",

        solution:
          "Add useful and relevant content that answers the user's search intent. Do not add unnecessary text only to increase word count.",

        example:
          `Add useful sections such as:

• Services
• Features
• Benefits
• FAQs
• About the business
• Helpful supporting information`,
      };
    }

    /* ---------------- INTERNAL LINKS ---------------- */

    if (
      title.includes("internal link") ||
      message.includes("internal link")
    ) {
      return {
        explanation:
          "The analyzer did not detect enough internal links on the page.",

        solution:
          "Add relevant links to useful pages within your own website.",

        example:
          `<a href="/services">
  Explore our services
</a>

<a href="/about">
  Learn more about us
</a>`,
      };
    }

    /* ---------------- HTTPS ---------------- */

    if (
      title.includes("https") ||
      title.includes("security")
    ) {
      return {
        explanation:
          "The analyzed page is not using HTTPS.",

        solution:
          "Configure an SSL/TLS certificate and serve your website over HTTPS.",

        example:
          "https://example.com",
      };
    }

    /* ---------------- FAVICON ---------------- */

    if (title.includes("favicon")) {
      return {
        explanation:
          "The page does not have a detectable favicon.",

        solution:
          "Add a favicon link inside the HTML <head>.",

        example:
          `<link
  rel="icon"
  href="/favicon.ico"
/>`,
      };
    }

    /* ---------------- LANGUAGE ---------------- */

    if (
      title.includes("language") ||
      title.includes("lang")
    ) {
      return {
        explanation:
          "The HTML document language was not detected correctly.",

        solution:
          "Add an appropriate lang attribute to the HTML element.",

        example:
          `<html lang="en">`,
      };
    }

    /* ---------------- FALLBACK ---------------- */

    return {
      explanation:
        issue.message ||
        "The analyzer detected an SEO issue that needs attention.",

      solution:
        "Review the affected SEO element, apply the recommended change and run the analysis again.",

      example:
        "Make the recommended change and re-run the SEO analysis.",
    };
  };

  /* =========================================================
     LOCAL SEO ASSISTANT
     NO API KEY REQUIRED
  ========================================================= */

  const askSEOAssistant = (question) => {
    if (!result) {
      setAssistantQuestion(question);

      setAssistantAnswer(
        "Please analyze a website first. Then I can answer questions using the SEO audit data."
      );

      setAssistantOpen(true);
      return;
    }

    const q = question.trim().toLowerCase();

    if (!q) {
      setAssistantAnswer(
        "Please enter a question about your SEO audit."
      );
      setAssistantOpen(true);
      return;
    }

    let answer = "";

    /* =====================================================
       ISSUES
    ===================================================== */

    if (
      q.includes("issue") ||
      q.includes("problem") ||
      q.includes("fix")
    ) {
      if (result.issues.length === 0) {
        answer =
          "Good news! The current SEO checks did not detect any issues on this page.";
      } else {
        const topIssues = result.issues
          .slice(0, 7)
          .map(
            (issue, index) =>
              `${index + 1}. ${issue.title}\n${issue.message}`
          )
          .join("\n\n");

        answer =
          `I found ${result.issues.length} SEO issue(s) on this page.\n\n` +
          `${topIssues}\n\n` +
          `Recommendation: Start with the important technical and on-page issues, then run the analysis again.`;
      }
    }

    /* =====================================================
       SCORE
    ===================================================== */

    else if (
      q.includes("score") ||
      q.includes("rating") ||
      q.includes("how good")
    ) {
      answer =
        `Your current SEO score is ${result.score}/100 (${result.rating}).\n\n` +
        `Passed checks: ${result.passed.length}\n` +
        `Issues found: ${result.issues.length}\n\n` +
        `The score is calculated using the SEO rules implemented in this analyzer. It is a custom audit score, not an official Google score.\n\n` +
        `To improve it, review the detected issues and re-run the audit after making changes.`;
    }

    /* =====================================================
       TITLE
    ===================================================== */

    else if (
      q.includes("title") ||
      q.includes("page title")
    ) {
      const currentTitle =
        result.seo.title.value ||
        "No title found";

      const length =
        result.seo.title.length || 0;

      answer =
        `Current title:\n"${currentTitle}"\n\n` +
        `Current length: ${length} characters.\n\n` +
        `Recommendation:\nCreate a unique, descriptive title that clearly explains the main topic of the page. Avoid keyword stuffing.\n\n` +
        `Example:\n<title>Your Main Keyword - Your Brand</title>`;
    }

    /* =====================================================
       META DESCRIPTION
    ===================================================== */

    else if (
      q.includes("meta") ||
      q.includes("description")
    ) {
      const description =
        result.seo.metaDescription.value ||
        "No meta description found";

      const length =
        result.seo.metaDescription.length || 0;

      answer =
        `Current meta description:\n"${description}"\n\n` +
        `Current length: ${length} characters.\n\n` +
        `Recommendation:\nWrite a unique and useful description that accurately summarizes the page.\n\n` +
        `Example:\n<meta name="description" content="Discover our services, features and solutions for your business.">`;
    }

    /* =====================================================
       ALT TEXT / IMAGES
    ===================================================== */

    else if (
      q.includes("alt") ||
      q.includes("image")
    ) {
      const total =
        result.seo.images.total || 0;

      const missing =
        result.seo.images.withoutAlt || 0;

      answer =
        `Your page has ${total} image(s).\n\n` +
        `${missing} image(s) are missing ALT text.\n\n` +
        `Recommendation:\nAdd meaningful ALT text to informative images. Decorative images can use an empty ALT attribute when appropriate.\n\n` +
        `Example:\n<img src="product.jpg" alt="Blue business laptop on a desk">`;
    }

    /* =====================================================
       H1 / HEADINGS
    ===================================================== */

    else if (
      q.includes("h1") ||
      q.includes("heading")
    ) {
      const h1 =
        result.seo.headings.h1Count;

      const h2 =
        result.seo.headings.h2Count;

      const h3 =
        result.seo.headings.h3Count;

      answer =
        `Heading analysis:\n\n` +
        `H1: ${h1}\n` +
        `H2: ${h2}\n` +
        `H3: ${h3}\n\n` +
        `Recommendation:\nUse a clear primary H1 for the main topic and use H2/H3 headings to organize supporting sections.`;
    }

    /* =====================================================
       CANONICAL
    ===================================================== */

    else if (q.includes("canonical")) {
      const canonical =
        result.seo.canonical ||
        "No canonical URL found";

      answer =
        `Canonical URL:\n${canonical}\n\n` +
        `Recommendation:\nMake sure the canonical URL points to the preferred version of the page and uses the correct absolute URL.`;
    }

    /* =====================================================
       OPEN GRAPH
    ===================================================== */

    else if (
      q.includes("open graph") ||
      q.includes("social")
    ) {
      const og =
        result.seo.openGraph;

      answer =
        `Open Graph status:\n\n` +
        `Title: ${
          og.title ? "Present ✓" : "Missing ✕"
        }\n` +
        `Description: ${
          og.description
            ? "Present ✓"
            : "Missing ✕"
        }\n` +
        `Image: ${
          og.image ? "Present ✓" : "Missing ✕"
        }\n\n` +
        `Recommendation:\nAdd complete Open Graph metadata so the page has useful information when shared on social platforms.`;
    }

    /* =====================================================
       INTERNAL LINKS
    ===================================================== */

    else if (
      q.includes("internal link") ||
      q.includes("internal linking")
    ) {
      const internal =
        result.seo.links.internal;

      answer =
        `Internal links detected: ${internal}\n\n` +
        `Recommendation:\nLink important pages together using meaningful anchor text. This can help users navigate the website and help search engines discover related pages.`;
    }

    /* =====================================================
       EXTERNAL LINKS
    ===================================================== */

    else if (
      q.includes("external link") ||
      q.includes("outbound link")
    ) {
      const external =
        result.seo.links.external;

      answer =
        `External links detected: ${external}\n\n` +
        `External links are not automatically bad. Use them when they provide useful and relevant information for your users.`;
    }

    /* =====================================================
       MOBILE
    ===================================================== */

    else if (
      q.includes("mobile") ||
      q.includes("responsive") ||
      q.includes("viewport")
    ) {
      const viewport =
        result.seo.viewport;

      answer =
        `Mobile viewport:\n${
          viewport
            ? "Detected ✓"
            : "Not detected ✕"
        }\n\n` +
        `Recommendation:\nUse a responsive design and include:\n\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\nNote: A viewport tag alone does not guarantee complete mobile usability.`;
    }

    /* =====================================================
       SITEMAP
    ===================================================== */

    else if (q.includes("sitemap")) {
      const sitemap =
        result.seo.sitemap;

      answer =
        `Sitemap status:\n${
          sitemap
            ? "Detected ✓"
            : "Not detected ✕"
        }\n\n` +
        `Recommendation:\nKeep an XML sitemap available at a predictable URL such as /sitemap.xml and include important canonical URLs.`;
    }

    /* =====================================================
       ROBOTS
    ===================================================== */

    else if (q.includes("robots")) {
      const robots =
        result.seo.robots;

      answer =
        `Robots configuration:\n${
          robots
            ? "Detected ✓"
            : "Not detected"
        }\n\n` +
        `Recommendation:\nReview robots.txt and robots meta directives to make sure important pages can be crawled and indexed as intended.`;
    }

    /* =====================================================
       HTTPS
    ===================================================== */

    else if (
      q.includes("https") ||
      q.includes("ssl") ||
      q.includes("security")
    ) {
      const secure =
        result.seo.https;

      answer =
        `HTTPS status:\n${
          secure
            ? "HTTPS detected ✓"
            : "HTTPS is not detected ✕"
        }\n\n` +
        `Recommendation:\nUse HTTPS for your website and make sure HTTP requests redirect to the HTTPS version when appropriate.`;
    }

    /* =====================================================
       STRUCTURED DATA
    ===================================================== */

    else if (
      q.includes("structured data") ||
      q.includes("schema")
    ) {
      const structured =
        result.seo.structuredData;

      answer =
        `Structured data:\n${
          structured
            ? "Detected ✓"
            : "Not detected ✕"
        }\n\n` +
        `Recommendation:\nUse relevant Schema.org structured data when it accurately represents the content on the page.`;
    }

    /* =====================================================
       CONTENT
    ===================================================== */

    else if (
      q.includes("content") ||
      q.includes("word count")
    ) {
      const words =
        result.seo.content?.wordCount ??
        result.seo.wordCount ??
        0;

      answer =
        `Detected text content: approximately ${words} words.\n\n` +
        `Recommendation:\nFocus on useful, original content that satisfies the visitor's search intent rather than writing content only to increase word count.`;
    }

    /* =====================================================
       QUICK RECOMMENDATION
    ===================================================== */

    else if (
      q.includes("recommend") ||
      q.includes("improve") ||
      q.includes("better")
    ) {
      if (result.issues.length === 0) {
        answer =
          `Your current audit did not detect any issues.\n\n` +
          `Continue monitoring the important SEO elements and keep your content useful, accessible and technically healthy.`;
      } else {
        const recommendations =
          result.issues
            .slice(0, 5)
            .map(
              (issue, index) =>
                `${index + 1}. ${issue.title}\n${issue.message}`
            )
            .join("\n\n");

        answer =
          `Here are the main areas to review:\n\n${recommendations}\n\n` +
          `After making the changes, run the audit again to compare the result.`;
      }
    }

    /* =====================================================
       DEFAULT
    ===================================================== */

    else {
      answer =
        `Based on the current audit:\n\n` +
        `SEO Score: ${result.score}/100\n` +
        `Rating: ${result.rating}\n` +
        `Issues: ${result.issues.length}\n` +
        `Passed checks: ${result.passed.length}\n\n` +
        `You can ask me about:\n` +
        `• SEO issues\n` +
        `• Score\n` +
        `• Title\n` +
        `• Meta description\n` +
        `• H1 headings\n` +
        `• Images / ALT text\n` +
        `• Internal links\n` +
        `• Canonical URL\n` +
        `• Open Graph\n` +
        `• Sitemap\n` +
        `• Robots.txt\n` +
        `• HTTPS\n` +
        `• Mobile SEO\n` +
        `• Structured data\n` +
        `• Content`;
    }

    setAssistantQuestion(question);
    setAssistantAnswer(answer);
    setAssistantOpen(true);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="app">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            AI
          </div>

          <div>
            <h1>AI SEO Engine</h1>
            <p>
              AI-powered website SEO analysis
            </p>
          </div>
        </div>

        <div className="header-status">
          <span className="status-dot"></span>
          SEO Analyzer
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="container">

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="hero">
          <span className="hero-badge">
            SMART SEO ANALYSIS
          </span>

          <h2>
            Analyze Your Website's
            <span> SEO Performance</span>
          </h2>

          <p>
            Enter a website URL and get a detailed
            SEO audit with issues, recommendations
            and intelligent SEO insights.
          </p>

          <div className="url-box">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) =>
                setUrl(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  analyzeWebsite();
                }
              }}
            />

            <button
              onClick={analyzeWebsite}
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "Analyze Website"}
            </button>
          </div>

          {error && (
            <div className="error-box">
              ⚠ {error}
            </div>
          )}
        </section>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (
          <div className="loading-box">
            <div className="spinner"></div>

            <div>
              <strong>
                Analyzing website...
              </strong>

              <p>
                Checking title, meta description,
                headings, images, links and
                technical SEO.
              </p>
            </div>
          </div>
        )}

        {/* ===================================================
            RESULTS
        =================================================== */}

        {result && !loading && (
          <section className="results">

            {/* Website Info */}

            <div className="website-bar">
              <div>
                <span className="small-label">
                  ANALYZED WEBSITE
                </span>

                <strong>
                  {result.website.url}
                </strong>
              </div>

              <div className="status-success">
                ● HTTP {result.website.statusCode}
              </div>
            </div>

            {/* =================================================
                SCORE
            ================================================= */}

            <div className="score-section">

              <div className="score-card">

                <div className="score-circle">
                  <div>
                    <strong>
                      {result.score}
                    </strong>

                    <span>/100</span>
                  </div>
                </div>

                <div className="score-info">
                  <span className="small-label">
                    SEO SCORE
                  </span>

                  <h3
                    className={getScoreClass(
                      result.score
                    )}
                  >
                    {result.rating}
                  </h3>

                  <p>
                    Your website has been
                    analyzed using the current
                    SEO checks.
                  </p>
                </div>

              </div>

              <div className="stats-grid">

                <div className="stat-card">
                  <span>H1 HEADINGS</span>

                  <strong>
                    {result.seo.headings.h1Count}
                  </strong>

                  <small>
                    Detected
                  </small>
                </div>

                <div className="stat-card">
                  <span>IMAGES</span>

                  <strong>
                    {result.seo.images.total}
                  </strong>

                  <small>
                    {result.seo.images.withoutAlt}{" "}
                    missing ALT
                  </small>
                </div>

                <div className="stat-card">
                  <span>INTERNAL LINKS</span>

                  <strong>
                    {result.seo.links.internal}
                  </strong>

                  <small>
                    Detected
                  </small>
                </div>

                <div className="stat-card">
                  <span>EXTERNAL LINKS</span>

                  <strong>
                    {result.seo.links.external}
                  </strong>

                  <small>
                    Detected
                  </small>
                </div>

              </div>
            </div>

            {/* =================================================
                OVERVIEW
            ================================================= */}

            <div className="section-heading">
              <div>
                <span className="section-label">
                  SEO OVERVIEW
                </span>

                <h2>
                  Website Analysis
                </h2>
              </div>

              <span className="check-count">
                {result.passed.length} passed ·{" "}
                {result.issues.length} issues
              </span>
            </div>

            <div className="overview-grid">

              {/* TITLE */}

              <div className="analysis-card">

                <div className="card-top">

                  <div className="card-icon success">
                    ✓
                  </div>

                  <div>
                    <span className="card-category">
                      ON-PAGE SEO
                    </span>

                    <h3>
                      Title Tag
                    </h3>
                  </div>

                  <span className="badge success-badge">
                    {result.seo.title.status}
                  </span>

                </div>

                <p className="value-text">
                  {result.seo.title.value ||
                    "No title found"}
                </p>

                <div className="card-footer">
                  <span>
                    Length
                  </span>

                  <strong>
                    {result.seo.title.length}{" "}
                    characters
                  </strong>
                </div>

              </div>

              {/* META */}

              <div className="analysis-card">

                <div className="card-top">

                  <div className="card-icon success">
                    ✓
                  </div>

                  <div>
                    <span className="card-category">
                      ON-PAGE SEO
                    </span>

                    <h3>
                      Meta Description
                    </h3>
                  </div>

                  <span className="badge success-badge">
                    {
                      result.seo
                        .metaDescription
                        .status
                    }
                  </span>

                </div>

                <p className="value-text">
                  {result.seo.metaDescription
                    .value ||
                    "No meta description found"}
                </p>

                <div className="card-footer">
                  <span>
                    Length
                  </span>

                  <strong>
                    {
                      result.seo.metaDescription
                        .length
                    }{" "}
                    characters
                  </strong>
                </div>

              </div>

              {/* HEADINGS */}

              <div className="analysis-card">

                <div className="card-top">

                  <div className="card-icon success">
                    ✓
                  </div>

                  <div>
                    <span className="card-category">
                      CONTENT
                    </span>

                    <h3>
                      Headings
                    </h3>
                  </div>

                </div>

                <div className="heading-stats">

                  <div>
                    <strong>
                      {
                        result.seo.headings
                          .h1Count
                      }
                    </strong>

                    <span>
                      H1
                    </span>
                  </div>

                  <div>
                    <strong>
                      {
                        result.seo.headings
                          .h2Count
                      }
                    </strong>

                    <span>
                      H2
                    </span>
                  </div>

                  <div>
                    <strong>
                      {
                        result.seo.headings
                          .h3Count
                      }
                    </strong>

                    <span>
                      H3
                    </span>
                  </div>

                </div>
              </div>

              {/* IMAGES */}

              <div className="analysis-card warning-card">

                <div className="card-top">

                  <div className="card-icon warning">
                    !
                  </div>

                  <div>
                    <span className="card-category">
                      IMAGE SEO
                    </span>

                    <h3>
                      Image ALT Text
                    </h3>
                  </div>

                  <span className="badge warning-badge">
                    {
                      result.seo.images
                        .withoutAlt
                    }{" "}
                    issues
                  </span>

                </div>

                <p className="value-text">
                  {result.seo.images
                    .withoutAlt === 0
                    ? "All images have ALT text."
                    : `${result.seo.images.withoutAlt} images are missing ALT text.`}
                </p>

                <div className="card-footer">
                  <span>
                    Total Images
                  </span>

                  <strong>
                    {result.seo.images.total}
                  </strong>
                </div>

              </div>

              {/* CANONICAL */}

              <div className="analysis-card">

                <div className="card-top">

                  <div
                    className={`card-icon ${
                      result.seo.canonical
                        ? "success"
                        : "warning"
                    }`}
                  >
                    {result.seo.canonical
                      ? "✓"
                      : "!"}
                  </div>

                  <div>
                    <span className="card-category">
                      TECHNICAL SEO
                    </span>

                    <h3>
                      Canonical URL
                    </h3>
                  </div>

                </div>

                <p className="value-text">
                  {result.seo.canonical ||
                    "No canonical URL found"}
                </p>

              </div>

              {/* OPEN GRAPH */}

              <div className="analysis-card">

                <div className="card-top">

                  <div className="card-icon success">
                    ✓
                  </div>

                  <div>
                    <span className="card-category">
                      SOCIAL SEO
                    </span>

                    <h3>
                      Open Graph
                    </h3>
                  </div>

                </div>

                <p className="value-text">
                  {result.seo.openGraph.title ||
                    "No OG title"}
                </p>

                <div className="og-status">

                  <span>
                    Title{" "}
                    {result.seo.openGraph.title
                      ? "✓"
                      : "✕"}
                  </span>

                  <span>
                    Description{" "}
                    {result.seo.openGraph.description
                      ? "✓"
                      : "✕"}
                  </span>

                  <span>
                    Image{" "}
                    {result.seo.openGraph.image
                      ? "✓"
                      : "✕"}
                  </span>

                </div>
              </div>

            </div>

            {/* =================================================
                ISSUES
            ================================================= */}

            <div className="section-heading issue-heading">

              <div>
                <span className="section-label">
                  ACTION REQUIRED
                </span>

                <h2>
                  SEO Issues
                </h2>
              </div>

              <span className="issue-number">
                {result.issues.length}
              </span>

            </div>

            {result.issues.length === 0 ? (

              <div className="empty-success">

                <span>✓</span>

                <div>
                  <strong>
                    No SEO issues detected
                  </strong>

                  <p>
                    The current SEO checks did not
                    find any issues on this page.
                  </p>
                </div>

              </div>

            ) : (

              <div className="issues-list">

                {result.issues.map(
                  (issue, index) => (

                    <div
                      className="issue-card"
                      key={index}
                    >

                      <div className="issue-icon">
                        !
                      </div>

                      <div className="issue-content">

                        <div className="issue-meta">

                          <span>
                            {issue.category}
                          </span>

                          <span className="severity">
                            {issue.severity}
                          </span>

                        </div>

                        <h3>
                          {issue.title}
                        </h3>

                        <p>
                          {issue.message}
                        </p>

                      </div>

                      <button
                        className="fix-button"
                        onClick={() =>
                          openAIFix(issue)
                        }
                      >
                        ✦ AI Fix
                      </button>

                    </div>

                  )
                )}

              </div>
            )}

            {/* =================================================
                PASSED
            ================================================= */}

            <div className="section-heading passed-heading">

              <div>
                <span className="section-label">
                  PASSED CHECKS
                </span>

                <h2>
                  What's Working
                </h2>
              </div>

              <span className="passed-number">
                {result.passed.length}
              </span>

            </div>

            <div className="passed-grid">

              {result.passed.map(
                (item, index) => (

                  <div
                    className="passed-card"
                    key={index}
                  >

                    <div className="passed-icon">
                      ✓
                    </div>

                    <div>

                      <span>
                        {item.category}
                      </span>

                      <h3>
                        {item.title}
                      </h3>

                      <p>
                        {item.message}
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

            {/* =================================================
                AI ASSISTANT
            ================================================= */}

            <section className="assistant-preview">

              <div className="assistant-icon">
                ✦
              </div>

              <div className="assistant-content">

                <span className="section-label">
                  AI SEO ASSISTANT
                </span>

                <h2>
                  Ask AI about your SEO
                </h2>

                <p>
                  Ask questions about this audit,
                  explain an issue, or request SEO
                  improvements.
                </p>

                <div className="suggestions">

                  <button
                    onClick={() =>
                      askSEOAssistant(
                        "Explain my SEO issues"
                      )
                    }
                  >
                    Explain my SEO issues
                  </button>

                  <button
                    onClick={() =>
                      askSEOAssistant(
                        "Improve my title"
                      )
                    }
                  >
                    Improve my title
                  </button>

                  <button
                    onClick={() =>
                      askSEOAssistant(
                        "Generate meta description"
                      )
                    }
                  >
                    Generate meta description
                  </button>

                  <button
                    onClick={() =>
                      askSEOAssistant(
                        "Fix missing ALT text"
                      )
                    }
                  >
                    Fix missing ALT text
                  </button>

                </div>

                <button
                  className="open-assistant-button"
                  onClick={() => {
                    setAssistantQuestion("");
                    setAssistantAnswer("");
                    setAssistantOpen(true);
                  }}
                >
                  ✦ Open SEO Assistant
                </button>

              </div>

            </section>

          </section>
        )}

      </main>

      {/* =====================================================
          AI FIX MODAL
      ===================================================== */}

      {fixOpen && selectedIssue && (

        <div
          className="ai-modal-overlay"
          onClick={() =>
            setFixOpen(false)
          }
        >

          <div
            className="ai-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="ai-modal-header">

              <div>

                <span className="section-label">
                  AI SEO FIX
                </span>

                <h2>
                  {selectedIssue.title}
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setFixOpen(false)
                }
              >
                ×
              </button>

            </div>

            {(() => {
              const fix =
                generateFix(
                  selectedIssue
                );

              return (

                <div className="ai-fix-content">

                  <div className="fix-section">

                    <span>
                      WHAT IS THE PROBLEM?
                    </span>

                    <p>
                      {fix.explanation}
                    </p>

                  </div>

                  <div className="fix-section">

                    <span>
                      RECOMMENDED FIX
                    </span>

                    <p>
                      {fix.solution}
                    </p>

                  </div>

                  {fix.example && (

                    <div className="fix-section">

                      <span>
                        EXAMPLE
                      </span>

                      <pre>
                        {fix.example}
                      </pre>

                    </div>

                  )}

                  <button
                    className="modal-action-button"
                    onClick={() =>
                      setFixOpen(false)
                    }
                  >
                    Got it
                  </button>

                </div>

              );
            })()}

          </div>

        </div>
      )}

      {/* =====================================================
          ASK AI MODAL
      ===================================================== */}

      {assistantOpen && (

        <div
          className="ai-modal-overlay"
          onClick={() =>
            setAssistantOpen(false)
          }
        >

          <div
            className="ai-modal assistant-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="ai-modal-header">

              <div>

                <span className="section-label">
                  AI SEO ASSISTANT
                </span>

                <h2>
                  Ask AI about your SEO
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setAssistantOpen(false)
                }
              >
                ×
              </button>

            </div>

            <div className="assistant-chat">

              <div className="assistant-question">

                <span>
                  YOU
                </span>

                <p>
                  {assistantQuestion ||
                    "What would you like to know about my SEO?"}
                </p>

              </div>

              {assistantAnswer && (

                <div className="assistant-response">

                  <span>
                    AI SEO ASSISTANT
                  </span>

                  <p>
                    {assistantAnswer}
                  </p>

                </div>

              )}

            </div>

            <div className="assistant-input-area">

              <input
                type="text"
                placeholder="Ask about your SEO..."
                value={assistantQuestion}
                onChange={(e) =>
                  setAssistantQuestion(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {

                  if (
                    e.key === "Enter" &&
                    assistantQuestion.trim()
                  ) {
                    askSEOAssistant(
                      assistantQuestion
                    );
                  }

                }}
              />

              <button
                onClick={() => {

                  if (
                    assistantQuestion.trim()
                  ) {
                    askSEOAssistant(
                      assistantQuestion
                    );
                  }

                }}
              >
                Ask
              </button>

            </div>

            <div className="assistant-suggestions-modal">

              <button
                onClick={() =>
                  askSEOAssistant(
                    "Explain my SEO issues"
                  )
                }
              >
                Explain issues
              </button>

              <button
                onClick={() =>
                  askSEOAssistant(
                    "Improve my title"
                  )
                }
              >
                Improve title
              </button>

              <button
                onClick={() =>
                  askSEOAssistant(
                    "Generate meta description"
                  )
                }
              >
                Meta description
              </button>

              <button
                onClick={() =>
                  askSEOAssistant(
                    "Fix missing ALT text"
                  )
                }
              >
                ALT text
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer>
        <p>
          AI SEO Engine · Intelligent Website SEO
          Analysis
        </p>
      </footer>

    </div>
  );
}

export default App;