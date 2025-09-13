# LocalSwap - Configurazione Supabase

## 1. Database Setup

1. Vai su [supabase.com](https://supabase.com) e accedi al tuo progetto
2. Vai a **SQL Editor** nel dashboard
3. Copia tutto il contenuto del file `supabase-complete-migration.sql`
4. Incolla nel SQL Editor e clicca **RUN**

## 2. Environment Variables

Aggiungi queste variabili nel tuo file `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Firebase Auth Integration con Supabase

Poiché usiamo Firebase per l'autenticazione, dobbiamo configurare Supabase per riconoscere i JWT di Firebase.

### A. Configura Firebase in Supabase

1. Vai a **Authentication** → **Settings** in Supabase
2. Scorri fino a **JWT Settings**
3. Aggiungi questa configurazione personalizzata:

```sql
-- SQL da eseguire in Supabase per configurare Firebase Auth
-- Questo permette a Supabase di riconoscere i JWT di Firebase

-- Crea funzione per gestire auth Firebase
CREATE OR REPLACE FUNCTION auth.firebase_user_id() RETURNS text
LANGUAGE sql
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'user_id', '')::text;
$$;

-- Aggiorna le policy per usare Firebase UID
-- Le policy esistenti sono già configurate per auth.jwt() ->> 'sub'
-- che funziona con Firebase
```

### B. Middleware per JWT Firebase

Il sistema è già configurato per inviare il token Firebase a Supabase.
In `src/lib/supabase/client.ts`, il token viene automaticamente inviato.

## 4. Storage Configuration

Lo script SQL ha già creato il bucket "items" per le immagini.

### Verifica Storage:
1. Vai a **Storage** nel dashboard Supabase  
2. Dovresti vedere il bucket "items"
3. Le policy sono già configurate per permettere upload autenticati

## 5. Testing

Dopo aver eseguito la migrazione:

1. **Test Items**: Vai su `/add-item` e prova a pubblicare un oggetto
2. **Test Chat**: Clicca "Scrivi messaggio" su un item per testare il chat
3. **Test Storage**: Prova a caricare un'immagine

## 6. Monitoring

Per monitorare il database:
1. Vai a **Database** → **Tables** per vedere i dati
2. Vai a **API** per testare le query
3. Controlla **Logs** per errori

## 7. Produzione

Per la produzione, assicurati di:
1. Abilitare **Row Level Security** su tutte le tabelle (già fatto)
2. Configurare backup automatici
3. Monitorare l'uso delle API
4. Configurare rate limiting se necessario

## Struttura Tabelle Create

- **items**: Oggetti/servizi pubblicati dagli utenti
- **conversations**: Conversazioni tra utenti per specifici items  
- **messages**: Messaggi nelle conversazioni
- **storage.buckets**: Bucket "items" per immagini

## FAQ

### Q: Come verifico che tutto funzioni?
A: Controlla i logs in tempo reale nella sezione Logs di Supabase mentre usi l'app.

### Q: Gli utenti Firebase vengono creati in Supabase?
A: No, usiamo solo Firebase per l'auth. Supabase riconosce i JWT senza creare utenti locali.

### Q: Come gestisco i permessi?
A: Le Row Level Security policies sono già configurate per Firebase UIDs.