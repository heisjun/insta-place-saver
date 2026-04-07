import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "InstaPlaceSaver",
    short_name: "맛집지도",
    description: "인스타그램 맛집을 지도에 저장",
    start_url: "/map",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    // Android Chrome 공유 시트 등록
    // 인스타그램 URL 공유 시 /add?shared_url=... 로 전달
    share_target: {
      action: "/add",
      method: "GET",
      params: {
        url: "shared_url",
        text: "shared_text",
        title: "shared_title",
      },
    },
  };
}
