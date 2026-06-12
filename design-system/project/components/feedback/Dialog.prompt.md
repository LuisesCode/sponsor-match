Centered modal dialog with overlay, Escape/overlay-click close, and a footer for actions.

```jsx
<Dialog
  open={open}
  title="Deal annehmen?"
  description="Der Betrag wird im Escrow reserviert, bis beide Seiten bestätigen."
  onClose={() => setOpen(false)}
  footer={<>
    <Button variant="ghost" onClick={close}>Abbrechen</Button>
    <Button variant="accent" onClick={confirm}>Annehmen</Button>
  </>}
>
  <p>Vertragswert: <strong>€4.250</strong> · Laufzeit 3 Monate.</p>
</Dialog>
```
