import React from 'react';

const ChatIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="7" width="18" height="2" fill="currentColor"/>
    <rect x="3" y="19" width="18" height="2" fill="currentColor"/>
    <rect x="3" y="9" width="2" height="10" fill="currentColor"/>
    <rect x="19" y="9" width="2" height="10" fill="currentColor"/>
    <rect x="1" y="13" width="2" height="2" fill="currentColor"/>
    <rect x="21" y="13" width="2" height="2" fill="currentColor"/>
    <rect x="11" y="5" width="2" height="2" fill="currentColor"/>
    <rect x="7" y="3" width="4" height="2" fill="currentColor"/>
    <rect x="8" y="12" width="2" height="4" fill="currentColor"/>
    <rect x="14" y="12" width="2" height="4" fill="currentColor"/>
  </svg>
);

export default ChatIcon;
