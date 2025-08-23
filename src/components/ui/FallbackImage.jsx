// src/components/ui/FallbackImage.jsx
import React from "react";

/**
 * <FallbackImage src="..." alt="..." />
 * src xato bo‘lsa yoki bo‘sh bo‘lsa => /no-image.png
 */
export default function FallbackImage({ src, alt = "", ...rest }) {
  const FALLBACK = "/no-image.png";

  const onErr = (e) => {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = "1";
    img.src = FALLBACK;
  };

  return <img src={src || FALLBACK} alt={alt} onError={onErr} {...rest} />;
}
