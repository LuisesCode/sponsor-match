import React from 'react';
import { Avatar } from './Avatar.jsx';
import { RatingStars } from '../feedback/RatingStars.jsx';
import { VerifiedBadge } from '../feedback/VerifiedBadge.jsx';
import { Badge } from '../feedback/Badge.jsx';
import { Tag } from './Tag.jsx';
import { Button } from '../forms/Button.jsx';

/** SponsorMatch — MatchCard: the marketplace result card for a sponsee. */
export function MatchCard({
  name, category, location, avatarSrc, coverSrc, verified = false,
  rating, ratingCount, matchScore, priceFrom, stats = [], tags = [],
  onView, onSave, saved = false, style, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [isSaved, setSaved] = React.useState(saved);

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column', width: '100%', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'box-shadow var(--dur-med) var(--ease-out), transform var(--dur-med) var(--ease-out)', ...style,
      }}
      {...rest}
    >
      {/* Cover */}
      <div style={{
        position: 'relative', height: 96,
        background: coverSrc ? `center/cover no-repeat url(${coverSrc})` : 'linear-gradient(120deg, var(--navy-600), var(--teal-600))',
      }}>
        {matchScore != null && (
          <span style={{
            position: 'absolute', top: 10, left: 12, display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--surface)',
            color: 'var(--accent-press)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--fs-xs)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
            {matchScore}% Match
          </span>
        )}
        <button onClick={(e) => { e.stopPropagation(); setSaved(!isSaved); onSave && onSave(!isSaved); }}
          aria-label="Merken" style={{
            position: 'absolute', top: 10, right: 12, width: 32, height: 32, borderRadius: 'var(--radius-md)',
            border: 'none', cursor: 'pointer', background: 'var(--surface)', color: isSaved ? 'var(--energy)' : 'var(--text-muted)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)',
          }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '0 var(--space-5) var(--space-5)', marginTop: -26 }}>
        <Avatar name={name} src={avatarSrc} size={56} verified={verified} style={{ border: '3px solid var(--surface)', borderRadius: '50%' }} />
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h4)', color: 'var(--text)', letterSpacing: '-0.01em' }}>{name}</span>
          {verified && <VerifiedBadge type="verified" showLabel={false} size="sm" />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {category && <Badge tone="accent" size="sm">{category}</Badge>}
          {location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
              {location}
            </span>
          )}
        </div>

        {rating != null && (
          <div style={{ marginTop: 10 }}><RatingStars value={rating} count={ratingCount} size={15} showValue /></div>
        )}

        {stats.length > 0 && (
          <div style={{ display: 'flex', gap: 18, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>{s.value}</span>
                <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {tags.map((t, i) => <Tag key={i} style={{ padding: '3px 9px', fontSize: 'var(--fs-xs)' }}>{t}</Tag>)}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
          {priceFrom != null && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', fontWeight: 600 }}>ab</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--fs-lg)', color: 'var(--text)' }}>{priceFrom}</span>
            </div>
          )}
          <Button variant="primary" size="sm" onClick={onView} style={{ marginLeft: 'auto' }}>Profil ansehen</Button>
        </div>
      </div>
    </div>
  );
}
