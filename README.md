# Extremelot Plugin

Estensione browser per **Extremelot** che raggruppa una serie di funzionalità avanzate per semplificare e migliorare l’interfaccia di gioco.

Il plugin si integra direttamente nella pagina principale di gioco e fornisce una barra comandi, finestre modali e strumenti utili per la gestione rapida delle attività di gioco.

---

## Funzionalità principali

- **Barra comandi rapida**  
  Aggiunge una barra con icone per accedere velocemente alle funzionalità principali.

- **Gestione chat**  
  Permette di salvare la chat di gioco tramite un dialog dedicato.

- **Editor azioni**  
  Editor testuale con conteggio caratteri (limite massimo 2000).

- **Gestione missive**  
  Scrittura e lettura della posta direttamente dal plugin.

- **Accesso alle bacheche**  
  Visualizzazione delle bacheche di gioco (Ducale e altre) in finestre modali.

- **Visualizzazione scheda PG**  
  Apertura della scheda del proprio personaggio o di altri PG senza uscire dalla pagina di gioco.

- **Utility varie**  
  Collegamenti rapidi a:
  - regolamento
  - simboli
  - mappa
  - banca
  - elenco online
  - descrizione del luogo
  - Dashboard Gestionale

---

## Requisiti e compatibilità

### Browser supportati
- Google Chrome (Manifest V3)
- Microsoft Edge (Chromium)

Altri browser basati su Chromium potrebbero funzionare, ma non sono ufficialmente supportati.

---

## Pagine supportate

Il plugin è attivo esclusivamente sulle pagine di gioco di Extremelot, in particolare:

- `_index2.asp`
- `index2.asp`
- `_index2.htm`
- `index2.htm`
- tutte le pagine sotto `/lotnew/`

Domini supportati:
- `https://www.extremelot.eu`
- `https://extremelot.eu`

> ⚠️ Se la struttura degli URL o dei frame viene modificata, alcune funzionalità potrebbero non funzionare correttamente.

---

## Permessi richiesti

### `storage`
Utilizzato per:
- salvare preferenze utente (es. debug mode)
- memorizzare impostazioni dell’interfaccia
- mantenere lo stato tra una sessione e l’altra

### `tabs`
Utilizzato per:
- interagire con la tab di gioco attiva
- aprire contenuti nel contesto corretto della pagina

### `scripting`
Utilizzato per:
- iniettare script nella pagina di gioco
- agganciarsi ai frame interni di Extremelot
- intercettare eventi e link

### `alarms`
Utilizzato per:
- task pianificati
- controlli periodici o funzioni future di sincronizzazione

---

## Host permissions

Il plugin ha accesso esclusivamente ai seguenti domini:

- `https://www.extremelot.eu/*`
- `https://extremelot.eu/*`
- `https://extremeplug.altervista.org/*`
- `https://colossus.altervista.org/*`

Nessun accesso a siti esterni non correlati al progetto.

---

## Architettura (panoramica tecnica)

- Content script iniettato nella pagina di gioco
- Barra comandi persistente
- Finestre modali e overlay basati su jQuery UI
- Isolamento iframe tramite `iframeGuard`
- Modularizzazione per feature (`scheda`, `posta`, `bacheche`, ecc.)
- Debug centralizzato (`core/debug.js`)
- Overlay factory condivisa (`ui/overlay.js`)

---

## Limitazioni note

- Il plugin dipende fortemente dalla struttura HTML e dai frame di Extremelot
- Cambiamenti a:
  - nomi dei frame
  - target dei link
  - endpoint ASP/HTM  
  possono causare malfunzionamenti
- Alcune funzionalità richiedono che popup e iframe non siano bloccati dal browser

---

## Troubleshooting

**La barra comandi non compare**
- Verifica di essere su una pagina `/lotnew/`
- Effettua un hard refresh (`CTRL + F5`)
- Controlla che l’estensione sia attiva

**Le finestre si aprono fuori dal plugin**
- Probabile modifica ai target dei link o ai frame
- Segnala il problema includendo URL e screenshot

**Dialog piccoli o senza stile**
- Verifica il caricamento di `jquery-ui.min.css`
- Controlla zoom del browser e scaling di sistema

---

## Roadmap / TO DO

1. **Rendere il menù spostabile**
   - trascinabile con il mouse
   - salvataggio posizione tramite `storage`
   - pulsante di reset posizione
   - compatibile con resize e zoom
   - non interferente con i click delle icone  
   *(Richiesta: Ehinetor)*

---

## Stato del progetto

Il plugin è attualmente in fase di **refactor**:
- la struttura dei file può subire modifiche
- alcune funzionalità potrebbero essere temporaneamente instabili
- l’interfaccia è soggetta a evoluzioni tra le versioni

---

## Autori

- **Dastian** – adattamento a Manifest V3 e implementazioni future
- **Sonic** – adattamento e ampliamento
- **WilliamJ** – script originale
