"use client"

import React from "react"
import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react"
import JoditEditor from "jodit-react"
import { debounce } from "lodash"

// Error Boundary Component for Jodit Editor
class JoditErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Jodit Editor Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="text-gray-500 mb-2">Editor failed to load</div>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Enhanced Upload Progress Component
const UploadProgressOverlay = memo(
  ({
    isUploading,
    progress,
    fileName,
    onCancel,
  }: {
    isUploading: boolean
    progress: number
    fileName: string
    onCancel: () => void
  }) => {
    if (!isUploading) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999]">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Uploading Image</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cancel upload"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm text-gray-700 truncate">{fileName}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Progress Text */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>{progress.toFixed(1)}% completed</span>
              <span>{progress < 100 ? "Uploading..." : "Processing..."}</span>
            </div>
          </div>

          {/* Upload Animation */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    )
  },
)

// Enhanced Upload Service
class UploadService {
  private static instance: UploadService
  private abortController: AbortController | null = null

  static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService()
    }
    return UploadService.instance
  }

  async uploadImage(
    file: File,
    onProgress: (progress: number) => void,
    uploadUrl: string,
    headers: Record<string, string> = {},
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return new Promise((resolve) => {
      this.abortController = new AbortController()

      const formData = new FormData()
      formData.append("file", file)

      const xhr = new XMLHttpRequest()

      // Progress tracking
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          onProgress(Math.min(progress, 95)) // Keep some buffer for processing
        }
      })

      // Success handler
      xhr.addEventListener("load", () => {
        onProgress(100)
        setTimeout(() => {
          try {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText)
              resolve({ success: true, data: response })
            } else {
              resolve({
                success: false,
                error: `Upload failed with status ${xhr.status}: ${xhr.statusText}`,
              })
            }
          } catch (error) {
            resolve({
              success: false,
              error: "Failed to parse server response",
            })
          }
        }, 500) // Small delay to show 100% completion
      })

      // Error handler
      xhr.addEventListener("error", () => {
        resolve({
          success: false,
          error: "Network error occurred during upload",
        })
      })

      // Abort handler
      xhr.addEventListener("abort", () => {
        resolve({
          success: false,
          error: "Upload was cancelled",
        })
      })

      // Timeout handler
      xhr.addEventListener("timeout", () => {
        resolve({
          success: false,
          error: "Upload timed out",
        })
      })

      // Configure request
      xhr.timeout = 60000 // 60 seconds timeout
      xhr.open("POST", uploadUrl)

      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      // Start upload
      xhr.send(formData)

      // Handle abort
      this.abortController.signal.addEventListener("abort", () => {
        xhr.abort()
      })
    })
  }

  cancelUpload(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
}

// Enhanced Notification System
const NotificationManager = {
  show: (message: string, type: "success" | "error" | "info" = "info", duration = 5000) => {
    // Create notification element
    const notification = document.createElement("div")
    notification.className = `
      fixed top-4 right-4 z-[999999] max-w-sm w-full
      ${type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"}
      text-white px-6 py-4 rounded-lg shadow-lg
      transform transition-all duration-300 ease-in-out
      translate-x-full opacity-0
    `

    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${
              type === "success"
                ? '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>'
                : type === "error"
                  ? '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>'
                  : '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
            }
          </svg>
          <span class="text-sm font-medium">${message}</span>
        </div>
        <button class="ml-4 text-white/80 hover:text-white" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)"
      notification.style.opacity = "1"
    }, 100)

    // Auto remove
    setTimeout(() => {
      notification.style.transform = "translateX(100%)"
      notification.style.opacity = "0"
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove()
        }
      }, 300)
    }, duration)
  },
}

// COMPLETELY ENHANCED Jodit Editor Component
const EnhancedJoditEditor = memo(
  ({
    form,
    field,
    disabled = false,
    height = "400",
    error = false,
    placeholder = "Start typing...",
    fieldIndex = 0,
    uploadUrl = "/api/upload-image",
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  }: {
    form: any
    field: any
    disabled?: boolean
    height?: string
    error?: boolean
    placeholder?: string
    fieldIndex?: number
    uploadUrl?: string
    maxFileSize?: number
    allowedTypes?: string[]
  }) => {
    const editorRef = useRef<any>(null)
    const containerRef = useRef<any>(null)
    const [content, setContent] = useState(field?.value || "")
    const [isMounted, setIsMounted] = useState(false)
    const [isEditorReady, setIsEditorReady] = useState(false)
    const focusTimeoutRef = useRef<any>(null)
    const uniqueId = `jodit-editor-${field?.name}-${fieldIndex}-${Math.random().toString(36).substr(2, 9)}`

    // Upload state management
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadFileName, setUploadFileName] = useState("")
    const uploadServiceRef = useRef(UploadService.getInstance())

    // Debounced content update
    const debouncedUpdate = useMemo(
      () =>
        debounce((newContent: string) => {
          if (newContent !== content && form && form.setFieldValue) {
            setContent(newContent)
            form.setFieldValue(field?.name, newContent)
          }
        }, 300),
      [form, field?.name, content],
    )

    // Initialize content and mount state
    useEffect(() => {
      setIsMounted(true)
      if (field?.value !== content) {
        setContent(field?.value || "")
      }
    }, [field?.value])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        debouncedUpdate.cancel()
        if (focusTimeoutRef.current) {
          clearTimeout(focusTimeoutRef.current)
        }
        uploadServiceRef.current.cancelUpload()
      }
    }, [debouncedUpdate])

    // Enhanced focus management
    const forceFocus = useCallback(() => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current)
      }

      focusTimeoutRef.current = setTimeout(() => {
        try {
          if (editorRef.current && editorRef.current.editor && isEditorReady && !isUploading) {
            editorRef.current.editor.focus()
            if (editorRef.current.selection) {
              editorRef.current.selection.setCursorToEnd()
            }
          }
        } catch (error) {
          console.warn("Focus error:", error)
        }
      }, 10)
    }, [isEditorReady, isUploading])

    // File validation
    const validateFile = useCallback(
      (file: File): { valid: boolean; error?: string } => {
        if (!allowedTypes.includes(file.type)) {
          return {
            valid: false,
            error: `File type not allowed. Supported types: ${allowedTypes.join(", ")}`,
          }
        }

        if (file.size > maxFileSize) {
          return {
            valid: false,
            error: `File size too large. Maximum size: ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`,
          }
        }

        return { valid: true }
      },
      [allowedTypes, maxFileSize],
    )

    // Enhanced image upload handler
    const handleImageUpload = useCallback(
      async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
        console.log("🖼️ Starting image upload:", file.name)

        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
          NotificationManager.show(validation.error!, "error")
          return { success: false, error: validation.error }
        }

        try {
          setIsUploading(true)
          setUploadProgress(0)
          setUploadFileName(file.name)

          const result = await uploadServiceRef.current.uploadImage(
            file,
            (progress) => {
              setUploadProgress(progress)
            },
            uploadUrl,
            {
              "x-api-key": import.meta.env?.VITE_LICENCE || "",
            },
          )

          if (result.success && result.data) {
            const imageUrl = result.data.url || result.data.path || result.data.data
            NotificationManager.show("Image uploaded successfully!", "success")
            console.log("✅ Image upload successful:", imageUrl)
            return { success: true, url: imageUrl }
          } else {
            throw new Error(result.error || "Upload failed")
          }
        } catch (error: any) {
          const errorMessage = error.message || "Failed to upload image"
          console.error("❌ Image upload failed:", errorMessage)
          NotificationManager.show(errorMessage, "error")
          return { success: false, error: errorMessage }
        } finally {
          setTimeout(() => {
            setIsUploading(false)
            setUploadProgress(0)
            setUploadFileName("")
            forceFocus() // Restore focus after upload
          }, 1000)
        }
      },
      [validateFile, uploadUrl, forceFocus],
    )

    // Cancel upload handler
    const handleCancelUpload = useCallback(() => {
      uploadServiceRef.current.cancelUpload()
      setIsUploading(false)
      setUploadProgress(0)
      setUploadFileName("")
      NotificationManager.show("Upload cancelled", "info")
      forceFocus()
    }, [forceFocus])

    // Comprehensive Math and Physics Symbols
    const mathPhysicsSymbols = [
      // Greek Letters (Uppercase)
      "Α",
      "Β",
      "Γ",
      "Δ",
      "Ε",
      "Ζ",
      "Η",
      "Θ",
      "Ι",
      "Κ",
      "Λ",
      "Μ",
      "Ν",
      "Ξ",
      "Ο",
      "Π",
      "Ρ",
      "Σ",
      "Τ",
      "Υ",
      "Φ",
      "Χ",
      "Ψ",
      "Ω",
      // Greek Letters (Lowercase)
      "α",
      "β",
      "γ",
      "δ",
      "ε",
      "ζ",
      "η",
      "θ",
      "ι",
      "κ",
      "λ",
      "μ",
      "ν",
      "ξ",
      "ο",
      "π",
      "ρ",
      "σ",
      "τ",
      "υ",
      "φ",
      "χ",
      "ψ",
      "ω",
      // Mathematical Operators
      "∑",
      "∏",
      "∫",
      "∮",
      "∂",
      "∇",
      "∆",
      "∞",
      "∝",
      "∴",
      "∵",
      "∀",
      "∃",
      "∄",
      "∈",
      "∉",
      "∋",
      "∌",
      "⊂",
      "⊃",
      "⊆",
      "⊇",
      "∪",
      "∩",
      // Comparison and Equality
      "≠",
      "≈",
      "≡",
      "≤",
      "≥",
      "≪",
      "≫",
      "≺",
      "≻",
      "≼",
      "≽",
      "≾",
      "≿",
      "⊀",
      "⊁",
      "⊄",
      "⊅",
      "⊈",
      "⊉",
      "⊊",
      "⊋",
      // Arithmetic
      "±",
      "∓",
      "×",
      "÷",
      "⋅",
      "∘",
      "√",
      "∛",
      "∜",
      "∝",
      "∞",
      "∑",
      "∏",
      // Fractions and Powers
      "½",
      "⅓",
      "⅔",
      "¼",
      "¾",
      "⅕",
      "⅖",
      "⅗",
      "⅘",
      "⅙",
      "⅚",
      "⅛",
      "⅜",
      "⅝",
      "⅞",
      "¹",
      "²",
      "³",
      "⁴",
      "⁵",
      "⁶",
      "⁷",
      "⁸",
      "⁹",
      "⁰",
      // Subscripts
      "₀",
      "₁",
      "₂",
      "₃",
      "₄",
      "₅",
      "₆",
      "₇",
      "₈",
      "₉",
      "₊",
      "₋",
      "₌",
      "₍",
      "₎",
      "ₐ",
      "ₑ",
      "ₕ",
      "ᵢ",
      "ⱼ",
      "ₖ",
      "ₗ",
      "ₘ",
      "ₙ",
      "ₒ",
      "ₚ",
      "ᵣ",
      "ₛ",
      "ₜ",
      "ᵤ",
      "ᵥ",
      "ₓ",
      // Physics Symbols
      "ℏ",
      "ℎ",
      "ℓ",
      "℮",
      "ℯ",
      "ℰ",
      "ℱ",
      "ℳ",
      "ℴ",
      "ℵ",
      "ℶ",
      "ℷ",
      "ℸ",
      "⅁",
      "⅂",
      "⅃",
      "⅄",
      // Arrows
      "←",
      "→",
      "↑",
      "↓",
      "↔",
      "↕",
      "↖",
      "↗",
      "↘",
      "↙",
      "↚",
      "↛",
      "↜",
      "↝",
      "↞",
      "↟",
      "↠",
      "↡",
      "↢",
      "↣",
      "↤",
      "↥",
      "↦",
      "↧",
      "↨",
      "↩",
      "↪",
      "↫",
      "↬",
      "↭",
      "↮",
      "↯",
      "↰",
      "↱",
      "↲",
      "↳",
      "↴",
      "↵",
      "↶",
      "↷",
      "↸",
      "↹",
      "↺",
      "↻",
      "⇐",
      "⇒",
      "⇑",
      "⇓",
      "⇔",
      "⇕",
      "⇖",
      "⇗",
      "⇘",
      "⇙",
      "⇚",
      "⇛",
      "⇜",
      "⇝",
      "⇞",
      "⇟",
      "⇠",
      "⇡",
      "⇢",
      "⇣",
      "⇤",
      "⇥",
      "⇦",
      "⇧",
      "⇨",
      "⇩",
      "⇪",
      "⇫",
      "⇬",
      "⇭",
      "⇮",
      "⇯",
      "⇰",
      "⇱",
      "⇲",
      "⇳",
      "⇴",
      "⇵",
      "⇶",
      "⇷",
      "⇸",
      "⇹",
      "⇺",
      "⇻",
      "⇼",
      "⇽",
      "⇾",
      "⇿",
      // Geometric Shapes
      "○",
      "●",
      "◯",
      "◦",
      "⊙",
      "⊚",
      "⊛",
      "⊜",
      "⊝",
      "□",
      "■",
      "▢",
      "▣",
      "▤",
      "▥",
      "▦",
      "▧",
      "▨",
      "▩",
      "▪",
      "▫",
      "▬",
      "▭",
      "▮",
      "▯",
      "△",
      "▲",
      "▴",
      "▵",
      "▶",
      "▷",
      "▸",
      "▹",
      "►",
      "▻",
      "▼",
      "▽",
      "▾",
      "▿",
      "◀",
      "◁",
      "◂",
      "◃",
      "◄",
      "◅",
      "◆",
      "◇",
      "◈",
      "◉",
      "◊",
      "○",
      "◌",
      "◍",
      "◎",
      "●",
      "◐",
      "◑",
      "◒",
      "◓",
      "◔",
      "◕",
      "◖",
      "◗",
      "◘",
      "◙",
      "◚",
      "◛",
      "◜",
      "◝",
      "◞",
      "◟",
      "◠",
      "◡",
      "◢",
      "◣",
      "◤",
      "◥",
      "◦",
      "◧",
      "◨",
      "◩",
      "◪",
      "◫",
      "◬",
      "◭",
      "◮",
      "◯",
      // Logic Symbols
      "∧",
      "∨",
      "¬",
      "⊕",
      "⊗",
      "⊙",
      "⊥",
      "⊤",
      "⊢",
      "⊣",
      "⊨",
      "⊩",
      "⊪",
      "⊫",
      "⊬",
      "⊭",
      "⊮",
      "⊯",
      "⊰",
      "⊱",
      "⊲",
      "⊳",
      "⊴",
      "⊵",
      "⊶",
      "⊷",
      "⊸",
      "⊹",
      "⊺",
      "⊻",
      "⊼",
      "⊽",
      "⊾",
      "⊿",
      "⋀",
      "⋁",
      "⋂",
      "⋃",
      "⋄",
      "⋅",
      "⋆",
      "⋇",
      "⋈",
      "⋉",
      "⋊",
      "⋋",
      "⋌",
      "⋍",
      "⋎",
      "⋏",
      "⋐",
      "⋑",
      "⋒",
      "⋓",
      "⋔",
      "⋕",
      "⋖",
      "⋗",
      "⋘",
      "⋙",
      "⋚",
      "⋛",
      "⋜",
      "⋝",
      "⋞",
      "⋟",
      "⋠",
      "⋡",
      "⋢",
      "⋣",
      "⋤",
      "⋥",
      "⋦",
      "⋧",
      "⋨",
      "⋩",
      "⋪",
      "⋫",
      "⋬",
      "⋭",
      "⋮",
      "⋯",
      "⋰",
      "⋱",
      // Currency and Units
      "°",
      "′",
      "″",
      "‴",
      "℃",
      "℉",
      "℧",
      "Ω",
      "℮",
      "€",
      "£",
      "¥",
      "¢",
      "₹",
      "₽",
      "₩",
      "₪",
      "₫",
      "₦",
      "₡",
      "₢",
      "₣",
      "₤",
      "₥",
      "₦",
      "₧",
      "₨",
      "₩",
      "₪",
      "₫",
      "€",
      "₭",
      "₮",
      "₯",
      "₰",
      "₱",
      "₲",
      "₳",
      "₴",
      "₵",
      "₶",
      "₷",
      "₸",
      "₹",
      "₺",
      "₻",
      "₼",
      "₽",
      "₾",
      "₿",
      // Miscellaneous
      "©",
      "®",
      "™",
      "§",
      "¶",
      "†",
      "‡",
      "•",
      "‰",
      "‱",
      "′",
      "″",
      "‴",
      "‵",
      "‶",
      "‷",
      "‸",
      "‹",
      "›",
      "‼",
      "‽",
      "‾",
      "‿",
      "⁀",
      "⁁",
      "⁂",
      "⁃",
      "⁄",
      "⁅",
      "⁆",
      "⁇",
      "⁈",
      "⁉",
      "⁊",
      "⁋",
      "⁌",
      "⁍",
      "⁎",
      "⁏",
      "⁐",
      "⁑",
      "⁒",
      "⁓",
      "⁔",
      "⁕",
      "⁖",
      "⁗",
      "⁘",
      "⁙",
      "⁚",
      "⁛",
      "⁜",
      "⁝",
      "⁞",
    ]

    // Enhanced Jodit configuration with advanced upload functionality
    const config = useMemo(
      () => ({
        readonly: disabled,
        height: Number.parseInt(height) || 400,
        placeholder,
        language: "en",
        theme: "default",
        saveModeInCookie: false,
        spellcheck: true,
        editorCssClass: "jodit-editor-enhanced",

        // Unique identifier for multiple editors
        namespace: uniqueId,

        // Focus management settings
        autofocus: false,
        tabIndex: 1,

        // Enable all toolbar buttons including symbols
        buttons: [
          "source",
          "|",
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "|",
          "superscript",
          "subscript",
          "|",
          "ul",
          "ol",
          "|",
          "outdent",
          "indent",
          "|",
          "font",
          "fontsize",
          "brush",
          "paragraph",
          "|",
          "image",
          "file",
          "video",
          "table",
          "link",
          "|",
          "align",
          "undo",
          "redo",
          "|",
          "hr",
          "eraser",
          "copyformat",
          "|",
          "symbol",
          "fullsize",
          "print",
          "about",
        ],

        // Button configuration for different screen sizes
        buttonsMD: [
          "source",
          "|",
          "bold",
          "italic",
          "|",
          "ul",
          "ol",
          "|",
          "image",
          "link",
          "|",
          "align",
          "undo",
          "redo",
          "|",
          "symbol",
        ],

        buttonsXS: ["bold", "italic", "|", "ul", "ol", "|", "image", "link", "symbol"],

        // Enhanced options
        toolbarAdaptive: true,
        toolbarSticky: true,
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,

        // Paste configuration
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
        defaultActionOnPaste: "insert_clear_html",

        // Enhanced drag and drop
        enableDragAndDropFileToEditor: true,

        // COMPREHENSIVE SYMBOLS CONFIGURATION
        controls: {
          symbol: {
            popup: (editor: any, current: any, self: any, close: any) => {
              const div = editor.create.div("jodit-symbols-popup")
              div.style.cssText = `
                display: grid;
                grid-template-columns: repeat(12, 1fr);
                gap: 3px;
                padding: 15px;
                max-width: 600px;
                max-height: 400px;
                overflow-y: auto;
                background: white;
                border: 1px solid #ccc;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 999999;
              `

              // Add category headers
              const categories = [
                { name: "Greek Letters", symbols: mathPhysicsSymbols.slice(0, 48) },
                { name: "Math Operators", symbols: mathPhysicsSymbols.slice(48, 72) },
                { name: "Comparison", symbols: mathPhysicsSymbols.slice(72, 93) },
                { name: "Arithmetic", symbols: mathPhysicsSymbols.slice(93, 106) },
                { name: "Powers & Fractions", symbols: mathPhysicsSymbols.slice(106, 131) },
                { name: "Subscripts", symbols: mathPhysicsSymbols.slice(131, 163) },
                { name: "Physics", symbols: mathPhysicsSymbols.slice(163, 180) },
                { name: "Arrows", symbols: mathPhysicsSymbols.slice(180, 280) },
                { name: "Shapes", symbols: mathPhysicsSymbols.slice(280, 380) },
                { name: "Logic", symbols: mathPhysicsSymbols.slice(380, 450) },
                { name: "Currency & Units", symbols: mathPhysicsSymbols.slice(450, 500) },
                { name: "Miscellaneous", symbols: mathPhysicsSymbols.slice(500) },
              ]

              categories.forEach((category) => {
                if (category.symbols.length > 0) {
                  // Category header
                  const header = editor.create.element("div")
                  header.textContent = category.name
                  header.style.cssText = `
                    grid-column: 1 / -1;
                    font-weight: bold;
                    font-size: 12px;
                    color: #333;
                    margin: 10px 0 5px 0;
                    padding: 5px;
                    background: #f5f5f5;
                    border-radius: 4px;
                    text-align: center;
                  `
                  div.appendChild(header)

                  // Category symbols
                  category.symbols.forEach((symbol) => {
                    const button = editor.create.element("button")
                    button.textContent = symbol
                    button.title = symbol
                    button.style.cssText = `
                      padding: 8px 4px;
                      border: 1px solid #ddd;
                      background: white;
                      cursor: pointer;
                      border-radius: 4px;
                      font-size: 18px;
                      font-family: 'Times New Roman', serif;
                      transition: all 0.2s;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      min-height: 35px;
                    `

                    button.addEventListener("mouseenter", () => {
                      button.style.backgroundColor = "#e3f2fd"
                      button.style.borderColor = "#2196f3"
                      button.style.transform = "scale(1.1)"
                    })

                    button.addEventListener("mouseleave", () => {
                      button.style.backgroundColor = "white"
                      button.style.borderColor = "#ddd"
                      button.style.transform = "scale(1)"
                    })

                    button.addEventListener("click", (e) => {
                      e.preventDefault()
                      e.stopPropagation()

                      try {
                        // Insert symbol at cursor position
                        if (editor.selection) {
                          editor.selection.insertHTML(symbol)
                        } else {
                          editor.value += symbol
                        }

                        // Force focus back to editor
                        forceFocus()
                        close()
                      } catch (error) {
                        console.error("Symbol insertion error:", error)
                      }
                    })

                    div.appendChild(button)
                  })
                }
              })

              return div
            },
            tooltip: "Insert Math/Physics Symbol",
            icon: "symbol",
          },

          // Enhanced image button with custom upload
          image: {
            popup: (editor: any, current: any, self: any, close: any) => {
              const div = editor.create.div("jodit-image-popup")
              div.style.cssText = `
                padding: 20px;
                min-width: 300px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 999999;
              `

              div.innerHTML = `
                <div class="jodit-image-upload-container">
                  <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Insert Image</h3>
                  
                  <div class="upload-methods" style="display: flex; flex-direction: column; gap: 15px;">
                    <!-- File Upload -->
                    <div class="upload-section">
                      <label style="display: block; margin-bottom: 8px; font-weight: 500;">Upload from Computer</label>
                      <input type="file" id="jodit-file-input-${uniqueId}" accept="${allowedTypes.join(",")}" 
                             style="width: 100%; padding: 8px; border: 2px dashed #ddd; border-radius: 4px; cursor: pointer;">
                      <small style="color: #666; font-size: 12px;">
                        Max size: ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB. 
                        Supported: ${allowedTypes.map((type) => type.split("/")[1].toUpperCase()).join(", ")}
                      </small>
                    </div>
                    
                    <!-- URL Input -->
                    <div class="url-section">
                      <label style="display: block; margin-bottom: 8px; font-weight: 500;">Insert from URL</label>
                      <input type="url" id="jodit-url-input-${uniqueId}" placeholder="https://example.com/image.jpg"
                             style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="action-buttons" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;">
                      <button type="button" id="jodit-cancel-btn-${uniqueId}" 
                              style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">
                        Cancel
                      </button>
                      <button type="button" id="jodit-insert-btn-${uniqueId}" 
                              style="padding: 8px 16px; border: none; background: #2196f3; color: white; border-radius: 4px; cursor: pointer;">
                        Insert Image
                      </button>
                    </div>
                  </div>
                </div>
              `

              // File input handler
              const fileInput = div.querySelector(`#jodit-file-input-${uniqueId}`) as HTMLInputElement
              const urlInput = div.querySelector(`#jodit-url-input-${uniqueId}`) as HTMLInputElement
              const cancelBtn = div.querySelector(`#jodit-cancel-btn-${uniqueId}`) as HTMLButtonElement
              const insertBtn = div.querySelector(`#jodit-insert-btn-${uniqueId}`) as HTMLButtonElement

              fileInput.addEventListener("change", async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  close()
                  const result = await handleImageUpload(file)
                  if (result.success && result.url) {
                    editor.selection.insertImage(result.url, null, 250)
                    debouncedUpdate(editor.value)
                  }
                }
              })

              insertBtn.addEventListener("click", async () => {
                const url = urlInput.value.trim()
                if (url) {
                  try {
                    editor.selection.insertImage(url, null, 250)
                    debouncedUpdate(editor.value)
                    NotificationManager.show("Image inserted successfully!", "success")
                    close()
                  } catch (error) {
                    NotificationManager.show("Failed to insert image from URL", "error")
                  }
                } else {
                  fileInput.click()
                }
              })

              cancelBtn.addEventListener("click", () => {
                close()
                forceFocus()
              })

              return div
            },
            tooltip: "Insert Image",
            icon: "image",
          },
        },

        // ENHANCED UPLOAD CONFIGURATION
        uploader: {
          insertImageAsBase64URI: false,
          url: uploadUrl,
          format: "json",
          pathVariableName: "path",
          filesVariableName: () => "file",
          headers: {
            "x-api-key": import.meta.env?.VITE_LICENCE || "",
          },
          prepareData: (formData: any) => formData,
          isSuccess: (resp: any) => !resp.error,
          getMsg: (resp: any) => (Array.isArray(resp.msg) ? resp.msg.join(" ") : resp.msg) || "Unknown error",
          process: (resp: any) => ({
            files: [resp.data || resp.url || resp.path],
            path: "",
            baseurl: "",
            error: resp.error ? 1 : 0,
            msg: resp.msg,
          }),

          // Custom upload handler with progress
          defaultHandlerSuccess: async function (data: any) {
            try {
              const files = data.files || []
              if (files.length && this.selection) {
                this.selection.insertImage(files[0], null, 250)
                setTimeout(() => {
                  if (isEditorReady && editorRef.current && typeof editorRef.current.value !== "undefined") {
                    const newContent = editorRef.current.value
                    debouncedUpdate(newContent)
                  }
                }, 100)
              }
            } catch (error) {
              console.error("Upload success handler error:", error)
            }
          },

          defaultHandlerError: function (resp: any) {
            try {
              const errorMsg = resp.msg || "Upload failed"
              NotificationManager.show(errorMsg, "error")
              if (this.events && this.events.fire) {
                this.events.fire("errorPopap", this.i18n ? this.i18n(errorMsg) : errorMsg)
              }
            } catch (error) {
              console.error("Upload error handler error:", error)
            }
          },

          withCredentials: false,
        },

        // PERFECT FOCUS MANAGEMENT EVENTS
        events: {
          afterInit: (editor: any) => {
            try {
              setIsEditorReady(true)
              if (editor && content) {
                editor.value = content
              }

              // COMPREHENSIVE FOCUS MANAGEMENT
              if (editor.editor) {
                // Prevent ALL focus loss scenarios
                const preventFocusLoss = (e: Event) => {
                  if (!isUploading) {
                    e.stopPropagation()
                    forceFocus()
                  }
                }

                // Handle keyboard events
                editor.editor.addEventListener("keydown", (e: KeyboardEvent) => {
                  // Don't interfere with normal typing
                  if (e.key === " " || e.key === "Enter" || e.key === "Tab") {
                    // Let the key work normally, then ensure focus
                    setTimeout(() => {
                      if (!isUploading) forceFocus()
                    }, 0)
                  }
                })

                // Handle all mouse events
                editor.editor.addEventListener("click", preventFocusLoss)
                editor.editor.addEventListener("mousedown", preventFocusLoss)
                editor.editor.addEventListener("mouseup", preventFocusLoss)

                // Handle focus/blur events
                editor.editor.addEventListener("blur", (e: FocusEvent) => {
                  // Immediately refocus unless user clicked outside intentionally or uploading
                  setTimeout(() => {
                    if (document.activeElement !== editor.editor && !isUploading) {
                      forceFocus()
                    }
                  }, 10)
                })

                // Handle paste events
                editor.editor.addEventListener("paste", () => {
                  setTimeout(() => {
                    if (!isUploading) forceFocus()
                  }, 50)
                })

                // Handle toolbar clicks
                if (editor.toolbar && editor.toolbar.container) {
                  editor.toolbar.container.addEventListener("click", () => {
                    setTimeout(() => {
                      if (!isUploading) forceFocus()
                    }, 50)
                  })
                }

                // Enhanced drag and drop with progress
                editor.editor.addEventListener("drop", async (e: DragEvent) => {
                  e.preventDefault()
                  const files = Array.from(e.dataTransfer?.files || [])
                  const imageFiles = files.filter((file) => file.type.startsWith("image/"))

                  if (imageFiles.length > 0) {
                    for (const file of imageFiles) {
                      const result = await handleImageUpload(file)
                      if (result.success && result.url) {
                        editor.selection.insertImage(result.url, null, 250)
                        debouncedUpdate(editor.value)
                      }
                    }
                  }
                })

                // Prevent default drag behavior
                editor.editor.addEventListener("dragover", (e: DragEvent) => {
                  e.preventDefault()
                })
              }

              console.log("✅ Enhanced Jodit Editor initialized with perfect focus and upload management")
            } catch (error) {
              console.error("Editor afterInit error:", error)
            }
          },

          change: (newContent: string) => {
            try {
              if (isEditorReady) {
                debouncedUpdate(newContent)
                if (!isUploading) forceFocus() // Maintain focus on content change
              }
            } catch (error) {
              console.error("Editor change error:", error)
            }
          },

          blur: () => {
            try {
              // Always refocus immediately unless uploading
              if (!isUploading) forceFocus()
            } catch (error) {
              console.error("Editor blur error:", error)
            }
          },

          focus: () => {
            console.log("🎯 Editor focused")
          },

          afterPaste: () => {
            try {
              setTimeout(() => {
                if (isEditorReady && editorRef.current && typeof editorRef.current.value !== "undefined") {
                  const newContent = editorRef.current.value
                  debouncedUpdate(newContent)
                  if (!isUploading) forceFocus()
                }
              }, 100)
            } catch (error) {
              console.error("Editor afterPaste error:", error)
            }
          },

          beforeDestruct: () => {
            try {
              setIsEditorReady(false)
              debouncedUpdate.cancel()
              if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current)
              }
              uploadServiceRef.current.cancelUpload()
            } catch (error) {
              console.error("Editor beforeDestruct error:", error)
            }
          },
        },
      }),
      [
        disabled,
        height,
        placeholder,
        debouncedUpdate,
        content,
        isEditorReady,
        uniqueId,
        forceFocus,
        uploadUrl,
        allowedTypes,
        maxFileSize,
        handleImageUpload,
        isUploading,
      ],
    )

    // Prevent rendering on server side
    if (!isMounted) {
      return (
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-500">Loading enhanced editor...</div>
        </div>
      )
    }

    return (
      <>
        <div
          ref={containerRef}
          className={`jodit-text-editor-container rounded-lg overflow-hidden ${
            error ? "ring-2 ring-rose-500" : "ring-1 ring-gray-200"
          } ${isUploading ? "pointer-events-none opacity-75" : ""}`}
          onMouseDown={(e) => {
            // Prevent focus loss when clicking on editor container
            if (!isUploading) {
              e.stopPropagation()
              forceFocus()
            }
          }}
          onClick={(e) => {
            if (!isUploading) {
              e.stopPropagation()
              forceFocus()
            }
          }}
        >
          <JoditErrorBoundary>
            <JoditEditor
              ref={editorRef}
              value={content}
              config={config}
              tabIndex={1}
              onBlur={() => {
                // Always maintain focus unless uploading
                if (!isUploading) forceFocus()
              }}
              onChange={(newContent) => {
                try {
                  if (newContent !== content && isEditorReady) {
                    debouncedUpdate(newContent)
                  }
                  // Maintain focus on change unless uploading
                  if (!isUploading) forceFocus()
                } catch (error) {
                  console.error("Editor onChange error:", error)
                }
              }}
            />
          </JoditErrorBoundary>
        </div>

        {/* Upload Progress Overlay */}
        <UploadProgressOverlay
          isUploading={isUploading}
          progress={uploadProgress}
          fileName={uploadFileName}
          onCancel={handleCancelUpload}
        />
      </>
    )
  },
)

// Set display name for better debugging
EnhancedJoditEditor.displayName = "EnhancedJoditEditor"
UploadProgressOverlay.displayName = "UploadProgressOverlay"

export default EnhancedJoditEditor
