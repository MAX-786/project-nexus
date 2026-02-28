import { Readability } from "@mozilla/readability"
import DOMPurify from "dompurify"

export type CaptureResult = {
  url: string
  title: string
  text: string
  isYoutube: boolean
}

export async function extractPageContent(): Promise<CaptureResult> {
  const url = window.location.href
  const title = document.title
  const isYoutube = url.includes("youtube.com/watch")

  let text = ""

  if (isYoutube) {
    // Attempt to extract YouTube Transcript
    text = extractYoutubeTranscript() || "No transcript available to capture."
  } else {
    // Standard webpage extraction using Readability
    const documentClone = document.cloneNode(true) as Document
    const reader = new Readability(documentClone)
    const article = reader.parse()

    if (article && article.textContent) {
      // Clean up whitespace
      text = article.textContent.replace(/\s+/g, ' ').trim()
    } else {
      // Fallback: Just grab body text
      text = document.body.innerText.replace(/\s+/g, ' ').trim()
    }
  }

  return { url, title, text, isYoutube }
}

function extractYoutubeTranscript(): string | null {
  // YouTube transcript extraction is notoriously flaky without an API.
  // This is a naive DOM extraction attempt for the default closed captions box if it's open.
  const transcriptSegments = document.querySelectorAll(
    "ytd-transcript-segment-renderer .segment-text, .ytd-transcript-segment-renderer"
  )
  
  if (transcriptSegments.length > 0) {
    const lines = Array.from(transcriptSegments).map((el) => (el as HTMLElement).innerText.trim())
    return lines.join(" ")
  }

  return null
}
