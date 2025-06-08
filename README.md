# SL Avgångar — Nästa avgångar på surfplatta, dator eller mobil

Det här är en enkel webbsida som visar nästa avgångar från stationer nära dig i Stockholm. Den är tänkt att köras på en surfplatta som står i hallen och visar realtidsinformation för utvalda stationer. Finns fortfarande en del arbete att göra, bidra om du vill :) Ffa behöver den bli mer responsiv på typ mobil liggandes. 

---

## Funktioner

- Visar avgångar för norrgående och södergående riktningar (eller anpassat beroende på station).
- Uppdaterar avgångar automatiskt var 30:e sekund.
- Visar förseningsinformation och inställda avgångar.
- Enkel att använda på både desktop och mobil (responsiv design) (med några undantag).
- Batteristatus visas i toppen.
- Välj mellan olika stationer med knappar (desktop) eller dropdown (mobil).

---

## Anpassa stationer (lägg till/ta bort/ändra stationer)

Stationerna som visas definieras i källkoden. För att ändra vilka stationer som visas behöver du:

1. Öppna källkoden (HTML/JS-filen) i en texteditor.
2. Leta upp sektionen där stationerna listas.
3. Lägg till, ta bort eller ändra stationer enligt instruktionerna i koden.
4. Spara och ladda om sidan på surfplattan.

---

## Hur hittar jag stationsnumret?

Stationsnumret används för att hämta avgångsinformation från SL:s öppna API.

För att hitta rätt stationsnummer kan du använda SL:s officiella API för stationer: https://transport.integration.sl.se/v1/sites?expand=true


### Steg för att hitta stationsnumret:

1. Öppna länken i en webbläsare eller använd ett verktyg som `curl` eller Postman för att göra en GET-förfrågan.
2. Du får tillbaka en JSON-lista med stationer (`sites`) som innehåller namn och ID.
3. Sök efter den station du vill lägga till, till exempel "Grindsgatan".
4. Stationsnumret är värdet i fältet `id` för den stationen.
5. Använd detta `id` som stationsnummer i källkoden för att visa avgångar från den stationen.

## Kom igång

1. Spara HTML-filen på din surfplatta.
2. Öppna filen i en modern webbläsare.
3. Sidan hämtar automatiskt avgångsinformation och uppdateras regelbundet.
4. Eller forka det och anslut mot din github.io

---

## Teknisk info

- Byggd med HTML, CSS och JavaScript.
- Använder SL:s offentliga trafik-API: https://transport.integration.sl.se/
- Realtidsuppdatering med nedräkning och filtrering.
- Responsiv design för både desktop och mobil.

---

## License

Man kan inte upphovsrättskydda en serie bokstäver och siffror. Alltså fritt att använda för personligt bruk

---

## Tips

- För bästa resultat, kör sidan i kioskläge, med tex Fully kiosk browser
- Vill du ändra stationer, följ anvisningarna ovan och justera källkoden.

---

Lycka till med din personliga SL-skärm! 🚆📱

