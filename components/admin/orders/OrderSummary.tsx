import type { CSSProperties } from 'react'
import type { UIFieldServerComponent } from 'payload'
import type { Answer, OrderLine } from '@/lib/shop/orderSummary'
import { summarizeOrderFor } from '@/lib/shop/orderQuestions'
import { formatPrice } from '@/lib/shop/types'

const card: CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-m)',
  padding: '16px 20px',
}
const muted: CSSProperties = { color: 'var(--theme-elevation-500)' }
const cell: CSSProperties = { padding: '10px 12px 10px 0', verticalAlign: 'top', textAlign: 'left' }

// The club is in Malta; the server may not be.
const dateTime = (value: unknown) =>
  value
    ? new Intl.DateTimeFormat('en-MT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Malta' }).format(
        new Date(String(value)),
      )
    : null

const Answers = ({ answers }: { answers: Answer[] }) =>
  answers.length ? (
    <div>
      {answers.map((a) => (
        <div key={a.label}>
          <span style={muted}>{a.label}:</span> {a.value}
        </div>
      ))}
    </div>
  ) : null

/**
 * Sits at the top of an order: who bought it, what each member of a membership gets along with
 * their answers (e.g. a T-shirt size), and the totals in euros. Shows the order as saved.
 */
export const OrderSummary: UIFieldServerComponent = async ({ data, payload }) => {
  const items: OrderLine[] = Array.isArray(data?.items) ? data.items : []
  if (items.length === 0) return null

  // Each product's questions label the answers, e.g. "size" → "T-shirt size".
  const { membership, lines } = await summarizeOrderFor(payload, items)

  const subtotal = Number(data.subtotal) || 0
  const total = Number(data.total) || 0
  const deliveryFee = Number(data.deliveryFee) || 0
  const discount = Number(data.discountTotal) || 0
  const vat = Number(data.vatIncluded) || 0
  const taxAdded = Number(data.taxAdded) || 0
  // Whatever the lines, delivery, discount and tax don't explain, e.g. the Rypple platform fee.
  const other = total - subtotal - deliveryFee + discount - taxAdded
  const fulfilment = data.fulfilment ?? {}
  const delivering = fulfilment.method === 'deliver'
  const address = [fulfilment.addressLine1, fulfilment.addressLine2, [fulfilment.locality, fulfilment.postcode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  const termsAt = dateTime(data.consent?.termsAcceptedAt)
  const placed = dateTime(data.createdAt)
  const paid = dateTime(data.paidAt)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
      <div style={{ ...card, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={muted}>Bought by</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{data.customerName || data.customerEmail}</div>
          <div style={muted}>{[data.customerEmail, data.customerPhone].filter(Boolean).join(' · ')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {placed && (
            <div>
              <span style={muted}>Placed</span> {placed}
            </div>
          )}
          {paid && (
            <div>
              <span style={muted}>Paid</span> {paid}
            </div>
          )}
        </div>
      </div>

      {(data.fulfilment?.method || fulfilment.note || termsAt) && (
        <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <div style={muted}>{delivering ? 'Deliver to' : 'Handover'}</div>
            <div style={{ fontWeight: 600 }}>{delivering ? address || 'No address given' : 'Collect at the club'}</div>
          </div>
          {fulfilment.note && (
            <div>
              <div style={muted}>Buyer note</div>
              <div>{fulfilment.note}</div>
            </div>
          )}
          <div>
            <div style={muted}>Consent</div>
            <div>{termsAt ? `Accepted terms ${termsAt}` : 'No terms acceptance recorded'}</div>
            <div style={muted}>{data.consent?.marketingOptIn ? 'Wants club news and offers' : 'No marketing emails'}</div>
          </div>
        </div>
      )}

      <div style={card}>
        {membership && (
          <div style={{ marginBottom: lines.length ? 20 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
              <h4 style={{ margin: 0 }}>{membership.title}</h4>
              <span>{formatPrice(membership.price)}</span>
            </div>
            <div style={muted}>
              Season {membership.season} · {membership.members.length}{' '}
              {membership.members.length === 1 ? 'member' : 'members'}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
                marginTop: 16,
              }}
            >
              {membership.members.map((member, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    background: 'var(--theme-elevation-50)',
                    borderRadius: 'var(--style-radius-s)',
                    padding: '12px 16px',
                  }}
                >
                  <div>
                    <div style={muted}>Member {i + 1}</div>
                    <div style={{ fontWeight: 600 }}>{member.name}</div>
                    <div style={muted}>{[member.mobile, member.email].filter(Boolean).join(' · ')}</div>
                  </div>
                  <Answers answers={member.answers} />
                  {member.items.length > 0 && (
                    <div>
                      <div style={muted}>Gets</div>
                      {member.items.map((item, j) => (
                        <div key={j}>
                          <strong>{item.title}</strong>
                          {item.answers.length > 0 && ` — ${item.answers.map((a) => `${a.label}: ${a.value}`).join(', ')}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {lines.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={muted}>
                <th style={{ ...cell, fontWeight: 400 }}>Item</th>
                <th style={{ ...cell, fontWeight: 400 }}>Details</th>
                <th style={{ ...cell, fontWeight: 400, textAlign: 'right' }}>Qty</th>
                <th style={{ ...cell, fontWeight: 400, textAlign: 'right', paddingRight: 0 }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
                  <td style={{ ...cell, paddingLeft: line.included ? 20 : 0 }}>
                    {line.included ? <span style={muted}>Includes </span> : null}
                    <strong>{line.title}</strong>
                  </td>
                  <td style={cell}>
                    <Answers answers={line.answers} />
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>{line.quantity}</td>
                  <td style={{ ...cell, textAlign: 'right', paddingRight: 0 }}>
                    {line.included && !line.lineTotal ? <span style={muted}>Included</span> : formatPrice(line.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            justifyContent: 'end',
            columnGap: 32,
            rowGap: 4,
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--theme-elevation-150)',
          }}
        >
          <span style={muted}>Subtotal</span>
          <span style={{ textAlign: 'right' }}>{formatPrice(subtotal)}</span>
          {deliveryFee > 0 && (
            <>
              <span style={muted}>{data.fulfilment?.methodTitle || 'Delivery'}</span>
              <span style={{ textAlign: 'right' }}>{formatPrice(deliveryFee)}</span>
            </>
          )}
          {discount > 0 && (
            <>
              <span style={muted}>{data.couponCode ? `Coupon ${String(data.couponCode).toUpperCase()}` : 'Promo code'}</span>
              <span style={{ textAlign: 'right' }}>−{formatPrice(discount)}</span>
            </>
          )}
          {taxAdded > 0 && (
            <>
              <span style={muted}>Tax</span>
              <span style={{ textAlign: 'right' }}>{formatPrice(taxAdded)}</span>
            </>
          )}
          {other !== 0 && (
            <>
              <span style={muted}>{data.paymentProvider === 'membrs' ? 'Rypple platform fee' : 'Other charges'}</span>
              <span style={{ textAlign: 'right' }}>{formatPrice(other)}</span>
            </>
          )}
          <strong>Total</strong>
          <strong style={{ textAlign: 'right' }}>{formatPrice(total)}</strong>
          {vat > 0 && (
            <>
              <span style={muted}>Includes VAT</span>
              <span style={{ ...muted, textAlign: 'right' }}>{formatPrice(vat)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
