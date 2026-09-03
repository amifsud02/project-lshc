'use client'

/**
 * The letter still goes out as a PDF on WhatsApp, so the print stylesheet plus
 * the browser's own "save as PDF" replaces the hand-maintained document.
 */
export default function PrintButton() {
  return (
    <button type="button" className="shop-btn shop-btn--ghost" onClick={() => window.print()}>
      Download as PDF
    </button>
  )
}
