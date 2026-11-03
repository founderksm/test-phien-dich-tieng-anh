import { ImageResponse } from "next/og";

export function renderIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f5c4d",
          color: "#ffffff",
          fontSize: size * 0.42,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        KS
      </div>
    ),
    { width: size, height: size },
  );
}
