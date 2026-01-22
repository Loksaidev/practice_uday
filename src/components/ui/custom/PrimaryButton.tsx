import React from "react";

export default function PrimaryButton({
  text,
  bg_color,
  color,
  border_color,
  icon,
  font_size,
  padding,
  className,
  width,
}: {
  text: string;
  bg_color: string;
  color?: string;
  border_color?: string;
  icon?: string | React.ReactNode;
  font_size?: string;
  padding?: string;
  className?: string;
  width?: string;
}) {
  const isIconString = typeof icon === "string";
  const isImagePath =
    isIconString &&
    (icon.startsWith("/") ||
      icon.startsWith("./") ||
      icon.startsWith("../") ||
      /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(icon));

  return (
    <div
      style={{
        backgroundColor: bg_color || "#ffffff",
        color: color || "#000000",
        padding: padding || "4px 20px",
        borderRadius: "50px",
        fontWeight: "bold",
        textAlign: "center",
        cursor: "pointer",
        fontSize: font_size || "16px",
        border: border_color || "3px solid #fcc804",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 4px 4px 0 rgba(0,0,0,0.25)",
        width: width || "fit-content",
      }}
      className={`font-heading ${className}`}
    >
      {icon && (
        <>
          {isImagePath ? (
            <img
              src={icon}
              alt=""
              style={{
                width: "16px",
                height: "16px",
                objectFit: "contain",
              }}
            />
          ) : (
            <span>{icon}</span>
          )}
        </>
      )}
      {text}
    </div>
  );
}
