// Testimonials. Honest empty state until real Upwork reviews exist (see
// data/profile.js `testimonials` — nothing invented). Two presentations:
//   • "pane"     — full morph pane (like Projects/Contact)
//   • "expanded" — block shown on Home when the action panel collapses (same
//                  trigger as the portrait flip), filling the freed space. The
//                  collapsed Home state is a tertiary CTA button in ActionPanel.
// Once `testimonials` has entries, both variants render real cards instead.
import { testimonials, contact } from "../data/profile.js";

const QUOTE = "“"; // “

function UpworkButton() {
  if (!contact.upwork) return null;
  return (
    <a className="glass-button btn-accent tm-cta" href={contact.upwork} target="_blank" rel="noopener noreferrer">
      View my Upwork profile <span aria-hidden="true" className="btn-arrow">↗</span>
    </a>
  );
}

function TestimonialCard({ t }) {
  const meta = [t.role, t.org].filter(Boolean).join(" · ");
  return (
    <figure className="tm-card glass-card">
      <span className="tm-card__mark" aria-hidden="true">{QUOTE}</span>
      <blockquote className="tm-card__quote">{t.quote}</blockquote>
      <figcaption className="tm-card__cite">
        <span className="tm-card__author">{t.author}</span>
        {meta && <span className="tm-card__role">{meta}</span>}
        {t.source && <span className="tm-card__source">{t.source}</span>}
      </figcaption>
    </figure>
  );
}

function EmptyState({ variant }) {
  return (
    <div className={`tm-empty tm-empty--${variant}`}>
      <h3 className="tm-empty__title">Client feedback, on the way</h3>
      <p className="tm-empty__body">
        I’m building my track record on Upwork. Verified client testimonials will appear
        here as projects wrap up.
      </p>
      <UpworkButton />
      {variant === "pane" && (
        <div className="tm-ghosts" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="tm-ghost glass-card">
              <span className="tm-ghost__mark">{QUOTE}</span>
              <span className="tm-ghost__line" />
              <span className="tm-ghost__line" />
              <span className="tm-ghost__line tm-ghost__line--short" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Testimonials({ variant = "pane", onNavigate }) {
  const has = testimonials.length > 0;

  const content = has ? (
    <div className="tm-grid">
      {testimonials.map((t, i) => (
        <TestimonialCard key={i} t={t} />
      ))}
    </div>
  ) : (
    <EmptyState variant={variant} />
  );

  // Full morph pane.
  if (variant === "pane") {
    return (
      <section className="pane-testimonials" aria-labelledby="tm-heading">
        <h2 className="pane-title" id="tm-heading">What clients say</h2>
        {content}
      </section>
    );
  }

  // Home "expanded" block (rendered inside the action panel when collapsed).
  return <div className="tm-expanded">{content}</div>;
}
