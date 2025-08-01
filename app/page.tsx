"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"

// Error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      // Only handle errors related to our app, ignore wallet provider errors
      if (error.message.includes("sender") || error.message.includes("wallet")) {
        return
      }
      console.error("App error:", error)
      setHasError(true)
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">Please refresh the page and try again.</p>
          <button
            onClick={() => setHasError(false)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function OctrafiedApp() {
  const [username, setUsername] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (file) {
        if (!file.type.startsWith("image/")) {
          alert("Please select a valid image file")
          return
        }

        const reader = new FileReader()
        reader.onload = () => {
          if (reader.result) {
            setImage(reader.result as string)
          }
        }
        reader.onerror = () => {
          alert("Error reading file")
        }
        reader.readAsDataURL(file)
      }
    } catch (error) {
      console.error("Image upload error:", error)
      alert("Failed to upload image")
    }
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      try {
        if (username.trim() && image) {
          setSubmitted(true)
        }
      } catch (error) {
        console.error("Submit error:", error)
      }
    },
    [username, image],
  )

  const handleReset = useCallback(() => {
    try {
      setSubmitted(false)
      setUsername("")
      setImage(null)
      setIsDownloading(false)
    } catch (error) {
      console.error("Reset error:", error)
    }
  }, [])

  const downloadPfp = useCallback(async () => {
    if (!image || !username.trim()) return

    setIsDownloading(true)

    try {
      // Create canvas in a more isolated way
      const canvasElement = document.createElement("canvas")
      const context = canvasElement.getContext("2d", { alpha: true })

      if (!context) {
        throw new Error("Canvas context not available")
      }

      // Set canvas dimensions
      canvasElement.width = 200
      canvasElement.height = 200

      // Clear canvas
      context.clearRect(0, 0, 200, 200)

      // Load and process image
      const imageElement = new Image()

      const processImage = new Promise<void>((resolve, reject) => {
        imageElement.onload = () => {
          try {
            // Save context state
            context.save()

            // Create circular clipping path
            context.beginPath()
            context.arc(100, 100, 90, 0, 2 * Math.PI)
            context.clip()

            // Draw image
            context.drawImage(imageElement, 10, 10, 180, 180)

            // Restore context
            context.restore()

            // Draw border
            context.strokeStyle = "#0d0bda"
            context.lineWidth = 6
            context.beginPath()
            context.arc(100, 100, 90, 0, 2 * Math.PI)
            context.stroke()

            resolve()
          } catch (err) {
            reject(err)
          }
        }

        imageElement.onerror = () => reject(new Error("Failed to load image"))
        imageElement.crossOrigin = "anonymous"
        imageElement.src = image
      })

      await processImage

      // Create download
      const downloadLink = document.createElement("a")
      const fileName = `${username.replace(/[^a-zA-Z0-9]/g, "_")}-octrafied-pfp.png`

      downloadLink.download = fileName
      downloadLink.href = canvasElement.toDataURL("image/png", 1.0)

      // Trigger download
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download PFP. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }, [image, username])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 pb-16">
      {!submitted ? (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Get Octrafied!</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d0bda] focus:border-transparent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={20}
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                className="w-full border border-gray-300 p-2 rounded-md"
                onChange={handleImageUpload}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!username.trim() || !image}
              className="w-full bg-[#0d0bda] hover:bg-[#0a09b8] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md transition-colors font-medium"
            >
              Generate PFP
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm text-center">
          {image && (
            <div className="mb-4">
              <img
                src={image || "/placeholder.svg"}
                alt="Profile"
                className="w-32 h-32 object-cover rounded-full border-4 border-[#0d0bda] mx-auto"
              />
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{username}</h2>
          <p className="text-gray-600 mb-6">
            You are <span className="text-[#0d0bda] font-semibold">Octrafied</span> 🔵
          </p>

          <div className="space-y-3">
            <button
              onClick={downloadPfp}
              disabled={isDownloading}
              className="w-full bg-[#0d0bda] hover:bg-[#0a09b8] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md transition-colors font-medium"
            >
              {isDownloading ? "Downloading..." : "Download Octrafied PFP"}
            </button>

            <button
              onClick={handleReset}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-md transition-colors font-medium"
            >
              Create Another 
            </button>
          </div>
        </div>
      )}
      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 py-2">
        <div className="text-center text-sm text-gray-600">
          made with ❤ by <span className="text-[#0d0bda] font-semibold">@0xrayson</span> for{" "}
          <span className="text-[#0d0bda] font-semibold">@octra</span>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <OctrafiedApp />
    </ErrorBoundary>
  )
}
