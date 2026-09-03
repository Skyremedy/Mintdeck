"use client"

import { useState } from "react"

function initials(name: string): string {
  return name
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

/** Collection avatar that degrades to initials instead of a broken-image icon. */
export default function Logo({
  src,
  name,
  small = false,
}: {
  src: string
  name: string
  small?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const className = `logo${small ? " logo--sm" : ""}`

  if (!src || failed) {
    return (
      <div className={`${className} logo--fallback`} aria-hidden="true">
        {initials(name) || "?"}
      </div>
    )
  }

  return (
    // Logos are arbitrary remote URLs entered by the admin, so they skip the
    // image optimizer rather than requiring a remotePatterns entry per host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
