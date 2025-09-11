# 🚀 LocalSwap - Deploy su Vercel

LocalSwap è ora pronto per il deploy in produzione! Segui questi semplici passaggi:

## 📋 Prerequisiti
- Account GitHub (gratuito)
- Account Vercel (gratuito)
- Database Supabase già configurato

## 🔧 Deploy Step by Step

### 1. Crea Repository GitHub
```bash
# Il repository è già pronto con commit iniziale
git remote add origin https://github.com/TUO_USERNAME/localswap.git
git branch -M main
git push -u origin main
```

### 2. Connetti a Vercel
1. Vai su [vercel.com](https://vercel.com) e fai login
2. Clicca "New Project"
3. Connetti il tuo account GitHub
4. Seleziona il repository `localswap`
5. Vercel rileverà automaticamente Next.js

### 3. Configura Variabili d'Ambiente
In Vercel Dashboard → Settings → Environment Variables, aggiungi:

```
NEXT_PUBLIC_SUPABASE_URL=https://fjlqbwkllggdutanvwzd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbHFid2tsbGdnZHV0YW52d3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MzcwMjIsImV4cCI6MjA3MzExMzAyMn0.lbURJ1vEou0vJ6VSbMFbqOnJjTy7yczIFyc2cc163As
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbHFid2tsbGdnZHV0YW52d3pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUzNzAyMiwiZXhwIjoyMDczMTEzMDIyfQ.oQJjNFUUjs9Y2cXmOuCTwcptKTJxIFHztVyB6WFIOlk
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiY3JpcG83NSIsImEiOiJjbWZlaTF1M2YwNnk0Mm9yOWZkdW9nNGs2In0.UAO07rtPNczUtDCzdH6H2g
NEXT_PUBLIC_APP_URL=https://TUO_DOMINIO.vercel.app
NEXT_PUBLIC_MAX_RADIUS_METERS=500
NEXT_PUBLIC_DEFAULT_LOCATION_LAT=45.4642
NEXT_PUBLIC_DEFAULT_LOCATION_LNG=9.1900
```

### 4. Deploy!
- Clicca "Deploy" in Vercel
- Build automatico in ~2 minuti
- App live su `https://TUO_PROGETTO.vercel.app`

### 5. Test Post-Deploy
✅ Testa autenticazione (telefono/email)  
✅ Aggiungi un oggetto  
✅ Visualizza lista oggetti  
✅ Verifica geolocalizzazione  

## 🔄 Aggiornamenti Futuri
Ogni push su `main` triggererà deploy automatico su Vercel!

## 🌐 Dominio Personalizzato (Opzionale)
1. In Vercel → Settings → Domains
2. Aggiungi il tuo dominio
3. Configura DNS secondo le istruzioni Vercel

---

🎉 **LocalSwap è live!** La tua app per scambi iper-locali è ora disponibile in tutto il mondo.