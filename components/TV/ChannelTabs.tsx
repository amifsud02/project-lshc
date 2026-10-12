'use client'

import { useState, type ReactNode } from 'react'

type Channel = { id: string; name: string; panel: ReactNode }

/** Tab strip for team channels. Panels are rendered on the server and passed in. */
export default function ChannelTabs({ channels }: { channels: Channel[] }) {
  const [active, setActive] = useState(channels[0]?.id)
  const current = channels.find((c) => c.id === active) ?? channels[0]
  if (!current) return null

  return (
    <div>
      <div className="tv-tabs" role="tablist" aria-label="Team channels">
        {channels.map(({ id, name }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tv-tab-${id}`}
            aria-selected={id === current.id}
            aria-controls="tv-channel-panel"
            className="tv-tab"
            onClick={() => setActive(id)}
          >
            {name}
          </button>
        ))}
      </div>
      <div id="tv-channel-panel" role="tabpanel" aria-labelledby={`tv-tab-${current.id}`}>
        {current.panel}
      </div>
    </div>
  )
}
