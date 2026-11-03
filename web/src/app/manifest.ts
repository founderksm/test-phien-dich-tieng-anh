import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KSMLOOK Phiên dịch",
    short_name: "Phiên dịch",
    description: "Kho câu mẫu và thuật ngữ phiên dịch thương mại Việt – Anh – Trung",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f7f4",
    theme_color: "#0f5c4d",
    lang: "vi",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
