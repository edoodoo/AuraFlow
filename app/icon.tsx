import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 512,
  height: 512,
};

export default function Icon() {
  const iconSize = 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, rgba(56,189,248,0.85), transparent 34%), radial-gradient(circle at bottom right, rgba(139,92,246,0.9), transparent 40%), linear-gradient(180deg, #0b1220 0%, #08111f 100%)",
          borderRadius: iconSize * 0.22,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "72%",
            height: "72%",
            borderRadius: iconSize * 0.18,
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 24px 60px rgba(2,6,23,0.38)",
            color: "white",
            fontSize: iconSize * 0.34,
            fontWeight: 700,
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          A
        </div>
      </div>
    ),
    {
      width: iconSize,
      height: iconSize,
    },
  );
}
