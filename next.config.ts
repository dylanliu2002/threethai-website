import type { NextConfig } from "next";

/**
 * Legacy URL redirect map — closes the loop on the old-site → new-site SEO
 * migration. Search engines still hold a large index of the previous
 * (.html-era) site generation: /product_detail_en/id/73.html, /product_e.html,
 * /wap_index.html and their siblings. Per Google's site-move guidance every
 * legacy URL must 301/308 to the closest equivalent page — never blanket-map
 * to the homepage (soft-404 risk).
 *
 * Rule design:
 *  - Section-level exact matches map each legacy family to its new section.
 *  - Product DETAIL ids are mapped at section level (/products) until the
 *    exact id→product inventory is exported from Search Console / Bing WMT
 *    ("Pages → Not found"), after which per-id rules can be prepended here.
 *  - All redirects are permanent (308); Google treats 308 like 301 for
 *    consolidation. Keep these rules in place for at least one year.
 */
const legacyRedirects = [
  // — Entry points —
  { source: "/index.html", destination: "/", permanent: true },
  { source: "/index_en.html", destination: "/", permanent: true },
  { source: "/index_zh.html", destination: "/zh", permanent: true },
  { source: "/index_cn.html", destination: "/zh", permanent: true },
  { source: "/home.html", destination: "/", permanent: true },
  { source: "/wap_index.html", destination: "/", permanent: true },
  { source: "/wap_index_en.html", destination: "/", permanent: true },

  // — Product listings —
  { source: "/product_e.html", destination: "/products", permanent: true },
  { source: "/product.html", destination: "/zh/products", permanent: true },
  { source: "/product_c.html", destination: "/zh/products", permanent: true },
  { source: "/products.html", destination: "/products", permanent: true },
  { source: "/wap_product.html", destination: "/products", permanent: true },
  { source: "/wap_product_e.html", destination: "/products", permanent: true },

  // — Product detail pages (per-id map pending GSC export) —
  { source: "/product_detail_en/:rest*", destination: "/products", permanent: true },
  { source: "/product_detail_zh/:rest*", destination: "/zh/products", permanent: true },
  { source: "/product_detail.html", destination: "/products", permanent: true },
  { source: "/wap_product_detail/:rest*", destination: "/products", permanent: true },
  { source: "/wap_product_detail.html", destination: "/products", permanent: true },

  // — News / articles —
  { source: "/news.html", destination: "/knowledge", permanent: true },
  { source: "/news_e.html", destination: "/knowledge", permanent: true },
  { source: "/news_en.html", destination: "/knowledge", permanent: true },
  { source: "/news_detail/:rest*", destination: "/knowledge", permanent: true },
  { source: "/news_detail.html", destination: "/knowledge", permanent: true },
  { source: "/wap_news.html", destination: "/knowledge", permanent: true },
  { source: "/wap_news_detail/:rest*", destination: "/knowledge", permanent: true },

  // — Company / about —
  { source: "/about.html", destination: "/about", permanent: true },
  { source: "/about_e.html", destination: "/about", permanent: true },
  { source: "/about_en.html", destination: "/about", permanent: true },
  { source: "/aboutus.html", destination: "/about", permanent: true },
  { source: "/aboutus_en.html", destination: "/about", permanent: true },
  { source: "/wap_about.html", destination: "/about", permanent: true },

  // — Honors / certificates —
  { source: "/honor.html", destination: "/quality", permanent: true },
  { source: "/honor_e.html", destination: "/quality", permanent: true },
  { source: "/honors.html", destination: "/quality", permanent: true },
  { source: "/certificate.html", destination: "/quality", permanent: true },
  { source: "/certificate_en.html", destination: "/quality", permanent: true },

  // — Factory / equipment —
  { source: "/factory.html", destination: "/manufacturing", permanent: true },
  { source: "/factory_en.html", destination: "/manufacturing", permanent: true },
  { source: "/workshop.html", destination: "/manufacturing", permanent: true },
  { source: "/equipment.html", destination: "/manufacturing", permanent: true },
  { source: "/equipment_en.html", destination: "/manufacturing", permanent: true },

  // — Contact —
  { source: "/contact.html", destination: "/contact", permanent: true },
  { source: "/contact_e.html", destination: "/contact", permanent: true },
  { source: "/contact_en.html", destination: "/contact", permanent: true },
  { source: "/contactus.html", destination: "/contact", permanent: true },
  { source: "/wap_contact.html", destination: "/contact", permanent: true },

  // — Inquiry forms —
  { source: "/feedback.html", destination: "/request-quote", permanent: true },
  { source: "/feedback_en.html", destination: "/request-quote", permanent: true },
  { source: "/message.html", destination: "/request-quote", permanent: true },
  { source: "/inquiry.html", destination: "/request-quote", permanent: true },

  // — Mobile-site residue (common names; families above already matched) —
  { source: "/wap_home.html", destination: "/", permanent: true },
  { source: "/wap_news_e.html", destination: "/knowledge", permanent: true },
  { source: "/wap_honor.html", destination: "/quality", permanent: true },
  { source: "/wap_feedback.html", destination: "/request-quote", permanent: true },
  { source: "/wap_message.html", destination: "/request-quote", permanent: true },
  { source: "/wap_factory.html", destination: "/manufacturing", permanent: true },
  { source: "/wap_aboutus.html", destination: "/about", permanent: true },
  { source: "/wap_contactus.html", destination: "/contact", permanent: true },
];

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  reactStrictMode: false,
  async redirects() {
    return legacyRedirects;
  },
};

export default nextConfig;
