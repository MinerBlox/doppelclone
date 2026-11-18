import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      borderRadius: 6,
      background: "#17171b",
      color: "#ffffff",
      fontSize: 23,
      fontWeight: 700,
    }}>F</div>,
    size,
  );
}
