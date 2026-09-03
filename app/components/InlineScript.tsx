/**
 * Renders a script that runs during HTML parsing on a hard navigation.
 *
 * On the server it emits real, executable JavaScript. On the client it becomes
 * `text/plain`, because scripts injected by React are never executed anyway —
 * emitting one there only produces a dev warning. `suppressHydrationWarning`
 * covers the resulting `type` mismatch.
 *
 * See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
export default function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
