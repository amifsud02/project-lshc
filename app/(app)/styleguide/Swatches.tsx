const TOKENS = [
  ['--color-ink', 'Ink'],
  ['--color-accent', 'Accent'],
  ['--color-accent-hover', 'Accent hover'],
  ['--color-canvas', 'Canvas'],
  ['--color-paper', 'Paper'],
  ['--color-paper-soft', 'Paper soft'],
  ['--color-text', 'Text'],
  ['--color-muted', 'Muted'],
  ['--color-faint', 'Faint'],
  ['--color-rule', 'Rule'],
  ['--color-rule-soft', 'Rule soft'],
  ['--color-border', 'Border'],
  ['--color-danger', 'Danger'],
  ['--color-success', 'Success'],
  ['--color-warning', 'Warning'],
]

export default function Swatches() {
  return (
    <div className="sg__swatches">
      {TOKENS.map(([token, label]) => (
        <div key={token} className="sg__swatch">
          <span className="sg__swatch-chip" style={{ background: `var(${token})` }} />
          <span className="sg__swatch-label">{label}</span>
          <code className="sg__swatch-token">{token}</code>
        </div>
      ))}
      <div className="sg__swatch">
        <span className="sg__swatch-chip" style={{ background: 'var(--gradient-brand)' }} />
        <span className="sg__swatch-label">Brand gradient</span>
        <code className="sg__swatch-token">--gradient-brand</code>
      </div>
    </div>
  )
}
