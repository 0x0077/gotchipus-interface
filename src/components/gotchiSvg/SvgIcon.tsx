"use client";

/* eslint-disable @next/next/no-img-element */

interface SvgIconProps {
  svgString?: string | null | undefined;
  imagePath?: string | null | undefined;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SvgIcon = ({ svgString, imagePath, alt, width, height, className, style }: SvgIconProps) => {
  if (imagePath) {
    return (
      <img
        src={imagePath}
        alt={alt || "Wearable Icon"}
        width={width}
        height={height}
        className={className}
        style={style}
      />
    );
  }

  if (svgString) {
    const viewBox = "0 0 80 80";
    const completeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%">${svgString}</svg>`;
    return (
      <div
        className={className}
        style={{ width, height, overflow: 'hidden', ...style }}
        title={alt}
        dangerouslySetInnerHTML={{ __html: completeSvg }}
      />
    );
  }

  return null;
};

export default SvgIcon;