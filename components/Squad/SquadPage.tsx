import Link from 'next/link'
import PageHeader from '@/components/PageHeader/PageHeader'
import PlayerCard from '@/components/PlayerCard/PlayerCard'
import { mediaUrl } from '@/lib/seo/meta'
import { SQUADS, SQUAD_TABS, type Squad } from '@/lib/players/squads'
import type { IPlayerCard } from '@/lib/types/player.type'
import { cachedFind } from '@/lib/utils/payload/cached'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'
import type { Player } from '@/payload-types'

type Group = { label: string; players: Player[] }

/**
 * A squad page: the players whose "Squad pages" include this squad, grouped by position. Players
 * are edited in Payload (Players); those without a position are listed under "Players".
 */
export default async function SquadPage({ squad, position }: { squad: Squad; position: string }) {
  const tab = SQUAD_TABS.find((t) => t.slug === position.toLowerCase()) ?? SQUAD_TABS[0]

  const { docs } = await cachedFind({
    collection: 'players',
    where: { squads: { contains: squad } },
    depth: 1,
    limit: 200,
    sort: 'number',
  })
  const players = docs as Player[]
  // Players without a photo use the Fallback Image in Site Settings.
  const { fallbackImageUrl } = await getGeneralGlobal()
  const photo = (p: Player) => mediaUrl(p.profilePicture) || fallbackImageUrl || '/player-placeholder.png'

  const positioned = SQUAD_TABS.filter((t) => 'position' in t)
  const groups: Group[] =
    'position' in tab
      ? [{ label: tab.label, players: players.filter((p) => p.position === tab.position) }]
      : [
          ...positioned.map((t) => ({ label: t.label, players: players.filter((p) => p.position === t.position) })),
          { label: 'Players', players: players.filter((p) => !p.position) },
        ]
  const shown = groups.filter((g) => g.players.length > 0)

  return (
    <>
      <PageHeader pageName={SQUADS[squad].pageName} asHeading />
      <section className="parent">
        <div className="tabs__wrapper">
          <nav className="nav__tab" aria-label="Positions">
            <div className="category">
              {SQUAD_TABS.map((t) => (
                <Link
                  key={t.slug}
                  href={`/teams/${squad}/${t.slug}`}
                  className={t.slug === tab.slug ? 'tablinks active' : 'tablinks'}
                  aria-current={t.slug === tab.slug ? 'page' : undefined}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {shown.length === 0 ? (
          <p>No players listed yet.</p>
        ) : (
          shown.map((group) => (
            <div key={group.label}>
              <h2 className="position-titles">{group.label}</h2>
              <ul className="playercard-showcase">
                {group.players.map((p) => (
                  <PlayerCard
                    key={p.id}
                    playerInfo={{
                      number: p.number ?? undefined,
                      firstName: p.firstName,
                      lastName: p.lastName,
                      position: (p.position ?? undefined) as IPlayerCard['position'],
                    }}
                    profilePicture={photo(p)}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  )
}
