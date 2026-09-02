# SafeShare

Comparte datos confidenciales (teléfono, número de cuenta, DNI, códigos...)
por WhatsApp de forma protegida, sin registrarte y sin depender de ningún
servidor.

> Proyecto personal / educativo. No sustituye a los canales oficiales de tu
> banco para operaciones sensibles (p. ej. nunca compartas el número completo
> de una tarjeta junto con su CVV, ni siquiera cifrado).

## ¿Qué problema resuelve?

Es habitual tener que pasar por WhatsApp un dato sensible (un IBAN, un
teléfono, un código de acceso) en texto plano, visible para siempre en la
conversación y en cualquier backup. SafeShare cifra ese dato en tu propio
dispositivo antes de generar el enlace que compartes, de modo que solo quien
tenga el **PIN** (que le das por otro canal: llamada, en persona...) puede
leerlo.

## Arquitectura

Aplicación web **100% estática**: HTML + CSS + JavaScript *vanilla*, sin
frameworks ni paso de *build*, desplegada en GitHub Pages. No existe backend
propio ni base de datos: **el enlace generado ES el contenedor cifrado**.

Decisiones de diseño:

- **Cifrado en el dispositivo, nunca en un servidor.** Se usa la Web Crypto
  API nativa del navegador (`SubtleCrypto`): PBKDF2 (SHA-256, 150.000
  iteraciones) deriva una clave AES-256 a partir del PIN, y AES-256-GCM cifra
  el texto. Todo ocurre en tu móvil/PC; SafeShare no ve ni transmite el dato
  en claro en ningún momento.
- **Todo vive en el fragmento de la URL (`#...`).** El navegador nunca envía
  la parte de la URL tras `#` a ningún servidor al cargar la página — ni
  siquiera a GitHub Pages. Por eso la app puede ser 100% estática y aun así
  el contenido cifrado "viaja" dentro del propio enlace.
- **Sin backend, sin registro, sin cuentas.** No hay usuarios, no hay base de
  datos, no hay analítica de contenido.
- **Local-first.** Funciona sin conexión una vez cargada (Service Worker con
  precache del *app shell*), como el resto de proyectos de este mismo estilo
  (véase PhishGuard).
- **Detector de datos extremadamente sensibles.** Un aviso local (sin enviar
  nada a ningún sitio) detecta patrones como "número largo + CVV" y recomienda
  no compartir ese tipo de combinación ni cifrada, remitiendo a los canales
  oficiales del banco.

### Limitación importante (léela antes de usarlo)

El enlace generado **no caduca ni se autodestruye solo**: mientras alguien
conserve el enlace *y* el PIN, podrá abrirlo y leer el contenido en cualquier
momento. Esto es una consecuencia directa de no tener servidor (no hay dónde
"borrar" nada del lado remoto). SafeShare sí garantiza la **confidencialidad**
del contenido en tránsito (WhatsApp/Meta o cualquier intermediario solo ven
texto cifrado), pero no un borrado remoto del enlace. Recomendaciones que la
propia app repite en la interfaz:

- Comparte el PIN por un canal **distinto** al del enlace (llamada, en
  persona), nunca en el mismo chat.
- Borra el mensaje del chat en cuanto la otra persona lo haya leído.
- Para datos extremadamente críticos (tarjeta completa + CVV), usa siempre
  los canales oficiales de tu banco.

## Alcance v1

Solo **texto**: números de cuenta, teléfonos, DNI/NIE, contraseñas puntuales,
o cualquier texto copiado de un documento. Imágenes, capturas de pantalla o
archivos adjuntos quedan fuera de esta versión: no encajan bien en un diseño
sin backend por el límite de longitud de las URLs (WhatsApp trunca enlaces
muy largos).

## Estructura del proyecto

```
safeshare/
├── index.html            Vista única (crear enlace / abrir enlace recibido)
├── manifest.webmanifest   Metadatos de instalación PWA
├── sw.js                  Service Worker (precache del app shell)
├── css/
│   ├── styles.css         Estilos propios (paleta azul, estética Spotify)
│   ├── fonts.css          Inter autoalojada (subset latin)
│   └── icons.css          Flaticon Uicons autoalojada (subset)
├── js/
│   ├── crypto.js           PBKDF2 + AES-256-GCM vía Web Crypto API
│   ├── detector.js         Avisos locales de datos extremadamente sensibles
│   └── app.js               Orquestación de la interfaz
├── fonts/                 Tipografía e iconos autoalojados (.woff2)
├── icons/                 Iconos de la app / PWA
└── make_icons.py           Script que genera el set de iconos (candado azul)
```

## Cómo probarlo en local

No requiere instalación de dependencias: basta con servir la carpeta como
estático, por ejemplo:

```bash
cd safeshare
python -m http.server 8090
```

Y abrir `http://localhost:8090` en el navegador.

## Estilo visual

Inspirado en la estética de las páginas de producto de Spotify Premium:
tipografía bold, tarjetas oscuras, azules vibrantes (`#2563eb` → `#0ea5e9`) y
transiciones suaves — manteniendo la funcionalidad deliberadamente simple.

## Privacidad

- SafeShare no envía tu contenido a ningún servidor propio ni de terceros.
- No hay analítica, cookies de seguimiento ni cuentas de usuario.
- El único lugar donde "existe" el dato cifrado es en el enlace que tú mismo
  compartes.
