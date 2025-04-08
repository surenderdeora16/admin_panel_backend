"use client"

import type React from "react"

import { useState, useCallback, type CSSProperties } from "react"
import { toast } from "react-toastify"
import AxiosHelper from "./AxiosHelper"

interface StatusProps {
  data_id: string | number
  status: number
  table: string
}

// Define styles as JavaScript objects for CSS-in-JS approach
const styles = {
  button: (isActive: boolean, isLoading: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    transition: "all 0.2s ease",
    cursor: isLoading ? "wait" : "pointer",
    opacity: isLoading ? 0.7 : 1,
    backgroundColor: isActive ? "rgba(220, 252, 231, 1)" : "rgba(254, 226, 226, 1)",
    color: isActive ? "rgba(22, 101, 52, 1)" : "rgba(185, 28, 28, 1)",
    border: "none",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    outline: "none",
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
    // ":hover" pseudo-class styles should be moved to the JSX style block
  }),
  focusRing: {
    position: "absolute",
    inset: "-3px",
    borderRadius: "9999px",
    pointerEvents: "none",
    border: "2px solid transparent",
    transition: "border-color 0.2s ease",
  },
  iconContainer: (isActive: boolean): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    backgroundColor: isActive ? "rgba(34, 197, 94, 1)" : "rgba(239, 68, 68, 1)",
    color: "white",
    flexShrink: 0,
  }),
  spinnerContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    flexShrink: 0,
  },
  ripple: {
    position: "absolute",
    borderRadius: "50%",
    transform: "scale(0)",
    animation: "ripple 0.6s linear",
    backgroundColor: "currentColor",
    opacity: 0.3,
  },
}

const Status = ({ data_id, status: defaultStatus, table }: StatusProps) => {
  const [status, setStatus] = useState(defaultStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  const isActive = status === 1

  // Handle ripple effect on click
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const diameter = Math.max(button.clientWidth, button.clientHeight)
    const radius = diameter / 2

    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left - radius
    const y = event.clientY - rect.top - radius

    const newRipple = {
      id: Date.now(),
      x,
      y,
    }

    setRipples([...ripples, newRipple])

    // Clean up ripples after animation
    setTimeout(() => {
      setRipples((currentRipples) => currentRipples.filter((ripple) => ripple.id !== newRipple.id))
    }, 600)
  }

  const toggleStatus = useCallback(async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      const { data } = await AxiosHelper.deleteData(`toggle-status/${table}/${data_id}`)

      if (data?.status === true) {
        const newStatus = status === 1 ? 2 : 1
        setStatus(newStatus)
        toast.success(`Status ${isActive ? "In-activate" : "activate"} successfully`)
      } else {
        toast.error(data?.message || "Failed to update status")
      }
    } catch (error) {
      console.error("Error toggling status:", error)
      toast.error("An error occurred while updating status")
    } finally {
      setIsLoading(false)
    }
  }, [data_id, isLoading, status, table])

  // Render check icon for active status
  const renderCheckIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  // Render x icon for inactive status
  const renderXIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 6L18 18M6 18L18 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  // Render loading spinner
  const renderSpinner = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        animation: "spin 1s linear infinite",
      }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" fill="none" />
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12C2 12.6343 2.06115 13.2546 2.17873 13.8557"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        button:hover {
          background-color: ${isActive ? "rgba(187, 247, 208, 1)" : "rgba(254, 202, 202, 1)"};
        button:hover {
          background-color: rgba(187, 247, 208, 1);
        }
        button[aria-pressed="false"]:hover {
          background-color: rgba(254, 202, 202, 1);
        }
          outline-offset: 2px;
        }
      `}</style>

      <button
        onClick={(e) => {
          createRipple(e)
          toggleStatus()
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={isLoading}
        aria-pressed={isActive}
        aria-busy={isLoading}
        aria-live="polite"
        type="button"
        style={styles.button(isActive, isLoading)}
      >
        {isLoading ? (
          <>
            <div style={styles.spinnerContainer}>{renderSpinner()}</div>
            <span>Updating...</span>
          </>
        ) : (
          <>
            <span>{isActive ? "Active" : "Inactive"}</span>
            <div style={styles.iconContainer(isActive)}>{isActive ? renderCheckIcon() : renderXIcon()}</div>
          </>
        )}

        {/* Focus ring */}
        <div
          style={{
            ...styles.focusRing,
            borderColor: isFocused ? (isActive ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)") : "transparent",
          } as React.CSSProperties}
        />

        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            style={{
              ...styles.ripple,
              left: ripple.x,
              top: ripple.y,
              width: "100px",
              height: "100px",
            }}
          />
        ))}
      </button>
    </>
  )
}

export default Status
