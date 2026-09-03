import PageHeader from '@/components/PageHeader/PageHeader'
import Swatches from './Swatches'
import './styleguide.css'

export const metadata = {
  title: 'Style guide | La Salle Handball',
  robots: { index: false, follow: false },
}

/**
 * Living reference for the design system in app/(app)/styles. Every primitive
 * is rendered once so a change to tokens or ui.css can be checked in one place.
 * Not linked from the site navigation.
 */
export default function StyleGuidePage() {
  return (
    <>
      <PageHeader pageName="Style guide" />
      <section className="parent shop">
        <div className="sg">
          <p className="lead">
            Tokens live in <code>styles/tokens.css</code>, primitives in <code>styles/ui.css</code>.
            Page stylesheets compose these and add only what is specific to that page.
          </p>

          <h2 className="section-title">Colour</h2>
          <Swatches />

          <h2 className="section-title">Type</h2>
          <div className="card sg__stack">
            <p className="eyebrow">Eyebrow · .eyebrow</p>
            <h1 className="heading heading--lg">Heading large · .heading.heading--lg</h1>
            <h2 className="heading">Heading · .heading</h2>
            <h3 className="section-title" style={{ marginBottom: 0 }}>Section title · .section-title</h3>
            <p className="lead" style={{ marginBottom: 0 }}>Lead paragraph · .lead. Muted copy that sits under a heading and explains what the section is for.</p>
            <div className="prose">
              <p>Prose · .prose. Body copy from the CMS with <a href="#">an inline link</a> and <strong>strong text</strong>.</p>
              <ul><li>List items inherit the same rhythm.</li><li>And the same colour.</li></ul>
            </div>
          </div>

          <h2 className="section-title">Buttons</h2>
          <div className="card sg__row">
            <button className="btn">Primary</button>
            <button className="btn btn--ghost">Ghost</button>
            <button className="btn btn--sm">Small</button>
            <button className="btn" disabled>Disabled</button>
            <button className="btn-text">Text button</button>
            <span className="sg__dark"><button className="btn btn--light">Light on navy</button></span>
          </div>

          <h2 className="section-title">Fields</h2>
          <div className="card">
            <div className="form-grid">
              <label className="field">
                <span className="field__label">Text input</span>
                <input className="field__input" placeholder="Placeholder" />
                <span className="field__hint">A hint sits under the input.</span>
              </label>
              <label className="field">
                <span className="field__label">Optional <span className="field__optional">(optional)</span></span>
                <input className="field__input" />
              </label>
              <label className="field">
                <span className="field__label">Select</span>
                <select className="field__select" defaultValue="">
                  <option value="">Select…</option>
                  <option>One</option>
                  <option>Two</option>
                </select>
              </label>
              <label className="field field--error">
                <span className="field__label">With error</span>
                <input className="field__input" defaultValue="not-an-email" aria-invalid="true" />
                <span className="field__error">Please enter a valid email address.</span>
              </label>
              <label className="field">
                <span className="field__label">Disabled</span>
                <input className="field__input" disabled defaultValue="Read only" />
              </label>
              <label className="field">
                <span className="field__label">With inline action</span>
                <span className="input-wrap">
                  <input className="field__input" type="password" defaultValue="secret" />
                  <button type="button" className="input-wrap__action">Show</button>
                </span>
              </label>
              <label className="field field--wide">
                <span className="field__label">Textarea</span>
                <textarea className="field__textarea field__textarea--short" />
              </label>
            </div>
            <div className="check-group" style={{ marginTop: 12 }}>
              <label className="check"><input type="checkbox" defaultChecked /><span>Checkbox row · .check</span></label>
              <label className="check"><input type="checkbox" /><span>With a hint<span className="check__hint">Explains the choice underneath.</span></span></label>
            </div>
            <div className="check-group check-group--inline">
              <label className="check"><input type="radio" name="sg-r" defaultChecked /><span>Radio one</span></label>
              <label className="check"><input type="radio" name="sg-r" /><span>Radio two</span></label>
            </div>
          </div>

          <h2 className="section-title">Choice cards</h2>
          <div className="choice">
            <label className="choice__option choice__option--selected">
              <input type="radio" name="sg-c" defaultChecked />
              <span className="choice__body">
                <span className="choice__title">Selected option<span className="choice__meta">Meta</span><span className="choice__price">€180.00</span></span>
                <span className="choice__lines"><span>Monday · 5:00 p.m. – 6:15 p.m. · Venue</span></span>
              </span>
            </label>
            <label className="choice__option">
              <input type="radio" name="sg-c" />
              <span className="choice__body"><span className="choice__title">Another option</span></span>
            </label>
            <label className="choice__option choice__option--disabled">
              <input type="radio" name="sg-c" disabled />
              <span className="choice__body"><span className="choice__title">Unavailable<span className="badge badge--bad">Full</span></span></span>
            </label>
          </div>

          <h2 className="section-title">Step header</h2>
          <div className="card">
            <header className="step-head" style={{ margin: 0 }}>
              <span className="step-head__num">1</span>
              <div>
                <h3 className="step-head__title">Step title</h3>
                <p className="step-head__desc">Optional description under the title.</p>
              </div>
            </header>
          </div>

          <h2 className="section-title">Alerts and badges</h2>
          <div className="sg__stack">
            <p className="alert">Neutral alert · .alert</p>
            <p className="alert alert--info">Info alert · .alert--info</p>
            <p className="alert alert--ok">Success alert · .alert--ok</p>
            <p className="alert alert--error">Error alert · .alert--error</p>
            <div className="sg__row">
              <span className="badge">Default</span>
              <span className="badge badge--dot badge--ok">Paid</span>
              <span className="badge badge--dot badge--warn">Pending</span>
              <span className="badge badge--dot badge--bad">Cancelled</span>
              <span className="badge badge--dot badge--muted">Draft</span>
              <span className="badge badge--accent">Accent</span>
            </div>
          </div>

          <h2 className="section-title">Cards and rows</h2>
          <div className="form-grid">
            <div className="card">Card · .card</div>
            <div className="card card--raised">Raised · .card--raised</div>
            <div className="card card--dashed">Dashed · .card--dashed</div>
            <div className="card card--inset">Inset · .card--inset</div>
          </div>
          <div className="card card--raised" style={{ marginTop: 16 }}>
            <dl className="rows">
              <div><dt>Age group</dt><dd>Under 8</dd></div>
              <div><dt>Sessions</dt><dd>2 training sessions per week</dd></div>
              <div className="rows__total"><dt>Total</dt><dd>€180.00</dd></div>
            </dl>
            <button className="btn btn--block">Continue</button>
          </div>

          <h2 className="section-title">Misc</h2>
          <div className="card">
            <div className="divider">or</div>
            <div className="sg__row"><span className="spinner" /> <span>Spinner · .spinner</span></div>
          </div>
        </div>
      </section>
    </>
  )
}
