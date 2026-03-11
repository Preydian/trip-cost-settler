import * as cheerio from "cheerio";

export class ScrapeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ScrapeError";
    this.status = status;
  }
}

export async function scrapeJobPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Sec-Ch-Ua": '"Chromium";v="131", "Not_A Brand";v="24"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new ScrapeError(
      `This site blocked automated access (${response.status}). Please copy the job description and paste it manually instead.`,
      response.status
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, nav, footer, header, iframe, noscript, svg, img").remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();

  // Try to find the main content area
  const mainContent =
    $("main").text() ||
    $('[role="main"]').text() ||
    $("article").text() ||
    $(".job-description, .job-details, .posting-page, #job-content").text() ||
    $("body").text();

  const title = $("title").text().trim();

  // Clean up whitespace
  const cleanedText = mainContent
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  const result = title ? `Page Title: ${title}\n\n${cleanedText}` : cleanedText;

  // Truncate to ~15k characters to keep costs reasonable
  return result.slice(0, 15000);
}
