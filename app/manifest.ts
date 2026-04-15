import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Layar BoxOffice",
    short_name: "Layar BoxOffice",
    description:
      "Mini App Telegram untuk nonton film Box Office langsung dari Telegram.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    orientation: "portrait",
    lang: "id-ID",
    categories: ["entertainment", "video"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
