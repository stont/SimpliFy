// icons.js - SVG icon definitions for auditory extension
// Usage: import or include this file and use getIcon('iconName') to inject SVG

export function getIcon(name) {
  switch (name) {
    case 'notifications':
      return `<svg fill="currentColor" height="24" width="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16z"></path></svg>`;
    case 'movie':
      return `<svg fill="currentColor" height="32" width="32" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 4l2 4h-3l-2-4h-4l2 4H6L4 4H2v16h20V4z"></path></svg>`;
    case 'info':
      return `<svg fill="currentColor" height="24" width="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>`;
    default:
      return '';
  }
}
