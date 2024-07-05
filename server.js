/**
 * Express server for scraping product reviews from Amazon.
 */

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const NodeCache = require("node-cache");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const crawlbaseUrl = "https://api.crawlbase.com/";
const token = process.env.API_KEY || "nB-dswOiI5a6Wmhyn6Kh8w"; // Your Crawlbase API token
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 120 });

app.use(express.json());

/**
 * API endpoint to search for product reviews.
 */
app.post("/api/search/product/reviews", async (req, res) => {
  try {
    const asin = req.body.asin;
    console.log(`ASIN from front-end: ${asin}`);

    // Check if data is cached
    let allReviews = await cache.get(asin);
    if (!allReviews) {
      console.log("Data not found in cache. Fetching reviews...");
      const html = await getHtml(
        `https://www.amazon.com/product-reviews/${asin}`
      );
      allReviews = extractDataFromHtml(html);
      cache.set(asin, allReviews);
    } else {
      console.log("Data found in cache. Serving from cache.");
    }

    res.status(200).json({
      message: "Reviews Scrapped Successfully",
      scrapedData: allReviews,
    });
  } catch (error) {
    console.error("Error while processing the ASIN:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * API endpoint to perform competitor analysis.
 */
app.post("/api/competitor/analysis", async (req, res) => {
  try {
    const { asin1, asin2 } = req.body;
    let reviews1 = cache.get(asin1);
    let reviews2 = cache.get(asin2);

    // Fetch HTML content for URLs concurrently if reviews are not in the cache
    if (!reviews1 && !reviews2) {
      console.log(`Fetching reviews for both ASINs: ${asin1} and ${asin2}`);
      const [html1, html2] = await Promise.all([
        getHtml(`https://www.amazon.com/product-reviews/${asin1}`),
        getHtml(`https://www.amazon.com/product-reviews/${asin2}`),
      ]);
      reviews1 = extractDataFromHtml(html1);
      reviews2 = extractDataFromHtml(html2);
      cache.set(asin1, reviews1);
      cache.set(asin2, reviews2);
      console.log(
        `Reviews for ASINs ${asin1} and ${asin2} fetched and cached.`
      );
    } else if (!reviews1) {
      console.log(`Fetching reviews for ASIN ${asin1}`);
      const html1 = await getHtml(
        `https://www.amazon.com/product-reviews/${asin1}`
      );
      reviews1 = extractDataFromHtml(html1);
      cache.set(asin1, reviews1);
      console.log(`Reviews for ASIN ${asin1} fetched and cached.`);
    } else if (!reviews2) {
      console.log(`Fetching reviews for ASIN ${asin2}`);
      const html2 = await getHtml(
        `https://www.amazon.com/product-reviews/${asin2}`
      );
      reviews2 = extractDataFromHtml(html2);
      cache.set(asin2, reviews2);
      console.log(`Reviews for ASIN ${asin2} fetched and cached.`);
    }

    const analysisResult = {
      message: "Competitor Reviews Scrapped Successfully",
      product1: { asin: asin1, reviews: reviews1 },
      product2: { asin: asin2, reviews: reviews2 },
    };

    res.status(200).json(analysisResult);
  } catch (error) {
    console.error("Error performing competitor analysis:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Fetches HTML content from a given URL.
 *
 * @param {string} amazonReviewsURL - The URL to fetch HTML content from.
 * @returns {Promise<string>} - The HTML content of the URL.
 */
async function getHtml(amazonReviewsURL) {
  try {
    const apiUrl = `${crawlbaseUrl}?token=${token}&url=${encodeURIComponent(
      amazonReviewsURL
    )}`;
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching HTML:", error.message);
    throw new Error("Error fetching HTML");
  }
}

/**
 * Extracts review data from a given HTML content.
 *
 * @param {string} html - The HTML content to extract review data from.
 * @returns {Array<Object>} - An array of review data.
 */
function extractDataFromHtml(html) {
  const reviews = [];
  const $ = cheerio.load(html); // Load HTML using cheerio

  $('div[data-hook="review"]').each((index, element) => {
    try {
      const rating = $(element)
        .find('i[data-hook="review-star-rating"]')
        .text()
        .trim()
        .split(" ")[0];
      const reviewDate = $(element)
        .find('span[data-hook="review-date"]')
        .text()
        .trim();
      const reviewTitle = $(element)
        .find('a[data-hook="review-title"]')
        .text()
        .split(/\sout of\s\d\sstars/)[1]
        .trim();
      const imgSrc = $("img[data-hook='cr-product-image']").attr("src");
      const ratingText = $('[data-hook="rating-out-of-text"]')
        .text()
        .replace("out of 5", "");
      const productName = $('a[data-hook="product-link"]').text();
      let reviewBody = $(element)
        .find('span[data-hook="review-body"]')
        .text()
        .trim();

      // Split reviewBody into words
      const words = reviewBody.split(/\s+/);

      // Limit reviewBody to 100 words
      if (words.length > 100) {
        reviewBody = words.slice(0, 100).join(" ") + " ...";
      }

      const review = {
        rating,
        reviewTitle,
        reviewDate,
        reviewBody,
        imgSrc,
        ratingText,
        productName,
      };

      reviews.push(review);
    } catch (error) {
      console.error("Error while extracting data:", error);
      console.log("HTML:", html); // Log the HTML for debugging
    }
  });

  return reviews;
}

/**
 * Root endpoint.
 */
app.get("/", (req, res) => {
  res.send("APIs are Live");
});

/**
 * Starts the server.
 */
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
