# Elinos · Etiquetas planchables

App de pedidos hecha en **Vue 3 + TypeScript + Vite**, con Supabase como base de datos.

- `/` → Catálogo: el cliente elige personaje, nombre, tamaño y forma, ve el total calculado y envía el pedido.
- `/panel` → Panel del taller: ves los pedidos que llegan, con contador por estado (Nuevo / En producción / Enviada) y actualización en tiempo real.
- Al enviar un pedido, además de guardarse en Supabase, se abre WhatsApp con el resumen ya escrito para que el cliente te lo mande directo.

## 1. Instalar dependencias

Necesitas [Node.js](https://nodejs.org) instalado (versión 18 o más reciente).

```bash
npm install
```

## 2. Crear el proyecto en Supabase (gratis)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta / un proyecto nuevo (tarda ~2 min en aprovisionarse).
2. Entra a **SQL Editor** → **New query**, pega el contenido de `supabase/schema.sql` y dale **Run**. Esto crea la tabla `orders` con las reglas de acceso.
3. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public key**

## 3. Configurar tus variables

```bash
cp .env.example .env
```

Abre `.env` y llena:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SELLER_WHATSAPP=5215512345678   # tu número, con código de país, sin + ni espacios
VITE_PANEL_PASSWORD=elige-una-clave
```

## 4. Correr en desarrollo

```bash
npm run dev
```

Abre la URL que te muestre la terminal (normalmente `http://localhost:5173`).

## 5. Publicarlo (hosting gratis)

La forma más fácil: sube esta carpeta a un repositorio de GitHub y conéctalo a **Vercel** o **Netlify** (ambos gratis):

```bash
npm run build
```

Esto genera la carpeta `dist/`, que es la que se sube al hosting. En Vercel/Netlify solo tienes que configurar las mismas variables de entorno del paso 3 en su panel ("Environment Variables").

## ⚠️ Si ya creaste la tabla `orders` antes de este cambio (FAQ + vista previa opcional)

Se agregó la posibilidad de que el cliente pida una vista previa antes de imprimir. Si tu tabla `orders` ya existía, corre esto en el SQL Editor:

```sql
alter table orders add column if not exists wants_preview boolean not null default false;
```

## ⚠️ Si ya creaste la tabla `orders` antes de este cambio de modelo (etiquetas planchables por paquete)

Este proyecto cambió a un solo producto (etiquetas planchables), vendido por paquete de 85, en vez de precio por unidad/tamaño. Si tu tabla `orders` ya existía en Supabase, entra a **SQL Editor → New query** y corre esto para actualizarla (no hace falta repetir todo el `schema.sql`):

```sql
alter table orders add column if not exists packages int not null default 1;
alter table orders drop column if exists size_id;
alter table orders drop column if exists unit_price;
```

## ⚠️ Si ya creaste la tabla `orders` antes del cambio de "borrar pedidos"

Este proyecto agregó el permiso para **borrar pedidos**. Si tu tabla `orders` ya existía en Supabase, entra a **SQL Editor → New query** y corre solo esto (no hace falta repetir todo el `schema.sql`):

```sql
create policy "Borrar pedidos"
  on orders for delete
  to anon
  using (true);
```

## Personalizar tu política de pago y datos bancarios

Todo vive en:

```
src/data/payment.ts
```

Ahí editas el texto de tu política (ya viene con el que me diste) y tus datos bancarios reales (banco, titular, CLABE). Cuando el cliente termina su pedido, ve automáticamente esa política + tus datos + un botón para copiarlos y otro para avisarte por WhatsApp que ya depositó — sin que tú tengas que mandárselo tú mismo cada vez.

El pedido entra al panel con estado **"Pendiente de pago"**. Cuando confirmes que llegó el depósito, en el panel hay un botón **"Marcar como pagado"** que lo pasa a "Nuevo" para que empieces a elaborarlo.

## Personalizar la galería de trabajos anteriores

```
src/components/WorkGallery.vue
```

Ahí hay un arreglo `examples` con trabajos de ejemplo (por ahora con emojis de placeholder). Para poner tus fotos reales:
1. Copia tus fotos a la carpeta `public/examples/` (créala si no existe).
2. En cada ejemplo agrega `image: '/examples/tu-foto.jpg'`.

Esto se muestra como una sección plegable arriba del catálogo, así el cliente ve tus trabajos anteriores sin que tengas que mandárselos por chat.

## Personalizar el logo de la marca

```
src/data/branding.ts
```

Pon la ruta a tu archivo de logo (después de copiarlo a `public/branding/`) en `LOGO_IMAGE`. Si lo dejas vacío, se muestra la letra "E" como respaldo.

## Personalizar las instrucciones y el video tutorial

```
src/data/howto.ts
```

Ahí están tus 6 pasos reales de cómo aplicar la etiqueta, editables. Si quieres mostrar tu video de TikTok directo en la página, copia el archivo a `public/videos/` y pon la ruta en `TUTORIAL_VIDEO`.

## Personalizar las preguntas frecuentes

```
src/data/faq.ts
```

Ahí puedes editar cada pregunta y respuesta (precio, tiempo de entrega, ubicación, materiales, etc.). Se muestra como un acordeón desplegable justo arriba del catálogo — mientras más completo lo tengas, menos preguntas repetidas te van a llegar por WhatsApp antes de que alguien haga su pedido.

## Personalizar el catálogo y los precios de paquete

Todo vive en un solo archivo:

```
src/data/catalog.ts
```

Ahí puedes:
- Agregar/quitar diseños disponibles (el arreglo `characters`) — ya no tienen precio individual, porque **todo se cobra por paquete**.
- Cambiar el precio del paquete base (`BASE_PACKAGE_PRICE`) y del paquete adicional (`EXTRA_PACKAGE_PRICE`).
- Cambiar cuántas etiquetas trae cada paquete (`PACKAGE_SIZE`, hoy 85).
- Cambiar el tamaño real mostrado (`REAL_SIZE_LABEL`, hoy "3 x 2 cm").

Recuerda: **solo se vende por paquete completo**, no hay precio por etiqueta suelta — así está configurado a propósito.

## Sobre la seguridad del panel

La contraseña del panel (`VITE_PANEL_PASSWORD`) es una protección simple, pensada solo para que un extraño no entre por accidente — **no es seguridad real**, porque vive en el código del navegador. Si más adelante quieres que el panel esté realmente protegido (por ejemplo, si vas a compartir el link ampliamente), la mejora natural es agregar **Supabase Auth** (login con correo y contraseña) y cambiar las políticas de la tabla `orders` a `to authenticated` en vez de `to anon`. Puedo ayudarte a armar eso cuando lo necesites.
# Elinos-app
