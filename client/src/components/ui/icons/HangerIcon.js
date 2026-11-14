// Clothes hanger traced from the thriftpedia logo (public/logo.svg): hook loop on top, then the
// triangular body. Same stroke style as the admin icons; size defaults to theirs (22px).
export function HangerIcon({ width = 22, height = 22, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 6a2.75 2.75 0 0 1 2.75 2.75c0 .8-.35 1.53-.9 2.03v.72l6.9 4.14a1.3 1.3 0 0 1-.67 2.41H3.92a1.3 1.3 0 0 1-.67-2.41l6.9-4.14v-.72a2.74 2.74 0 0 1-.9-2.03A2.75 2.75 0 0 1 12 6Z" />
    </svg>
  );
}
