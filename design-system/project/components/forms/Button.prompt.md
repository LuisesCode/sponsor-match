The main action control — use for any clickable primary/secondary action across SponsorMatch.

```jsx
<Button variant="primary" size="lg">Jetzt starten</Button>
<Button variant="energy" iconRight={<Icon name="arrow-right" />}>Match finden</Button>
<Button variant="accent">Deal annehmen</Button>
<Button variant="outline">Mehr erfahren</Button>
<Button variant="ghost" size="sm">Abbrechen</Button>
<Button loading>Wird gesendet…</Button>
```

Variants: `primary` (navy, default), `accent` (teal — confirm/deal), `energy` (orange — sporty CTA, use sparingly), `secondary`, `outline`, `ghost`, `danger`.
Sizes: `sm` `md` `lg`. Props: `iconLeft`, `iconRight`, `fullWidth`, `loading`, `disabled`, `as="a"` + `href`.
