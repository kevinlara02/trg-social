# 🚀 TRG DIGITAL MONITOR - GUÍA COMPLETA DE SETUP

## Tiempo Total Estimado: 6-8 horas
## APIs a Configurar: 8
## Dificultad: Media

---

# 1️⃣ GOOGLE BUSINESS PROFILE API

## 1.1 Crear Proyecto en Google Cloud

```
1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con la cuenta de Google del cliente
3. Click en "Seleccionar proyecto" (arriba izquierda)
4. Click en "Nuevo proyecto"
5. Nombre: "TRG Digital Monitor"
6. Click "Crear"
7. Espera a que se cree (1-2 minutos)
```

## 1.2 Habilitar APIs

```
1. En el buscador arriba, busca: "Business Profile"
2. Selecciona "Google My Business API"
3. Click "HABILITAR"

4. Busca nuevamente: "Google Business Profile API"
5. Click "HABILITAR"

6. Busca: "Google Analytics Data API"
7. Click "HABILITAR"
```

## 1.3 Crear Cuenta de Servicio

```
1. Ve a: APIs & Services → Credenciales
2. Click "Crear credenciales" (arriba)
3. Tipo: "Cuenta de servicio"
4. Nombre: "trg-digital-monitor"
5. Descripción: "Service account for TRG Digital Monitor"
6. Click "Crear y continuar"
7. Grant a Role: Selecciona "Editor"
8. Click "Continuar"
9. Click "Crear cuenta de servicio"
```

## 1.4 Descargar Credenciales JSON

```
1. En la lista de cuentas de servicio, click en la que creaste
2. Ve a "Claves" → "Agregar clave"
3. "Crear clave nueva"
4. Tipo: JSON
5. Click "Crear"
6. Un archivo JSON se descargará
7. ✅ GUARDA ESTE ARCHIVO EN LUGAR SEGURO
```

## 1.5 Obtener Service Account Email

```
En el archivo JSON descargado, busca:
"client_email": "trg-digital-monitor@xxxxx.iam.gserviceaccount.com"

✅ COPIA ESTE EMAIL
```

## 1.6 Dar Acceso a cada Restaurante en Google Business

```
Para CADA restaurante:

1. Ve a Google Business Profile:
   https://business.google.com/

2. Selecciona el restaurante (ej: The Benediction)

3. Ve a: Configuración → Usuarios y permisos

4. Click "Invitar un usuario"

5. Email: {el service account email que copiaste}

6. Rol: "Gerente"

7. Click "Invitar"

8. REPETIR para cada uno de los 7 restaurantes
```

✅ **GUARDAR:**
```
GOOGLE_SERVICE_ACCOUNT_KEY: {contenido del JSON descargado}
GOOGLE_CLOUD_PROJECT_ID: {project-id del JSON}
```

---

# 2️⃣ META (FACEBOOK + INSTAGRAM) - RESUMEN RÁPIDO

## 2.1 Crear App

```
1. Ve a: https://developers.facebook.com/
2. Click "Crear aplicación"
3. Tipo: Consumidor
4. Nombre: "TRG Digital Monitor"
5. Email: tu-email@example.com
```

## 2.2 Obtener Credenciales

```
1. Ve a: Settings → Básico
2. ✅ COPIA: App ID
3. ✅ COPIA: App Secret
```

## 2.3 Agregar Productos

```
1. Click "Agregar productos"
2. Busca: "Instagram Graph API" → Configurar
3. Busca: "Facebook Graph API" → Configurar
```

## 2.4 Obtener Tokens para cada Página

```
1. Ve a: Tools → Graph API Explorer
2. En el Query, ejecuta:

GET /me/accounts

3. Resultado tendrá tokens para cada Page
4. ✅ COPIA cada "access_token" para cada restaurante
```

## 2.5 Obtener Instagram Account IDs

```
Para cada PAGE_ID:

GET /{PAGE_ID}?fields=instagram_business_account

3. ✅ COPIA el instagram_business_account.id
```

## 2.6 Convertir a Long-Lived Tokens

```
Para cada SHORT_LIVED_TOKEN:

GET /oauth/access_token?
client_id={APP_ID}
&client_secret={APP_SECRET}
&grant_type=fb_exchange_token
&fb_exchange_token={SHORT_LIVED_TOKEN}

✅ COPIA el nuevo "access_token" (dura 2 meses)
```

## 2.7 Solicitar Meta App Review

```
1. Settings → App Roles → Asegúrate ser Admin
2. Settings → Básico → "Request Advanced Access"
3. Permisos:
   ☑️ pages_manage_posts
   ☑️ instagram_content_publish
   ☑️ instagram_manage_messages
4. Escribir use case: "Manage social media for 7 restaurant locations"
5. ⏳ Esperar 2-6 semanas
```

✅ **GUARDAR:**
```
VITE_META_APP_ID: {app-id}
VITE_META_APP_SECRET: {app-secret}
META_PAGE_ACCESS_TOKEN_TB: {token-the-benediction}
META_PAGE_ACCESS_TOKEN_TW: {token-toast-whittier}
META_PAGE_ACCESS_TOKEN_SW: {token-story-whittier}
META_PAGE_ACCESS_TOKEN_SA: {token-story-anaheim}
META_PAGE_ACCESS_TOKEN_SB: {token-story-brea}
META_PAGE_ACCESS_TOKEN_BM: {token-benny-marys}
META_PAGE_ACCESS_TOKEN_TD: {token-toast-downey}
VITE_INSTAGRAM_BUSINESS_ACCOUNT_IDS: {id1,id2,id3,id4,id5,id6,id7}
```

---

# 3️⃣ YELP API

## 3.1 Acceder a Yelp Developers

```
1. Ve a: https://www.yelp.com/developers/
2. Click "Log in" (arriba derecha)
3. Usa la cuenta Yelp del cliente
```

## 3.2 Crear Aplicación

```
1. Ve a: My Apps
2. Click "Create App"
3. Nombre: "TRG Digital Monitor"
4. Selecciona: "Own a restaurant"
5. Descripción: "Social media and reviews management"
6. Aceptar términos
7. Click "Create App"
```

## 3.3 Obtener API Key

```
1. En la página de tu app
2. Busca "API Key" en la sección "Keys"
3. ✅ COPIA el API Key completo
```

## 3.4 Obtener Business IDs para cada Restaurante

```
En Graph API Explorer (o postman):

GET https://api.yelp.com/v3/businesses/search?location={restaurant-name}
Header: Authorization: Bearer {API_KEY}

Resultado tendrá "id" para cada restaurante
✅ COPIA los Business IDs de los 7 restaurantes
```

✅ **GUARDAR:**
```
VITE_YELP_API_KEY: {api-key}
YELP_BUSINESS_ID_TB: {id}
YELP_BUSINESS_ID_TW: {id}
YELP_BUSINESS_ID_SW: {id}
YELP_BUSINESS_ID_SA: {id}
YELP_BUSINESS_ID_SB: {id}
YELP_BUSINESS_ID_BM: {id}
YELP_BUSINESS_ID_TD: {id}
```

---

# 4️⃣ GOOGLE ANALYTICS 4

## 4.1 Conectar Property

```
1. Ve a: https://analytics.google.com/
2. Click en una propiedad existente (asociada a Squarespace)
3. Ve a: Admin → Property Settings
4. ✅ COPIA: Property ID (formato: 123456789)
```

## 4.2 Crear Service Account para Analytics

```
1. Ve a: https://console.cloud.google.com/
2. Usa el MISMO proyecto creado para Google Business
3. Ve a: APIs & Services → Credenciales
4. Click "Crear credenciales" → "Cuenta de servicio"
5. Nombre: "trg-analytics"
6. Role: "Editor"
7. Crear clave JSON
8. ✅ DESCARGA el JSON
```

## 4.3 Dar Acceso a Google Analytics

```
1. Ve a: https://analytics.google.com/
2. Click en Admin (rueda)
3. Ve a: Property → Property Access Management
4. Click "Invite users"
5. Email: {analytics service account email del JSON}
6. Role: "Viewer" o "Editor"
7. Click "Send invite"
```

✅ **GUARDAR:**
```
GOOGLE_ANALYTICS_PROPERTY_ID: {property-id}
GOOGLE_ANALYTICS_SERVICE_ACCOUNT: {JSON descargado}
```

---

# 5️⃣ SQUARESPACE API (Opcional)

## 5.1 Obtener Squarespace API Key

```
1. Ve a la cuenta Squarespace del cliente
2. Settings → API Keys
3. Click "Generate new key"
4. Nombre: "TRG Digital Monitor"
5. ✅ COPIA el API Key
```

## 5.2 Obtener Collection IDs

```
Para obtener los IDs de las colecciones:

1. En Squarespace, ve a Collections
2. Para cada colección que quieras, copia su ID (en URL)
   Ej: https://example.squarespace.com/admin/collections/{COLLECTION_ID}/

✅ COPIA todos los Collection IDs necesarios
```

✅ **GUARDAR:**
```
VITE_SQUARESPACE_API_KEY: {api-key}
SQUARESPACE_SITE_ID: {site-id}
SQUARESPACE_COLLECTION_IDS: {id1,id2,id3}
```

---

# 6️⃣ OPENABLE Y TRIPADVISOR (Opcional)

## OpenTable

```
Requiere contactar directo a OpenTable Partner Support
1. Email: partners@opentable.com
2. Solicitar: Restaurant API access
3. Proporcionar: Info de los 7 restaurantes
4. ⏳ Esperar aprobación (1-2 semanas)
5. Una vez aprobado: obtener API key
```

## TripAdvisor

```
1. Ve a: https://developer-tripadvisor.com/
2. Create Account si no tienes
3. Create App
4. ✅ OBTÉN: API Key
5. El acceso es limitado (últimas 5 reviews)
```

✅ **GUARDAR:**
```
OPENTABLE_API_KEY: {api-key} (si aplica)
TRIPADVISOR_API_KEY: {api-key}
```

---

# 7️⃣ ANTHROPIC API (YA TIENE)

```
✅ El cliente ya tiene Claude Max
✅ Solo necesitas la API KEY
```

## 7.1 Obtener API Key

```
1. Ve a: https://console.anthropic.com/
2. Click "API Keys"
3. Click "Create Key"
4. Nombre: "TRG Digital Monitor"
5. ✅ COPIA la API Key
```

✅ **GUARDAR:**
```
ANTHROPIC_API_KEY: {api-key}
```

---

# 8️⃣ NETLIFY ENVIRONMENT VARIABLES

## 8.1 Agregar todas las Variables

```
1. Ve a: https://app.netlify.com/
2. Tu sitio → Settings → Environment
3. Click "Add environment variables"

Agrega TODAS estas:

VITE_SUPABASE_URL={ya tiene}
VITE_SUPABASE_ANON_KEY={ya tiene}

VITE_META_APP_ID={meta-app-id}
VITE_META_APP_SECRET={meta-app-secret}
META_PAGE_ACCESS_TOKEN_TB={token-tb}
META_PAGE_ACCESS_TOKEN_TW={token-tw}
META_PAGE_ACCESS_TOKEN_SW={token-sw}
META_PAGE_ACCESS_TOKEN_SA={token-sa}
META_PAGE_ACCESS_TOKEN_SB={token-sb}
META_PAGE_ACCESS_TOKEN_BM={token-bm}
META_PAGE_ACCESS_TOKEN_TD={token-td}
VITE_INSTAGRAM_BUSINESS_ACCOUNT_IDS={ids}

VITE_YELP_API_KEY={yelp-api-key}
YELP_BUSINESS_ID_TB={id}
YELP_BUSINESS_ID_TW={id}
YELP_BUSINESS_ID_SW={id}
YELP_BUSINESS_ID_SA={id}
YELP_BUSINESS_ID_SB={id}
YELP_BUSINESS_ID_BM={id}
YELP_BUSINESS_ID_TD={id}

GOOGLE_SERVICE_ACCOUNT_KEY={json-key}
GOOGLE_CLOUD_PROJECT_ID={project-id}
GOOGLE_ANALYTICS_PROPERTY_ID={property-id}
GOOGLE_ANALYTICS_SERVICE_ACCOUNT={json-key}

VITE_SQUARESPACE_API_KEY={squarespace-key}
SQUARESPACE_SITE_ID={site-id}
SQUARESPACE_COLLECTION_IDS={ids}

VITE_OPENABLE_API_KEY={api-key} (si aplica)
TRIPADVISOR_API_KEY={api-key}

ANTHROPIC_API_KEY={claude-api-key}

VITE_APP_NAME=Digital Monitor
```

---

# 9️⃣ DEPLOY A PRODUCCIÓN

## 9.1 Actualizar GitHub (si es necesario)

```bash
# En tu computadora (en la carpeta del proyecto):

git status  # Ver cambios

git add .   # Agregar todos los cambios

git commit -m "Configure all production APIs"

git push    # Enviar a GitHub
```

## 9.2 Netlify Deploy Automático

```
1. Netlify detecta automáticamente el push en GitHub
2. Inicia el build
3. Detecta variables de entorno
4. Despliega en vivo (2-5 minutos)
5. Puedes ver logs en: Deploys → Build log
```

## 9.3 Verificar Deploy

```
1. Ve a tu sitio: https://tudominio.com
2. Dashboard debe cargar sin errores
3. Todas las APIs disponibles
```

---

# 🔟 TESTING

## 10.1 Test Google Reviews

```
1. Ve a Dashboard
2. Las reviews de Google deben aparecer
3. Intenta responder una
4. La respuesta debe ir a Google
```

## 10.2 Test Meta (Facebook/Instagram)

```
1. Ve a Publish
2. Crea un nuevo post
3. Selecciona: The Benediction
4. Selecciona plataformas: Facebook + Instagram
5. Escribe un mensaje de prueba
6. Click "Publicar"
7. Verifica que aparece en Facebook/Instagram

⚠️ Si Meta App Review no está aprobada, funcionará en test mode
con cuentas admin solamente
```

## 10.3 Test Yelp

```
1. Ve a Reviews
2. Las reviews de Yelp deben aparecer
3. El app permite ver pero no responder vía API
(Las respuestas deben hacerse en biz.yelp.com)
```

## 10.4 Test Google Analytics

```
1. Ve a Traffic
2. Datos de Analytics deben cargar
3. Gráficos deben mostrar tendencias
```

## 10.5 Test Claude AI

```
1. Ve a Reviews
2. Haz click en "Suggest" en una review
3. Claude debe generar una respuesta
4. Verifica que sea en español si la review es en español
```

---

# ✅ CHECKLIST FINAL

```
GOOGLE BUSINESS
[ ] Proyecto creado en Google Cloud
[ ] APIs habilitadas
[ ] Service Account creado
[ ] JSON descargado
[ ] Acceso dado a los 7 restaurantes
[ ] Variables guardadas en Netlify

META
[ ] App creada
[ ] Credenciales guardadas
[ ] Permisos configurados
[ ] Tokens obtenidos para 7 páginas
[ ] Instagram IDs obtenidos
[ ] Tokens convertidos a Long-Lived
[ ] App Review solicitada
[ ] Variables guardadas en Netlify

YELP
[ ] App creada
[ ] API Key obtenida
[ ] Business IDs obtenidos para 7 restaurantes
[ ] Variables guardadas en Netlify

GOOGLE ANALYTICS
[ ] Property ID obtenido
[ ] Service Account creado
[ ] Acceso dado a Google Analytics
[ ] Variables guardadas en Netlify

SQUARESPACE (Opcional)
[ ] API Key obtenida
[ ] Collection IDs obtenidos
[ ] Variables guardadas en Netlify

ANTHROPIC
[ ] API Key copiada
[ ] Variable guardada en Netlify

NETLIFY
[ ] Todas las variables agregadas
[ ] Build completado exitosamente
[ ] Sitio en vivo: https://tudominio.com
[ ] Sin errores en la consola

TESTING
[ ] Dashboard carga sin errores
[ ] Google Reviews aparecen
[ ] Meta puede publicar (test mode si no aprobado)
[ ] Yelp Reviews aparecen
[ ] Analytics carga datos
[ ] Claude genera respuestas AI
[ ] Mobile responsive
```

---

# 📋 RESUMEN RÁPIDO

| API | Tiempo | Aprobación | Crítico |
|-----|--------|-----------|---------|
| Google Business | 1 hora | Inmediata | ✅ Sí |
| Meta | 2 horas | 2-6 semanas | ✅ Sí* |
| Yelp | 30 min | Inmediata | ⚠️ Lectura |
| Google Analytics | 1 hora | Inmediata | ❌ No |
| Squarespace | 30 min | Inmediata | ❌ No |
| OpenTable | - | 1-2 semanas | ❌ No |
| TripAdvisor | 30 min | Inmediata | ❌ No |
| Anthropic | 5 min | N/A | ✅ Sí |

*Meta funciona en test mode antes de aprobación

---

# 🎯 ORDEN RECOMENDADO

```
PRIMERO (Hoy):
1. Google Business Profile (1 hora)
2. Yelp API (30 min)
3. Google Analytics (1 hora)
Total: 2.5 horas

SEGUNDO (Mañana):
1. Meta (2 horas)
   - Crear app
   - Obtener tokens
   - Solicitar review
   - (Esperar 2-6 semanas)

TERCERO (Cuando puedas):
1. Squarespace (30 min)
2. OpenTable/TripAdvisor (opcional)
3. Anthropic (5 min - ya tiene)

CUARTO (Cuando Meta esté aprobado):
- Deploy a producción completo
```

---

# 🚨 ERRORES COMUNES

### "Token expirado"
✅ Convertir a Long-Lived Token (Meta)

### "Permiso denegado en Google"
✅ Asegurar que Service Account tiene acceso a los restaurantes

### "Meta no publica en Instagram"
✅ Asegurar que tiene Instagram Account ID correcto

### "Analytics no carga datos"
✅ Asegurar que tiene Property ID correcto

### "Claude no funciona"
✅ Verificar ANTHROPIC_API_KEY en Netlify

---

¿Empezamos? Te recomiendo comenzar con **Google Business Profile** ahora mismo.

¿Tienes acceso a Google Cloud Console del cliente?
