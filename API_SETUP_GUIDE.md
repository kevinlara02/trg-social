# TRG Digital Monitor - API Setup Guide

## 📋 Overview
Esta plataforma requiere varios APIs para funcionar con datos reales. Aquí están todos los pasos para configurarlos.

---

## 1️⃣ Google Business Profile API (Reviews & Replies)

### Requisitos:
- Cuenta Google con acceso a Google Business Profiles
- Todos los 7 restaurantes ya verificados en Google Business Profile ✅

### Pasos:
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita estas APIs:
   - **Google My Business API** (deprecated, usar Business Profile API)
   - **Business Profile API** (nueva)
4. Crea credenciales:
   - Ve a "Credenciales" → "Crear credenciales"
   - Tipo: **Cuenta de Servicio**
   - Descarga el JSON key
5. En Google Business Profile Settings:
   - Ve a cada restaurante → Settings → Users & Permissions
   - Agrega el email de la cuenta de servicio con permisos de Manager
6. Guarda en `.env`:
   ```
   VITE_GOOGLE_API_KEY=tu-api-key
   GOOGLE_SERVICE_ACCOUNT_KEY=tu-service-account-key.json
   ```

### Documentación:
- https://developers.google.com/my-business/content/get-started
- https://developers.google.com/business/apis

---

## 2️⃣ Meta (Facebook & Instagram) APIs

### Requisitos:
- 7 Facebook Pages (uno por restaurante) ✅
- 7 Instagram Business Accounts (uno por restaurante) ✅
- Acceso Admin a Meta Business Suite

### Pasos:

#### A) Crear Meta App
1. Ve a [Meta Developers](https://developers.facebook.com)
2. Click "Crear aplicación"
3. Tipo: **Consumidor** (Consumer)
4. Tipo de app: **App de Negocios**
5. Nombre: "TRG Digital Monitor"

#### B) Agregar Productos
1. En tu app → "Agregar productos"
2. Busca **"Acceso a Instagram"** → Agregar
3. Busca **"Facebook Login"** → Agregar
4. Busca **"Facebook Graph API"** → Agregar

#### C) Obtener Tokens
1. Ve a Settings → Básico:
   - Copia **App ID**
   - Copia **App Secret**
2. Ve a Tools → Graph API Explorer:
   - Selecciona tu app
   - Permisos necesarios:
     - `pages_manage_metadata`
     - `pages_manage_posts`
     - `pages_read_engagement`
     - `instagram_content_publish`
     - `instagram_manage_messages`
     - `instagram_graph_api`
   - Genera **Access Token** (temporal)

#### D) Obtener Long-Lived Token
1. En Graph API Explorer, ejecuta:
   ```
   GET /oauth/access_token?
   client_id={APP_ID}
   &client_secret={APP_SECRET}
   &grant_type=fb_exchange_token
   &fb_exchange_token={SHORT_LIVED_TOKEN}
   ```
2. Guarda el token de larga duración (60 días)

#### E) Conectar Pages e Instagram
1. Para cada Page:
   - GET `/{PAGE_ID}?fields=access_token`
   - Guarda el Page Access Token
2. Para cada Instagram Account:
   - GET `/{PAGE_ID}?fields=instagram_business_account`
   - Guarda el Instagram Account ID

### Permisos Requeridos (Meta App Review):
- ⏳ **2-6 semanas** para aprobación
- Necesita: Privacy Policy, uso case, videos demo
- Permisos a solicitar:
  - `pages_manage_posts`
  - `instagram_content_publish`
  - `instagram_manage_messages`

### Guarda en `.env`:
```
VITE_META_APP_ID=tu-app-id
VITE_META_APP_SECRET=tu-app-secret
META_PAGE_ACCESS_TOKEN_1=token-restaurante-1
META_PAGE_ACCESS_TOKEN_2=token-restaurante-2
...
VITE_INSTAGRAM_BUSINESS_ACCOUNT_IDS=id1,id2,id3...
```

### Documentación:
- https://developers.facebook.com/docs/instagram-api
- https://developers.facebook.com/docs/facebook-login

---

## 3️⃣ Yelp API (Reviews - Read Only)

### Requisitos:
- Cuentas de Yelp con acceso Biz (ya tiene) ✅
- Yelp no permite responder via API (solo manualmente)

### Pasos:
1. Ve a [Yelp Developers](https://www.yelp.com/developers)
2. Crea una cuenta (o usa la existente)
3. Crea una nueva app:
   - Nombre: "TRG Digital Monitor"
   - Tipo: "Web Application"
4. Obtén tu **API Key**
5. Test con:
   ```
   GET https://api.yelp.com/v3/businesses/{BUSINESS_ID}/reviews
   Header: Authorization: Bearer {API_KEY}
   ```

### Guarda en `.env`:
```
VITE_YELP_API_KEY=tu-yelp-api-key
```

### Documentación:
- https://www.yelp.com/developers/documentation/v3

---

## 4️⃣ OpenTable API (Reviews - Read Only)

### Requisitos:
- Partner account con OpenTable (requiere aprobación)

### Pasos:
1. Contacta a OpenTable Partner Support
2. Solicita acceso a **Restaurant API**
3. Obtén credenciales
4. Usa endpoint:
   ```
   GET /restaurants/{RESTAURANT_ID}/reviews
   ```

### Nota:
- OpenTable agrega Yelp, Google, Facebook, TripAdvisor reviews en su dashboard
- Los usuarios responden en esos portales originales

---

## 5️⃣ TripAdvisor API (Reviews - Read Only)

### Requisitos:
- Cuentas de TripAdvisor de negocio (ya tiene) ✅
- Partner program approval

### Pasos:
1. Ve a [TripAdvisor Developers](https://developer-tripadvisor.com)
2. Crea una aplicación
3. Solicita acceso a **Content API**
4. Obtén **API Key**
5. Los datos son limitados (últimas 5 reviews)

### Nota:
- TripAdvisor requiere Partner Tier approval (puede tomar tiempo)
- Las respuestas se hacen en TripAdvisor.com portal

---

## 6️⃣ Squarespace API (Contact Forms)

### Requisitos:
- Sitio Squarespace existente ✅

### Pasos:
1. En Squarespace → Settings → API Keys
2. Habilita **Squarespace API**
3. Obtén tu **API Key** y **Client ID**
4. Usa endpoint:
   ```
   GET /api/v1/collections/{COLLECTION_ID}/items
   ```

### Guarda en `.env`:
```
VITE_SQUARESPACE_API_KEY=tu-squarespace-key
VITE_SQUARESPACE_CLIENT_ID=tu-client-id
```

---

## 7️⃣ Google Analytics 4 (Website Traffic)

### Requisitos:
- Sitios web en Squarespace ya tienen GA4 ✅

### Pasos:
1. Ve a [Google Analytics](https://analytics.google.com)
2. Selecciona una propiedad (Squarespace)
3. Crea una credencial de Service Account:
   - Admin → Data Access → Create Service Account
4. Obtén el **Service Account JSON Key**
5. Habilita **Google Analytics Data API** en Cloud Console

### Guarda en `.env`:
```
GOOGLE_ANALYTICS_PROPERTY_ID=tu-property-id
GOOGLE_ANALYTICS_SERVICE_ACCOUNT=tu-service-account.json
```

---

## 8️⃣ Meta Insights (Social Media Stats)

### Ya configurado con Meta APIs arriba
- Usa el mismo Access Token
- Endpoints:
  ```
  GET /{PAGE_ID}/insights?metric=page_fans,page_impressions
  GET /{INSTAGRAM_ID}/insights?metric=impressions,reach
  ```

---

## 9️⃣ Anthropic API (AI Replies)

### Ya configurado ✅
- Archivo: `netlify/functions/ai-reply.js`
- Modelo: `claude-opus-4-8`
- Guarda en Netlify env vars:
```
ANTHROPIC_API_KEY=tu-api-key
AI_MODEL=claude-opus-4-8 (o claude-haiku-4-5 para menor costo)
```

---

## 📊 Supabase Setup

### Ya configurado ✅
Pero para producción:

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia las claves:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxxxxx
   ```
3. Ejecuta el schema.sql para crear las tablas
4. (Opcional) Enable Row Level Security (RLS)

---

## 🚀 Netlify Deployment

### Pasos:
1. Crea repositorio en GitHub
2. Ve a [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Conecta el repo
5. Agrega variables de entorno:
   - Todos los `.env` vars
   - ANTHROPIC_API_KEY
6. Netlify automáticamente:
   - Detecta build script
   - Despliega en cada push
   - Ejecuta funciones serverless

### archivo `netlify.toml` ya configurado ✅

---

## ⏰ Timeline Estimado

| API | Tiempo | Dificultad | Bloqueante |
|-----|--------|-----------|-----------|
| Google Business | 2-3 días | 🟢 Fácil | ⚠️ Necesita verificación |
| Meta (sin aprobación) | 1 día | 🟡 Media | ❌ Sí (2-6 semanas) |
| Yelp | 30 min | 🟢 Fácil | ❌ No (read-only) |
| OpenTable | 1-2 semanas | 🔴 Difícil | ❌ Solo si quieres |
| TripAdvisor | 1-2 semanas | 🔴 Difícil | ❌ Solo si quieres |
| Squarespace | 30 min | 🟢 Fácil | ❌ No |
| Google Analytics | 1 hora | 🟢 Fácil | ❌ No |
| Anthropic | Ya hecho ✅ | N/A | ❌ No |
| Supabase | Ya hecho ✅ | N/A | ❌ No |

---

## ✅ Checklist para Producción

- [ ] Google Business Profile API conectada
- [ ] Meta App creada y Apps agregadas
- [ ] Meta App Review aprobada (2-6 semanas)
- [ ] Yelp API Key configurada
- [ ] OpenTable API (opcional)
- [ ] TripAdvisor API (opcional)
- [ ] Squarespace API Key configurada
- [ ] Google Analytics conectado
- [ ] Anthropic API Key en Netlify
- [ ] Supabase proyecto en producción
- [ ] Todas las variables `.env` en Netlify
- [ ] Sitio desplegado en Netlify
- [ ] Dominio personalizado configurado
- [ ] SSL certificate habilitado

---

## 🆘 Soporte

Para más información sobre cada API:
- Google: https://support.google.com/business/answer/7014883
- Meta: https://developers.facebook.com/docs/
- Yelp: https://www.yelp.com/developers/
- Squarespace: https://developers.squarespace.com/

**Próximos pasos:**
1. Comienza con Google Business Profile (más rápido)
2. Luego Meta (requiere más tiempo para aprobación)
3. Opcionales: Yelp, OpenTable, TripAdvisor
