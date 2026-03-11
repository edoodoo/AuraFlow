import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AuraFlow",
    short_name: "AuraFlow",
    description: "Controle financeiro compartilhado com foco mobile-first, dashboard premium e uso diário.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#08111f",
    theme_color: "#08111f",
    lang: "pt-BR",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
