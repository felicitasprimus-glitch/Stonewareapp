# Kostenlosen Server einrichten (Hugging Face) – Schritt für Schritt

Damit **„Link einfügen → Outfits"** auch bei modernen Shops klappt, läuft die
App auf einem kleinen Gratis-Server mit echtem Browser (Playwright). Hugging Face
Spaces ist dafür **kostenlos und ohne Kreditkarte**.

Alle benötigten Dateien liegen fertig im Ordner **`hf-space/`** dieses Repos.

## 1. Hugging-Face-Konto anlegen
- Auf <https://huggingface.co/join> registrieren (kostenlos, keine Kreditkarte).

## 2. Neuen Space erstellen
1. Oben rechts auf dein Profilbild → **New Space**
   (oder direkt <https://huggingface.co/new-space>).
2. **Space name:** z. B. `old-money-stylist`
3. **Select the Space SDK:** **Docker** → Vorlage **Blank**
4. **Hardware:** *CPU basic* (kostenlos)
5. **Visibility:** Public oder Private (egal)
6. **Create Space** klicken.

## 3. Die fertigen Dateien hochladen
1. Lade dieses Repo herunter: auf GitHub oben **Code → Download ZIP**,
   dann entpacken. Du brauchst nur den Ordner **`hf-space/`**.
2. Im neuen Space: Reiter **Files** → **Add file** → **Upload files**.
3. Ziehe den **Inhalt** des Ordners `hf-space/` in das Upload-Feld, also:
   - `Dockerfile`
   - `README.md`
   - den Ordner `backend/`
   - den Ordner `static/`
   (Wichtig: nicht den Ordner `hf-space` selbst, sondern seinen *Inhalt* –
   `Dockerfile` muss direkt im Space liegen.)
4. Unten **Commit changes to main** klicken.

## 4. Warten, bis gebaut wird
- Der Space baut jetzt automatisch (Reiter **Logs**, dauert beim ersten Mal
  einige Minuten – das Browser-Image ist groß).
- Wenn oben **Running** steht, ist alles fertig.

## 5. Fertig – das ist dein Link 🎉
- Deine App läuft unter:
  `https://huggingface.co/spaces/DEIN-NAME/old-money-stylist`
- Bzw. direkt: `https://DEIN-NAME-old-money-stylist.hf.space`
- Öffne den Link, füge einen Shop-Link ein → **Outfits**.

---

### Ehrlicher Hinweis
Der Server rendert die Seiten wie ein echter Browser – damit klappen **viele**
Shops automatisch. Die am stärksten geschützten Seiten (z. B. Zara) können sich
trotzdem wehren; das liegt am Shop, nicht an der App. In dem Fall hilft nur ein
anderer Shop.

### Aktualisieren (nach Code-Änderungen)
Die Dateien in `hf-space/` werden aus dem Quellcode erzeugt:

```bash
cd old-money-stylist/frontend && npm install && npm run build
cd ../../ && cp old-money-stylist/backend/*.py hf-space/backend/ \
  && cp old-money-stylist/backend/requirements.txt hf-space/backend/ \
  && cp old-money-stylist/frontend/dist/index.html hf-space/static/index.html
```
Danach die geänderten Dateien erneut in den Space hochladen.
