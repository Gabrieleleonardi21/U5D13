# U5D13 · Biblioteca

Gestionale di una biblioteca: catalogo pubblico, richieste e prestiti per i lettori, banco del bibliotecario per gli admin.

| Parte | Tecnologia | In locale | Su Render |
|---|---|---|---|
| Backend (radice) | Spring Boot 4.1.1, Java 25, PostgreSQL | `localhost:8080` | Web Service (Docker) |
| Frontend (`fe/`) | React 19 + Vite (JSX), Tailwind 4, shadcn/ui, TanStack Query | `localhost:5173` | Static Site |

## Funzionalità

- **Catalogo** pubblico con ricerca, filtri e ordinamento (stato nell'URL), copertine da Open Library.
- **Lettore**: sceglie i libri da una lista, invia la richiesta (le copie restano prenotate), segue richieste e prestiti.
- **Admin**: approva/rifiuta le richieste, apre/proroga/chiude prestiti (penale automatica), gestisce libri, generi e copie.
- **SuperUser**: promuove/revoca Admin, gestisce le costanti (durate, penali, limite di libri per lettore).

## Sicurezza

- JWT in cookie `HttpOnly` + `SameSite=Strict` (`Path=/api`): JavaScript non può leggerlo.
  Il frontend chiama sempre `/api` sulla propria origine (proxy di Vite in locale, rewrite di Render in produzione).
- Token revocabili (logout, cambio ruolo) e ripuliti ogni notte quando scadono.
- `JWT_SECRET` e `SUPERUSER_PASSWORD` sono obbligatori: senza, l'app non parte.

## Avvio in locale

1. PostgreSQL sulla 5432 e un database vuoto, es. `createdb -U postgres u5d13`.
2. Copiare `.env.example` in `.env` e compilarlo (`DB_URL`, `JWT_SECRET`, `SUPERUSER_PASSWORD`, `COOKIE_SECURE=false`).
3. Backend: `./mvnw spring-boot:run`
4. Frontend: `cd fe && npm install && npm run dev` → http://localhost:5173

Postman: collection ed environment in `postman/` (il token viene letto dal cookie di risposta).

## Deploy su Render

1. **New > Blueprint** e scegliere questa repo: `render.yaml` crea `u5d13-db`, `u5d13-be`, `u5d13-fe`.
2. Nella dashboard di `u5d13-be` impostare `SUPERUSER_EMAIL` e `SUPERUSER_PASSWORD` (`JWT_SECRET` la genera Render).
3. Se Render assegna nomi diversi (nome già occupato), aggiornare in `render.yaml` la rewrite `/api/*`
   e `ALLOWED_ORIGIN` con gli URL reali, poi rifare il deploy.

Il piano free mette in pausa il backend dopo 15 minuti di inattività: la prima richiesta può impiegare ~1 minuto.

## Struttura

```
render.yaml            blueprint: database + backend + frontend
Dockerfile             immagine del backend (usata da Render)
src/main/java/it/epicode/biblioteca/
  controllers/ services/ repositories/ entities/ dto/
  security/            JWT, cookie HttpOnly, CORS
  config/              DATABASE_URL -> JDBC, dati iniziali
postman/               collection ed environment
fe/
  src/features/        catalogo, auth, lista, prestiti, admin
  src/components/      layout, form, background (Fireplace, Paper), GlowCursor
  src/lib/             client API, endpoint, formattazione
```
