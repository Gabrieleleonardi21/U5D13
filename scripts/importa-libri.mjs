// Importa nel catalogo una lista di libri presi da Open Library, passando dalle API del backend.
//
// Uso (backend avviato, account Admin o SuperUser):
//   BIBLIOTECA_EMAIL=superuser@biblioteca.it BIBLIOTECA_PASSWORD=... node scripts/importa-libri.mjs
// Opzionale: BIBLIOTECA_URL (default http://localhost:8080)
//
// Per ogni titolo: cerca l'opera su Open Library, verifica l'autore, sceglie un'edizione in italiano
// con copertina e ISBN, poi crea il libro. Si può rilanciare: i libri già presenti (stesso ISBN) vengono saltati.
// Prezzo e numero di copie non esistono su Open Library: sono valori di esempio.

const BASE_URL = process.env.BIBLIOTECA_URL ?? 'http://localhost:8080'
const EMAIL = process.env.BIBLIOTECA_EMAIL
const PASSWORD = process.env.BIBLIOTECA_PASSWORD
// Open Library chiede di identificare i client nello User-Agent
const OL_HEADERS = { 'User-Agent': 'U5D13-biblioteca-import/1.0' }

// [titolo italiano, autore (il cognome serve per la verifica), genere, titolo originale facoltativo].
// Il titolo originale serve quando su Open Library l'opera straniera non si trova col titolo italiano.
// Solo opere dal 1450 in poi (limite del BE).
const LIBRI = [
  ['I promessi sposi', 'Manzoni', 'Classici'],
  ['Il Gattopardo', 'Tomasi di Lampedusa', 'Classici'],
  ['La coscienza di Zeno', 'Svevo', 'Classici'],
  ['Il fu Mattia Pascal', 'Pirandello', 'Classici'],
  ['Uno, nessuno e centomila', 'Pirandello', 'Classici'],
  ['I Malavoglia', 'Verga', 'Classici'],
  ['Il sentiero dei nidi di ragno', 'Calvino', 'Classici'],
  ['Se una notte d\'inverno un viaggiatore', 'Calvino', 'Classici'],
  ['Il visconte dimezzato', 'Calvino', 'Classici'],
  ['Il cavaliere inesistente', 'Calvino', 'Classici'],
  ['La luna e i falò', 'Pavese', 'Classici'],
  ['Il deserto dei Tartari', 'Buzzati', 'Classici'],
  ['Cristo si è fermato a Eboli', 'Levi', 'Classici'],
  ['Il giardino dei Finzi-Contini', 'Bassani', 'Classici'],
  ['La Storia', 'Morante', 'Classici'],
  ['L\'isola di Arturo', 'Morante', 'Classici'],
  ['Lessico famigliare', 'Ginzburg', 'Classici'],
  ['Gli indifferenti', 'Moravia', 'Classici'],
  ['Il Principe', 'Machiavelli', 'Saggistica'],
  ['Le avventure di Pinocchio', 'Collodi', 'Classici'],
  ['Cuore', 'De Amicis', 'Classici'],
  ['Orgoglio e pregiudizio', 'Austen', 'Classici', 'Pride and Prejudice'],
  ['Delitto e castigo', 'Dosto', 'Classici', 'Crime and Punishment'],
  ['Anna Karenina', 'Tolstoy', 'Classici', 'Anna Karenina'],
  ['Madame Bovary', 'Flaubert', 'Classici', 'Madame Bovary'],
  ['Il grande Gatsby', 'Fitzgerald', 'Classici', 'The Great Gatsby'],
  ['Il vecchio e il mare', 'Hemingway', 'Classici', 'The Old Man and the Sea'],
  ['Cent\'anni di solitudine', 'García Márquez', 'Classici', 'Cien años de soledad'],
  ['Il piccolo principe', 'Saint-Exupéry', 'Classici', 'Le Petit Prince'],
  ['Moby Dick', 'Melville', 'Classici', 'Moby Dick'],
  ['Frankenstein', 'Shelley', 'Classici', 'Frankenstein'],
  ['Don Chisciotte', 'Cervantes', 'Classici', 'Don Quijote'],
  ['Il ritratto di Dorian Gray', 'Wilde', 'Classici', 'The Picture of Dorian Gray'],
  ['Lo straniero', 'Camus', 'Classici', 'L\'Étranger'],
  ['La metamorfosi', 'Kafka', 'Classici', 'Die Verwandlung'],
  ['Il processo', 'Kafka', 'Classici', 'Der Process'],
  ['Siddharta', 'Hesse', 'Classici', 'Siddhartha'],
  ['Fahrenheit 451', 'Bradbury', 'Fantascienza', 'Fahrenheit 451'],
  ['Il mondo nuovo', 'Huxley', 'Fantascienza', 'Brave New World'],
  ['Io, robot', 'Asimov', 'Fantascienza', 'I, Robot'],
  ['Fondazione', 'Asimov', 'Fantascienza', 'Foundation'],
  ['Solaris', 'Lem', 'Fantascienza', 'Solaris'],
  ['Dieci piccoli indiani', 'Christie', 'Giallo', 'And Then There Were None'],
  ['Il mastino dei Baskerville', 'Doyle', 'Giallo', 'The Hound of the Baskervilles'],
  ['Uno studio in rosso', 'Doyle', 'Giallo', 'A Study in Scarlet'],
  ['La forma dell\'acqua', 'Camilleri', 'Giallo'],
  ['Il giorno della civetta', 'Sciascia', 'Giallo'],
  ['Harry Potter e la pietra filosofale', 'Rowling', 'Fantasy', 'Harry Potter and the Philosopher\'s Stone'],
  ['Il leone, la strega e l\'armadio', 'Lewis', 'Fantasy', 'The Lion, the Witch and the Wardrobe'],
  ['Il mondo di Sofia', 'Gaarder', 'Saggistica', 'Sofies verden'],
  ['Dal big bang ai buchi neri', 'Hawking', 'Saggistica', 'A Brief History of Time'],
  ['Gomorra', 'Saviano', 'Saggistica'],
]

// Esclusi dopo verifica a occhio: su Open Library l'unica edizione italiana ha dati sbagliati
// ("Il piacere": la copertina è la pagina del copyright; "La storia infinita": l'ISBN è di un altro libro).

// Edizioni verificate a mano: Open Library mescola le opere (es. I Malavoglia con Mastro-don Gesualdo)
// o propone prima un'edizione straniera. Per questi titoli la ricerca automatica non viene usata.
const EDIZIONI_VERIFICATE = {
  'I Malavoglia': {
    isbn: 9788817151788,
    autore: 'Giovanni Verga',
    casaEditrice: 'Rizzoli',
    annoDiUscita: 1881,
    copertinaRigida: false,
    path: 'https://covers.openlibrary.org/b/id/12510042-L.jpg',
  },
  'Lessico famigliare': {
    isbn: 9788806174293,
    autore: 'Natalia Ginzburg',
    casaEditrice: 'Einaudi',
    annoDiUscita: 1963,
    copertinaRigida: false,
    path: 'https://covers.openlibrary.org/b/id/8366771-L.jpg',
  },
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

// Confronto senza accenti, maiuscole e punteggiatura
const normalizza = (s) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Prezzo di esempio stabile (stesso titolo -> stesso prezzo), tra 8.90 e 22.90
function prezzoEsempio(titolo) {
  let h = 0
  for (const c of titolo) h = (h * 31 + c.charCodeAt(0)) | 0
  return Number((8.9 + (Math.abs(h) % 15)).toFixed(2))
}

// ISBN-10 -> ISBN-13 (prefisso 978 e nuova cifra di controllo)
function isbn13Da10(isbn10) {
  const base = `978${isbn10.slice(0, 9)}`
  let somma = 0
  for (let i = 0; i < 12; i++) {
    let peso = 1
    if (i % 2 === 1) peso = 3
    somma += Number(base[i]) * peso
  }
  return base + ((10 - (somma % 10)) % 10)
}

async function olJson(url) {
  const res = await fetch(url, { headers: OL_HEADERS })
  if (!res.ok) throw new Error(`Open Library ${res.status} su ${url}`)
  return res.json()
}

// ---------- Client del backend ----------
let token = null

async function be(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const init = { method, headers }
  if (body !== undefined) init.body = JSON.stringify(body)
  const res = await fetch(BASE_URL + path, init)
  const testo = await res.text()
  const dati = testo && JSON.parse(testo)
  if (!res.ok) throw new Error(`BE ${res.status} ${path}: ${dati?.message ?? JSON.stringify(dati?.errors ?? dati)}`)
  return { res, dati }
}

async function accedi() {
  const { res } = await be('/api/user/login', { method: 'POST', body: { username: EMAIL, password: PASSWORD } })
  // Il BE mette il JWT solo nel cookie HttpOnly: lo leggiamo e lo usiamo come Bearer
  token = /biblioteca_token=([^;]+)/.exec(res.headers.get('set-cookie') ?? '')?.[1]
  if (!token) throw new Error('Login riuscito ma cookie del token assente')
}

// ---------- Ricerca su Open Library ----------

/** Restituisce i dati per NuovoLibroRequest, oppure un motivo per cui il libro va saltato. */
const isItaliano = (e) => (e.isbn_13 ?? []).some((i) => i.startsWith('97888')) || (e.isbn_10 ?? []).some((i) => i.startsWith('88'))

// Cerca l'opera per titolo + autore e tiene la prima il cui autore contiene il cognome atteso
async function cercaOpera(titolo, cognome) {
  const q = new URLSearchParams({ q: `${titolo} ${cognome}`, fields: 'key,title,author_name,first_publish_year', limit: '5' })
  const { docs } = await olJson(`https://openlibrary.org/search.json?${q}`)
  for (const d of docs) {
    const autore = (d.author_name ?? []).find((a) => normalizza(a).includes(cognome))
    if (autore) return { ...d, autore }
  }
  return null
}

// Le opere famose hanno migliaia di edizioni: si scorrono a pagine fino a trovarne di italiane
async function edizioniItaliane(chiaveOpera) {
  const trovate = []
  for (let offset = 0; offset < 3000 && trovate.length < 10; offset += 1000) {
    const { entries } = await olJson(`https://openlibrary.org${chiaveOpera}/editions.json?limit=1000&offset=${offset}`)
    trovate.push(...entries.filter(
      (e) => (e.languages ?? []).some((l) => l.key === '/languages/ita') && (e.covers ?? []).some((c) => c > 0),
    ))
    if (entries.length < 1000) break
  }
  return trovate
}

async function trovaEdizione(titolo, autore, originale) {
  const verificata = EDIZIONI_VERIFICATE[titolo]
  if (verificata) return { edizione: { ...verificata, titolo } }

  const cognome = normalizza(autore).split(' ').at(-1)
  let opera = await cercaOpera(titolo, cognome)
  if (!opera && originale) opera = await cercaOpera(originale, cognome)
  if (!opera) return { saltato: 'opera non trovata' }

  // Prima gli ISBN italiani (978-88): alcune edizioni "in italiano" sono di editori stranieri
  const italiane = (await edizioniItaliane(opera.key)).toSorted((a, b) => Number(isItaliano(b)) - Number(isItaliano(a)))
  for (const e of italiane) {
    let isbn = (e.isbn_13 ?? []).find((i) => /^\d{13}$/.test(i))
    const isbn10 = (e.isbn_10 ?? []).find((i) => /^\d{10}$/.test(i))
    if (!isbn && isbn10) isbn = isbn13Da10(isbn10)
    if (!isbn) continue
    return {
      edizione: {
        isbn: Number(isbn),
        // Titolo della nostra lista: quello delle edizioni su Open Library è spesso in maiuscolo o con sottotitoli
        titolo,
        autore: opera.autore,
        casaEditrice: (e.publishers ?? ['Editore sconosciuto'])[0],
        // Anno della prima pubblicazione dell'opera, non della singola edizione
        annoDiUscita: opera.first_publish_year,
        copertinaRigida: /hard|rilegat|cartonat/i.test(e.physical_format ?? ''),
        path: `https://covers.openlibrary.org/b/id/${e.covers.find((c) => c > 0)}-L.jpg`,
      },
    }
  }
  return { saltato: 'nessuna edizione italiana con copertina e ISBN' }
}

// ---------- Importazione ----------

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error('Imposta BIBLIOTECA_EMAIL e BIBLIOTECA_PASSWORD (account Admin o SuperUser).')
    process.exit(1)
  }
  await accedi()

  // Generi esistenti; quelli mancanti si creano al primo uso
  const { dati: generiEsistenti } = await be('/api/generi/allGeneri')
  const generi = new Map(generiEsistenti.map((g) => [normalizza(g.nome), g.id]))
  const idGenere = async (nome) => {
    if (!generi.has(normalizza(nome))) {
      const { dati } = await be('/api/generi/newGenere', { method: 'POST', body: { nome } })
      generi.set(normalizza(nome), dati.id)
      console.log(`+ genere "${nome}"`)
    }
    return generi.get(normalizza(nome))
  }

  const esito = { importati: 0, giaPresenti: 0, saltati: [] }
  const annoCorrente = new Date().getFullYear()

  for (const [titolo, autore, genere, originale] of LIBRI) {
    try {
      const trovato = await trovaEdizione(titolo, autore, originale)
      if (trovato.saltato) {
        esito.saltati.push(`${titolo}: ${trovato.saltato}`)
        continue
      }
      const e = trovato.edizione
      if (!e.annoDiUscita || e.annoDiUscita < 1450 || e.annoDiUscita > annoCorrente) {
        esito.saltati.push(`${titolo}: anno ${e.annoDiUscita} fuori dai limiti del BE`)
        continue
      }
      // Ricerca per ISBN (q di sole cifre = ISBN esatto): se c'è già non si sommano copie
      const { dati: esistenti } = await be(`/api/book/search?q=${e.isbn}&size=1`, { method: 'POST' })
      if (esistenti.totalElements > 0) {
        esito.giaPresenti++
        continue
      }
      await be('/api/book/newLibro', {
        method: 'POST',
        body: {
          ...e,
          edizione: null,
          prezzo: prezzoEsempio(titolo),
          copie: 1 + (e.isbn % 4),
          genereId: await idGenere(genere),
        },
      })
      esito.importati++
      console.log(`✓ ${e.titolo} — ${e.autore} (${e.casaEditrice}, ISBN ${e.isbn})`)
    } catch (err) {
      esito.saltati.push(`${titolo}: ${err.message}`)
    }
    // Rispetto dei limiti di Open Library
    await pausa(300)
  }

  console.log(`\nImportati ${esito.importati}, già presenti ${esito.giaPresenti}, saltati ${esito.saltati.length}`)
  for (const s of esito.saltati) console.log(`  - ${s}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
