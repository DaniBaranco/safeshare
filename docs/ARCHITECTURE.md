# Arquitectura de SafeShare

Este documento describe cómo está organizado el código y qué reglas seguir
para que la app siga siendo fácil de mantener a medida que crece. Es el
complemento técnico del `README.md`, que explica el *qué* y el *por qué* del
producto.

## Principios

1. **Sin paso de build.** HTML + CSS + módulos ES nativos. Cualquier navegador
   moderno los carga directamente y GitHub Pages los sirve tal cual. La
   estructura de carpetas es, por tanto, la propia arquitectura.
2. **Capas con dependencia en un solo sentido.** `core` no conoce nada;
   `services` conoce APIs del navegador; `ui` conoce el DOM; `features`
   orquesta todo lo anterior; `app.js` solo compone.
3. **El estado de la página vive en el DOM y en la URL.** El modo de la app
   (`create` / `open`) se deriva del fragmento `#d=` y se publica en
   `body[data-mode]`. El CSS decide qué se ve; el JS no oculta bloques uno a
   uno.
4. **Los tokens de diseño son la única fuente de verdad visual.** Ningún
   componente declara colores, tamaños ni duraciones en crudo.

## Capas del JavaScript

```
js/
├── app.js               Punto de entrada. Compone, no decide.
├── config.js            Valores de producto (reglas de PIN, textos, tiempos).
├── core/                Lógica pura. Sin DOM, sin window, testeable en Node.
│   ├── crypto.js        PBKDF2 + AES-256-GCM. Define el formato del payload.
│   ├── detector.js      Reglas declarativas de avisos sobre datos críticos.
│   └── link.js          Codec del fragmento "#d=<payload>".
├── services/            Adaptadores a APIs del navegador.
│   ├── clipboard.js     Copiar con fallback.
│   ├── share.js         WhatsApp deep link + Web Share API.
│   └── pwa.js           Prompt de instalación + registro del SW.
├── ui/                  Piezas de interfaz reutilizables y sin negocio.
│   ├── dom.js           qs/on/show/hide/setBusy/setFieldError/icon.
│   ├── toast.js         Feedback no bloqueante (sustituye a alert()).
│   ├── reveal.js        Aparición al hacer scroll (IntersectionObserver).
│   ├── header.js        Sombra de la cabecera al hacer scroll.
│   ├── theme.js         Selector de tema de color (popover + localStorage).
│   └── mode.js          Router de modo create/open sobre body[data-mode].
└── features/            Un fichero por caso de uso. Orquestan core+services+ui.
    ├── create.js        Proteger un dato → enlace → compartir.
    └── open.js          Abrir enlace → PIN → mostrar/copiar.
```

### Reglas de dependencia

| Capa       | Puede importar de              | Nunca importa de       |
|------------|--------------------------------|------------------------|
| `core`     | nada (solo APIs estándar)      | `ui`, `services`, DOM  |
| `services` | `config`                       | `ui`, `features`       |
| `ui`       | `core` (solo lectura), `dom`   | `features`, `services` |
| `features` | todo lo anterior               | otras `features`       |
| `app.js`   | todo                           | —                      |

Si una feature necesita hablar con otra, lo hace a través de la URL o de
`ui/mode.js`, nunca importándola directamente.

### Dónde va cada cosa

- **Un nuevo tipo de aviso** en el detector: añade una entrada a `RULES` en
  `core/detector.js` y un test en `tests/detector.test.mjs`.
- **Cambiar los parámetros de cifrado**: rompe los enlaces existentes. Hay
  que introducir un prefijo de versión en el payload y mantener el descifrado
  de la versión anterior. Ese cambio vive en `core/crypto.js` y `core/link.js`.
- **Un nuevo canal de compartición** (Telegram, correo...): una función más
  en `services/share.js` y un botón en `features/create.js`.
- **Una nueva pantalla** (p. ej. "acerca de"): sección en `index.html` con
  `data-only="<modo>"`, un nuevo valor en `MODES` si hace falta y, si tiene
  lógica, un fichero en `features/`.
- **Textos de UI generados por JS**: en la propia feature. Si el volumen
  crece, extraer a `js/i18n/es.js` con un `t(key)` mínimo.
- **Un nuevo tema de color**: añade un bloque `html[data-theme="<id>"]` en
  `tokens.css` que redefina la escala de acento (`--o-*`) y el tinte
  `--color-on-brand-chip`, y una entrada en `THEMES` de `js/ui/theme.js`. No
  hace falta tocar ningún componente: todos los tokens semánticos derivan de
  esa escala. Calibra la paleta para mantener contraste AA (texto de acento
  sobre fondo claro con el paso 70; texto oscuro sobre el acento con el 100).

## Capas del CSS

```
css/
├── tokens.css       Design tokens: escalas de color, tipografía, espaciado,
│                    radios, sombras, movimiento. Única fuente de verdad.
├── fonts.css        @font-face de Inter (400 / 500 / 700).
├── base.css         Reset, tipografía base, iconos, utilidades, modo y reveal.
├── layout.css       Contenedor, cabecera, secciones, grids, hero, pie.
└── components.css   Botones, etiquetas, tarjetas, formularios, alertas,
                     chat de ejemplo, FAQ, toast.
```

Convenciones:

- **BEM ligero**: `.bloque`, `.bloque__elemento`, `.bloque--variante`.
  Estados con `.is-*` o atributos ARIA (`[aria-busy="true"]`,
  `[aria-invalid="true"]`).
- **Escalas crudas vs. semánticas.** Las variables `--o-50`, `--n-20`... son
  la paleta. Los componentes solo usan las semánticas
  (`--color-accent`, `--color-border`...). Así un cambio de tema es un cambio
  en un solo bloque de `tokens.css`.
- **Responsive por tokens.** Los tamaños tipográficos y de sección se ajustan
  en móvil redefiniendo tokens dentro de un `@media`, no componente a
  componente.
- **Iconos**: sprite SVG inline en `index.html` con símbolos `#i-<nombre>`
  (trazos estilo Lucide). Para añadir uno, añade el `<symbol>` y úsalo con
  `<svg class="icon"><use href="#i-nombre"/></svg>`. En JS, `icon('nombre')`.

## Sistema visual (referencia Cabify)

Lenguaje aplicado: tema claro sobre blanco hueso, un color de marca (naranja
claro) con escala de 11 pasos y neutros cálidos, bloques con radios grandes
(32 / 64 px) sobre fondos tintados, botones planos de 56 px con radio 8 px que
solo cambian de color en hover, sombras muy suaves, y transiciones de 0,25 a
0,75 s con `cubic-bezier(0.22, 1, 0.36, 1)`. El copy es corto, en imperativo
y orientado a beneficio ("Comparte lo confidencial. Sin dejar rastro.").

Regla de contraste: el acento es claro, así que `--color-accent` se usa solo
en rellenos y lleva texto oscuro (`--color-text-on-brand`). Para texto e
iconos de acento sobre fondo claro existe `--color-accent-text`, un naranja
más profundo que cumple AA. Nunca uses `--color-accent` como color de texto.

## Tests

Los módulos de `core/` se prueban en Node con el runner nativo:

```bash
npm test          # o: node --test tests/
```

Node 20 o superior incluye `crypto.subtle`, `btoa`/`atob` y `TextEncoder`,
así que el motor de cifrado se prueba tal cual, sin mocks ni bundler.

## Service worker

`sw.js` precachea el *app shell* listado en `APP_SHELL`. **Cada vez que se
añade, renombra o elimina un fichero estático hay que actualizar esa lista y
subir `VERSION`**, o los usuarios con la app instalada seguirán viendo la
versión anterior.
