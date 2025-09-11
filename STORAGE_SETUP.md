# 🗂️ Setup Supabase Storage per LocalSwap

Per abilitare l'upload delle immagini, devi configurare Supabase Storage:

## 📋 **Setup Storage Bucket**

1. **Vai su [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Seleziona il tuo progetto → Storage**
3. **Clicca "Create Bucket"**
4. **Nome bucket:** `items`
5. **Settings:**
   - ✅ Public bucket (per visualizzare le immagini)
   - ✅ File size limit: 5MB
   - ✅ Allowed MIME types: `image/*`

## 🔐 **Policies (RLS)**

Nel tab **Policies** del bucket `items`, aggiungi:

### **Policy 1: Upload**
```sql
-- Nome: Enable upload for authenticated users
-- Operation: INSERT
-- Target: authenticated users

(auth.role() = 'authenticated')
```

### **Policy 2: View**
```sql
-- Nome: Enable public viewing
-- Operation: SELECT  
-- Target: public

true
```

### **Policy 3: Delete**
```sql
-- Nome: Enable delete for own files
-- Operation: DELETE
-- Target: authenticated users

(auth.role() = 'authenticated')
```

## 🗄️ **Aggiungere colonna images alla tabella items**

```sql
-- Esegui questa query nell'SQL Editor di Supabase
ALTER TABLE items 
ADD COLUMN images text[] DEFAULT '{}';

-- Aggiorngi la descrizione della colonna
COMMENT ON COLUMN items.images IS 'Array di URL delle immagini dell''oggetto';
```

## ✅ **Test**

Dopo aver completato il setup:
1. Ricarica l'app
2. Vai su "Aggiungi oggetto" 
3. Prova a caricare un'immagine
4. Dovrebbe funzionare senza errori!

---
🎯 **Una volta configurato il bucket, l'upload delle immagini funzionerà perfettamente!**