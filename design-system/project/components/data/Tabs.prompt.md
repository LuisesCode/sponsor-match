Tab bar in underline (page sections) or pill (segmented) variant.

```jsx
<Tabs tabs={['Übersicht','Mediakit','Bewertungen']} defaultValue="Übersicht" onChange={setTab} />
<Tabs variant="pill" tabs={[{value:'all',label:'Alle',count:24},{value:'fav',label:'Favoriten',count:6}]} />
```
