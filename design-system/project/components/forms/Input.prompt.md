Text field with label, hint, error and optional icons. Use for all single-line text entry.

```jsx
<Input label="E-Mail" type="email" placeholder="name@firma.de" required />
<Input label="Suche" iconLeft={<Icon name="search" size={18} />} placeholder="Sportler, Verein, Creator…" />
<Input label="Passwort" type="password" error="Mindestens 8 Zeichen" />
```

Props: `label`, `hint`, `error`, `iconLeft`, `iconRight`, `size` (`sm`/`md`/`lg`), plus all native `<input>` attributes.
