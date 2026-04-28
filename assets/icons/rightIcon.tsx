import React from 'react';

const RightIcon = ({ width = 24, height = 24, color = '#000000', style = {} }: { width?: number; height?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default RightIcon;
