import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 180,
  height: 180,
};

export default function AppleIcon() {
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
            "linear-gradient(135deg, rgba(56,189,248,1) 0%, rgba(14,165,233,1) 32%, rgba(139,92,246,1) 100%)",
          borderRadius: 44,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 120,
            height: 120,
            borderRadius: 34,
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.22)",
            color: "white",
            fontSize: 72,
            fontWeight: 700,
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          A
        </div>
      </div>
    ),
    {
      width: 180,
      height: 180,
    },
  );
}
