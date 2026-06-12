The signature marketplace card for a sponsee (Sportler / Verein / Creator). Composes Avatar, RatingStars, VerifiedBadge, Badge, Tag and Button.

```jsx
<MatchCard
  name="Lena Fuchs"
  category="Fitness"
  location="München"
  verified
  matchScore={94}
  rating={4.9}
  ratingCount={128}
  priceFrom="€1.200"
  stats={[{value:'128K',label:'Reichweite'},{value:'7,2%',label:'Engagement'},{value:'12',label:'Deals'}]}
  tags={['Instagram','TikTok','Lifestyle']}
  onView={openProfile}
/>
```

Width is fluid — place in a responsive grid (~320–360px columns).
