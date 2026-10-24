'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** A member's discount code with a button to copy it, e.g. for a partner's online checkout. */
export default function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-primary/40 bg-primary/5 py-1 pr-1 pl-3">
      <code className="font-mono text-sm font-semibold tracking-wide text-primary">{code}</code>
      <button
        type="button"
        onClick={copy}
        className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-foreground"
        aria-label={`Copy code ${code}`}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  )
}
