"use client"

import { useSyncExternalStore } from "react"

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange)
  return () => document.removeEventListener("fullscreenchange", onChange)
}

function getSnapshot() {
  return !!document.fullscreenElement
}

/**
 * Tracks the document's fullscreen state and exposes actions to enter, exit, or toggle it.
 *
 * @returns the current fullscreen state and the actions to change it
 */
export function useFullscreen() {
  const isFullscreen = useSyncExternalStore(subscribe, getSnapshot)

  const enterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error)
    }
  }

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error)
    }
  }

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}
