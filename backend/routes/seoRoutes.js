const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const calculateSEOScore = require("../services/seoScore");

const router = express.Router();

/* =========================================================
   CONFIG
========================================================= */

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 Chrome/143 Safari/537.36";

const SEO_USER_AGENT = "AI-SEO-Engine/1.0";

const REQUEST_TIMEOUT = 15000;
const SMALL_REQUEST_TIMEOUT = 8000;


/* =========================================================
   URL VALIDATION
========================================================= */

function validateWebsiteUrl(value) {
  if (!value) {
    return {
      valid: false,
      message: "Website URL is required",
    };
  }

  let websiteUrl;

  try {
    websiteUrl = new URL(value);
  } catch {
    return {
      valid: false,
      message: "Please enter a valid website URL",
    };
  }

  if (!["http:", "https:"].includes(websiteUrl.protocol)) {
    return {
      valid: false,
      message: "Only HTTP and HTTPS URLs are supported",
    };
  }

  return {
    valid: true,
    url: websiteUrl,
  };
}


/* =========================================================
   FETCH HTML
========================================================= */

async function fetchWebsite(url, timeout = REQUEST_TIMEOUT) {
  return axios.get(url, {
    timeout,

    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },

    maxRedirects: 5,

    validateStatus: (status) => {
      return status >= 200 && status < 400;
    },
  });
}


/* =========================================================
   ANALYZE HTML
========================================================= */

function analyzeHTML(html, websiteUrl) {
  const $ = cheerio.load(html);

  /* =======================================================
     1. TITLE
  ======================================================= */

  const title = $("title").text().trim();

  const titleLength = title.length;

  let titleStatus = "good";

  if (!title) {
    titleStatus = "missing";
  } else if (
    titleLength < 30 ||
    titleLength > 60
  ) {
    titleStatus = "warning";
  }


  /* =======================================================
     2. META DESCRIPTION
  ======================================================= */

  const metaDescription =
    $('meta[name="description"]')
      .attr("content")
      ?.trim() || "";

  const metaDescriptionLength =
    metaDescription.length;

  let metaDescriptionStatus = "good";

  if (!metaDescription) {
    metaDescriptionStatus = "missing";
  } else if (
    metaDescriptionLength < 120 ||
    metaDescriptionLength > 160
  ) {
    metaDescriptionStatus = "warning";
  }


  /* =======================================================
     3. HEADINGS
  ======================================================= */

  const h1 = $("h1")
    .map((i, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  const h2 = $("h2")
    .map((i, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  const h3 = $("h3")
    .map((i, el) => $(el).text().trim())
    .get()
    .filter(Boolean);


  /* =======================================================
     4. IMAGES
  ======================================================= */

  const images = $("img");

  let imagesWithoutAlt = 0;

  const imageDetails = [];

  images.each((i, el) => {
    const src =
      $(el).attr("src") ||
      $(el).attr("data-src") ||
      null;

    const alt =
      $(el).attr("alt")?.trim() || "";

    const width =
      $(el).attr("width") || null;

    const height =
      $(el).attr("height") || null;

    if (!alt) {
      imagesWithoutAlt++;
    }

    imageDetails.push({
      src,
      alt,
      width,
      height,
      hasAlt: Boolean(alt),
    });
  });


  /* =======================================================
     5. LINKS
  ======================================================= */

  const links = $("a");

  let internalLinks = 0;
  let externalLinks = 0;

  const linkDetails = [];

  links.each((i, el) => {
    const href =
      $(el).attr("href")?.trim() || "";

    const anchorText =
      $(el).text().trim();

    if (!href) {
      return;
    }

    try {
      const linkUrl =
        new URL(href, websiteUrl.href);

      /* Ignore special protocols */
      if (
        linkUrl.protocol === "mailto:" ||
        linkUrl.protocol === "tel:" ||
        linkUrl.protocol === "javascript:"
      ) {
        return;
      }

      const isInternal =
        linkUrl.hostname ===
        websiteUrl.hostname;

      if (isInternal) {
        internalLinks++;
      } else {
        externalLinks++;
      }

      linkDetails.push({
        href: linkUrl.href,
        text: anchorText,
        type: isInternal
          ? "internal"
          : "external",
      });
    } catch {
      // Ignore invalid URLs
    }
  });


  /* =======================================================
     6. CANONICAL
  ======================================================= */

  const canonical =
    $('link[rel="canonical"]')
      .attr("href")
      ?.trim() || null;


  /* =======================================================
     7. OPEN GRAPH
  ======================================================= */

  const ogTitle =
    $('meta[property="og:title"]')
      .attr("content")
      ?.trim() || null;

  const ogDescription =
    $('meta[property="og:description"]')
      .attr("content")
      ?.trim() || null;

  const ogImage =
    $('meta[property="og:image"]')
      .attr("content")
      ?.trim() || null;


  /* =======================================================
     8. ROBOTS META
  ======================================================= */

  const robots =
    $('meta[name="robots"]')
      .attr("content")
      ?.trim() || null;


  /* =======================================================
     9. HTTPS
  ======================================================= */

  const isHttps =
    websiteUrl.protocol === "https:";


  /* =======================================================
     10. MOBILE VIEWPORT
  ======================================================= */

  const viewport =
    $('meta[name="viewport"]')
      .attr("content")
      ?.trim() || null;

  const mobileFriendly =
    Boolean(viewport);


  /* =======================================================
     11. JSON-LD / STRUCTURED DATA
  ======================================================= */

  const jsonLdScripts =
    $('script[type="application/ld+json"]');

  const schemas = [];

  let invalidSchemaCount = 0;

  jsonLdScripts.each((i, el) => {
    const schemaText =
      $(el).html();

    if (!schemaText) {
      return;
    }

    try {
      const parsedSchema =
        JSON.parse(schemaText);

      if (Array.isArray(parsedSchema)) {
        schemas.push(...parsedSchema);
      } else {
        schemas.push(parsedSchema);
      }
    } catch {
      invalidSchemaCount++;
    }
  });

  const hasSchema =
    schemas.length > 0;

  const schemaTypes = schemas
    .map((schema) => {
      if (
        schema &&
        typeof schema === "object"
      ) {
        const type =
          schema["@type"];

        if (Array.isArray(type)) {
          return type;
        }

        return type || null;
      }

      return null;
    })
    .flat()
    .filter(Boolean);


  /* =======================================================
     12. CONTENT / WORD COUNT
  ======================================================= */

  const bodyText =
    $("body")
      .clone()
      .find(
        "script, style, noscript, template"
      )
      .remove()
      .end()
      .text()
      .replace(/\s+/g, " ")
      .trim();

  const words =
    bodyText
      ? bodyText
          .split(/\s+/)
          .filter(Boolean)
      : [];

  const wordCount =
    words.length;

  let contentStatus = "good";

  if (wordCount === 0) {
    contentStatus = "missing";
  } else if (wordCount < 300) {
    contentStatus = "warning";
  }


  /* =======================================================
     13. LANG ATTRIBUTE
  ======================================================= */

  const language =
    $("html")
      .attr("lang")
      ?.trim() || null;


  /* =======================================================
     14. FAVICON
  ======================================================= */

  const favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    null;


  /* =======================================================
     15. HTML LANGUAGE / BASIC DOCUMENT INFO
  ======================================================= */

  const doctype =
    html
      .slice(0, 300)
      .toLowerCase()
      .includes("<!doctype html>");


  /* =======================================================
     SEO DATA
  ======================================================= */

  return {
    title: {
      value: title,
      length: titleLength,
      status: titleStatus,
    },

    metaDescription: {
      value: metaDescription,
      length: metaDescriptionLength,
      status: metaDescriptionStatus,
    },

    headings: {
      h1Count: h1.length,
      h1,

      h2Count: h2.length,
      h2,

      h3Count: h3.length,
      h3,
    },

    images: {
      total: images.length,
      withoutAlt: imagesWithoutAlt,
      withAlt:
        images.length - imagesWithoutAlt,
      details: imageDetails,
    },

    links: {
      total: links.length,
      internal: internalLinks,
      external: externalLinks,
      details: linkDetails,
    },

    canonical,

    openGraph: {
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
    },

    robotsMeta: robots,

    technical: {
      https: {
        enabled: isHttps,
        status:
          isHttps
            ? "good"
            : "warning",
      },

      mobile: {
        viewport,
        friendly: mobileFriendly,
        status:
          mobileFriendly
            ? "good"
            : "warning",
      },

      schema: {
        found: hasSchema,
        count: schemas.length,
        invalidCount:
          invalidSchemaCount,
        types: schemaTypes,
      },

      content: {
        wordCount,
        status: contentStatus,
      },

      language: {
        value: language,
        found: Boolean(language),
      },

      favicon: {
        value: favicon,
        found: Boolean(favicon),
      },

      doctype: {
        found: doctype,
      },
    },
  };
}


/* =========================================================
   CHECK ROBOTS.TXT
========================================================= */

async function checkRobotsTxt(
  websiteUrl
) {
  const robotsTxt = {
    found: false,
    statusCode: null,
    url:
      `${websiteUrl.origin}/robots.txt`,
    content: "",
    sitemapUrls: [],
  };

  try {
    const robotsResponse =
      await axios.get(
        robotsTxt.url,
        {
          timeout:
            SMALL_REQUEST_TIMEOUT,

          headers: {
            "User-Agent":
              SEO_USER_AGENT,
          },

          validateStatus:
            () => true,
        }
      );

    robotsTxt.statusCode =
      robotsResponse.status;

    robotsTxt.found =
      robotsResponse.status >= 200 &&
      robotsResponse.status < 300;

    if (robotsTxt.found) {
      const content =
        typeof robotsResponse.data ===
        "string"
          ? robotsResponse.data
          : "";

      robotsTxt.content =
        content.slice(0, 20000);

      const lines =
        content.split(/\r?\n/);

      robotsTxt.sitemapUrls =
        lines
          .map((line) =>
            line.trim()
          )
          .filter((line) =>
            /^sitemap\s*:/i.test(
              line
            )
          )
          .map((line) =>
            line
              .replace(
                /^sitemap\s*:/i,
                ""
              )
              .trim()
          )
          .filter(Boolean);
    }
  } catch {
    robotsTxt.found = false;
    robotsTxt.statusCode = null;
  }

  return robotsTxt;
}


/* =========================================================
   CHECK SITEMAP
========================================================= */

async function checkSitemap(
  websiteUrl,
  robotsTxt
) {
  const possibleSitemaps = [
    `${websiteUrl.origin}/sitemap.xml`,
    `${websiteUrl.origin}/sitemap_index.xml`,
    `${websiteUrl.origin}/sitemap-index.xml`,
  ];

  if (
    robotsTxt?.sitemapUrls?.length
  ) {
    possibleSitemaps.push(
      ...robotsTxt.sitemapUrls
    );
  }

  const uniqueSitemaps =
    [
      ...new Set(
        possibleSitemaps
      ),
    ];

  for (
    const sitemapUrl of uniqueSitemaps
  ) {
    try {
      const sitemapResponse =
        await axios.get(
          sitemapUrl,
          {
            timeout:
              SMALL_REQUEST_TIMEOUT,

            headers: {
              "User-Agent":
                SEO_USER_AGENT,
            },

            validateStatus:
              () => true,
          }
        );

      const contentType =
        sitemapResponse
          .headers[
          "content-type"
        ] || "";

      const sitemapBody =
        typeof sitemapResponse.data ===
        "string"
          ? sitemapResponse.data
          : "";

      const isXml =
        contentType
          .toLowerCase()
          .includes("xml") ||
        sitemapBody
          .toLowerCase()
          .includes("<urlset") ||
        sitemapBody
          .toLowerCase()
          .includes("<sitemapindex");

      const found =
        sitemapResponse.status >= 200 &&
        sitemapResponse.status < 300 &&
        isXml;

      if (found) {
        return {
          found: true,
          statusCode:
            sitemapResponse.status,
          url: sitemapUrl,
          type:
            sitemapBody
              .toLowerCase()
              .includes(
                "<sitemapindex"
              )
              ? "sitemapindex"
              : "urlset",
        };
      }
    } catch {
      // Try next sitemap URL
    }
  }

  return {
    found: false,
    statusCode: null,
    url:
      `${websiteUrl.origin}/sitemap.xml`,
    type: null,
  };
}


/* =========================================================
   SECURITY HEADERS
========================================================= */

function analyzeSecurityHeaders(
  response
) {
  const headers =
    response.headers || {};

  const headerChecks = {
    strictTransportSecurity:
      Boolean(
        headers[
          "strict-transport-security"
        ]
      ),

    contentSecurityPolicy:
      Boolean(
        headers[
          "content-security-policy"
        ]
      ),

    xContentTypeOptions:
      Boolean(
        headers[
          "x-content-type-options"
        ]
      ),

    xFrameOptions:
      Boolean(
        headers[
          "x-frame-options"
        ]
      ),

    referrerPolicy:
      Boolean(
        headers[
          "referrer-policy"
        ]
      ),

    permissionsPolicy:
      Boolean(
        headers[
          "permissions-policy"
        ]
      ),
  };

  const foundCount =
    Object.values(
      headerChecks
    ).filter(Boolean).length;

  const totalCount =
    Object.keys(
      headerChecks
    ).length;

  return {
    ...headerChecks,
    foundCount,
    totalCount,
    score: Math.round(
      (foundCount /
        totalCount) *
        100
    ),
  };
}


/* =========================================================
   ANALYZE WEBSITE
========================================================= */

router.post(
  "/analyze",
  async (req, res) => {
    try {
      const { url } =
        req.body || {};

      /* -----------------------------------------------
         URL VALIDATION
      ------------------------------------------------ */

      const validation =
        validateWebsiteUrl(url);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message:
            validation.message,
        });
      }

      const websiteUrl =
        validation.url;

      /* -----------------------------------------------
         FETCH WEBSITE
      ------------------------------------------------ */

      const response =
        await fetchWebsite(
          websiteUrl.href
        );

      const html =
        typeof response.data ===
        "string"
          ? response.data
          : "";

      if (!html) {
        return res.status(400).json({
          success: false,
          message:
            "The website did not return readable HTML content.",
        });
      }

      /* -----------------------------------------------
         ANALYZE HTML
      ------------------------------------------------ */

      const seoData =
        analyzeHTML(
          html,
          websiteUrl
        );

      /* -----------------------------------------------
         ROBOTS.TXT
      ------------------------------------------------ */

      const robotsTxt =
        await checkRobotsTxt(
          websiteUrl
        );

      /* -----------------------------------------------
         SITEMAP
      ------------------------------------------------ */

      const sitemap =
        await checkSitemap(
          websiteUrl,
          robotsTxt
        );

      /* -----------------------------------------------
         SECURITY HEADERS
      ------------------------------------------------ */

      const securityHeaders =
        analyzeSecurityHeaders(
          response
        );

      /* -----------------------------------------------
         ADD TECHNICAL DATA
      ------------------------------------------------ */

      seoData.technical.robotsTxt =
        robotsTxt;

      seoData.technical.sitemap =
        sitemap;

      seoData.technical.securityHeaders =
        securityHeaders;

      /* -----------------------------------------------
         CALCULATE SCORE
      ------------------------------------------------ */

      const scoreResult =
        calculateSEOScore(
          seoData
        );

      /* -----------------------------------------------
         FINAL RESPONSE
      ------------------------------------------------ */

      const result = {
        success: true,

        website: {
          url: websiteUrl.href,

          statusCode:
            response.status,

          contentType:
            response.headers[
              "content-type"
            ] || null,

          finalUrl:
            response.request
              ?.res
              ?.responseUrl ||
            websiteUrl.href,
        },

        seo: seoData,

        score:
          scoreResult.score,

        rating:
          scoreResult.rating,

        rawScore:
          scoreResult.rawScore,

        maxScore:
          scoreResult.maxScore,

        categoryScores:
          scoreResult.categoryScores,

        summary:
          scoreResult.summary,

        issues:
          scoreResult.issues,

        passed:
          scoreResult.passed,
      };

      return res.json(
        result
      );
    } catch (error) {
      console.error(
        "SEO analysis error:",
        error.message
      );

      let message =
        "Unable to analyze website.";

      if (
        error.code ===
        "ECONNABORTED"
      ) {
        message =
          "Website request timed out. Please try again.";
      } else if (
        error.code ===
        "ENOTFOUND"
      ) {
        message =
          "Website domain could not be found.";
      } else if (
        error.response
      ) {
        message =
          `Website returned HTTP ${error.response.status}.`;
      }

      return res.status(500).json({
        success: false,
        message,
        error:
          error.message,
      });
    }
  }
);


/* =========================================================
   MULTI-PAGE CRAWLER
========================================================= */

router.post(
  "/crawl",
  async (req, res) => {
    try {
      const {
        url,
        maxPages = 10,
      } = req.body || {};

      /* -----------------------------------------------
         URL VALIDATION
      ------------------------------------------------ */

      const validation =
        validateWebsiteUrl(url);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message:
            validation.message,
        });
      }

      const websiteUrl =
        validation.url;

      /* -----------------------------------------------
         PAGE LIMIT
      ------------------------------------------------ */

      const pageLimit = Math.min(
        Math.max(
          Number(maxPages) || 10,
          1
        ),
        10
      );

      const visited =
        new Set();

      const queue = [
        websiteUrl.href,
      ];

      const pages = [];

      const errors = [];

      /* -----------------------------------------------
         CRAWL LOOP
      ------------------------------------------------ */

      while (
        queue.length > 0 &&
        pages.length < pageLimit
      ) {
        const currentUrl =
          queue.shift();

        if (
          visited.has(currentUrl)
        ) {
          continue;
        }

        visited.add(
          currentUrl
        );

        try {
          const response =
            await fetchWebsite(
              currentUrl,
              REQUEST_TIMEOUT
            );

          const html =
            typeof response.data ===
            "string"
              ? response.data
              : "";

          if (!html) {
            errors.push({
              url: currentUrl,
              error:
                "No readable HTML content found.",
            });

            continue;
          }

          const pageUrl =
            new URL(
              currentUrl
            );

          const seoData =
            analyzeHTML(
              html,
              pageUrl
            );

          /* ---------------------------------------------
             Technical checks for crawled page
          --------------------------------------------- */

          const robotsTxt =
            pages.length === 0
              ? await checkRobotsTxt(
                  websiteUrl
                )
              : {
                  found: false,
                  statusCode: null,
                  url:
                    `${websiteUrl.origin}/robots.txt`,
                  content: "",
                  sitemapUrls: [],
                };

          const sitemap =
            pages.length === 0
              ? await checkSitemap(
                  websiteUrl,
                  robotsTxt
                )
              : {
                  found: false,
                  statusCode: null,
                  url:
                    `${websiteUrl.origin}/sitemap.xml`,
                  type: null,
                };

          seoData.technical.robotsTxt =
            robotsTxt;

          seoData.technical.sitemap =
            sitemap;

          seoData.technical.securityHeaders =
            analyzeSecurityHeaders(
              response
            );

          /* ---------------------------------------------
             Calculate page score
          --------------------------------------------- */

          const scoreResult =
            calculateSEOScore(
              seoData
            );

          pages.push({
            url: currentUrl,

            title:
              seoData.title.value ||
              "Untitled page",

            score:
              scoreResult.score,

            rating:
              scoreResult.rating,

            issues:
              scoreResult.issues,

            passed:
              scoreResult.passed,

            seo: seoData,
          });

          /* ---------------------------------------------
             DISCOVER INTERNAL LINKS
          --------------------------------------------- */

          const $ =
            cheerio.load(
              html
            );

          $("a[href]").each(
            (i, el) => {
              if (
                queue.length >=
                pageLimit * 3
              ) {
                return;
              }

              const href =
                $(el)
                  .attr("href")
                  ?.trim();

              if (!href) {
                return;
              }

              try {
                const linkUrl =
                  new URL(
                    href,
                    currentUrl
                  );

                /* Only HTTP/HTTPS */
                if (
                  ![
                    "http:",
                    "https:",
                  ].includes(
                    linkUrl.protocol
                  )
                ) {
                  return;
                }

                /* Only same domain */
                if (
                  linkUrl.hostname !==
                  websiteUrl.hostname
                ) {
                  return;
                }

                /* Remove hash */
                linkUrl.hash = "";

                const normalizedUrl =
                  linkUrl.href;

                if (
                  !visited.has(
                    normalizedUrl
                  ) &&
                  !queue.includes(
                    normalizedUrl
                  )
                ) {
                  queue.push(
                    normalizedUrl
                  );
                }
              } catch {
                // Ignore invalid links
              }
            }
          );
        } catch (error) {
          errors.push({
            url: currentUrl,

            error:
              error.message ||
              "Unable to crawl this page.",
          });
        }
      }

      /* -----------------------------------------------
         AVERAGE SCORE
      ------------------------------------------------ */

      const totalScore =
        pages.reduce(
          (sum, page) =>
            sum +
            Number(
              page.score || 0
            ),
          0
        );

      const averageScore =
        pages.length > 0
          ? Math.round(
              totalScore /
                pages.length
            )
          : 0;

      /* -----------------------------------------------
         CRAWL RESULT
      ------------------------------------------------ */

      return res.json({
        success: true,

        website: {
          url:
            websiteUrl.href,
        },

        pagesCrawled:
          pages.length,

        requestedPages:
          pageLimit,

        averageScore,

        pages,

        errors,

        summary: {
          totalPages:
            pages.length,

          totalErrors:
            errors.length,

          averageScore,

          maxPages:
            pageLimit,
        },
      });
    } catch (error) {
      console.error(
        "Crawl error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to crawl website.",
        error:
          error.message,
      });
    }
  }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;