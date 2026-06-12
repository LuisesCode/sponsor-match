import * as React from 'react';

export interface MatchStat { value: string; label: string; }

export interface MatchCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  /** Sponsee name */
  name: string;
  /** Primary category, shown as a teal badge */
  category?: string;
  /** City / region */
  location?: string;
  avatarSrc?: string;
  /** Cover image URL — falls back to a navy→teal gradient */
  coverSrc?: string;
  verified?: boolean;
  /** Average rating (supports fractions) */
  rating?: number;
  ratingCount?: number;
  /** 0–100 affinity score shown top-left */
  matchScore?: number;
  /** Starting price text, e.g. "€1.200" */
  priceFrom?: string;
  /** Up to ~3 quick stats (reach, engagement…) */
  stats?: MatchStat[];
  /** Category tags */
  tags?: string[];
  onView?: () => void;
  onSave?: (saved: boolean) => void;
  saved?: boolean;
  style?: React.CSSProperties;
}

/**
 * The signature marketplace card: a sponsee result with cover, verified avatar,
 * rating, quick stats, tags, match score and price. Composes Avatar, RatingStars,
 * VerifiedBadge, Badge, Tag and Button.
 *
 * @startingPoint section="Marketplace" subtitle="Match-Karte für Such-/Entdeckungsseite" viewport="360x440"
 */
export function MatchCard(props: MatchCardProps): JSX.Element;
