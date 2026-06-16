// No-op island. Its only job is to make Astro render a React island on
// the page, which forces @vitejs/plugin-react to inject the Fast-Refresh
// preamble in dev. Without a preamble, any React component loaded outside
// Astro's island system (our manual createRoot mounts for DotGrid /
// Grainient) throws "@vitejs/plugin-react can't detect preamble".
// Renders nothing.
export default function ReactReady() {
  return null;
}
