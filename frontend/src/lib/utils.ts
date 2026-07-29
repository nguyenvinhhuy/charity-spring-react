import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind class names, resolving conflicts via tailwind-merge.
 *
 * @param inputs the class values to combine
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves the given path to a public asset URL, respecting the Vite base path for dev and prod.
 *
 * @param path the asset path relative to the public root
 */
export function assetUrl(path: string): string {
  const baseUrl = import.meta.env.BASE_URL || "/"
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return baseUrl + cleanPath
}

/**
 * Builds the internal navigation path prefixed with the app's basename.
 *
 * @param path the internal path (e.g. "/dashboard", "/auth/sign-in")
 */
export function getAppUrl(path: string): string {
  const basename = import.meta.env.VITE_BASENAME || ""
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return basename + cleanPath
}
