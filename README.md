# RonHack SEO

Una extensión de Chrome moderna para análisis SEO completo, inspirada en SEO One Click pero con funcionalidades mejoradas y desarrollada con tecnologías modernas.

## 🚀 Características

- **Análisis de Velocidad Local**: Usa `window.performance.timing` para analizar tiempos de carga (DNS, TCP, Request, Response, DOM, etc.)
- **Densidad de Palabras**: Analiza y muestra las palabras más frecuentes en el contenido de la página
- **Social Preview**: Visualiza cómo se verá tu página cuando se comparta en Facebook/X usando meta tags Open Graph
- **Chequeo de Enlaces Rotos**: Verifica automáticamente todos los enlaces de la página y detecta los que están rotos

## 🛠️ Tecnologías

- **Vue 3** - Framework frontend moderno
- **Vite** - Build tool ultra rápido
- **@crxjs/vite-plugin** - Plugin para desarrollar extensiones con HMR (Hot Module Replacement)
- **Chrome Extensions Manifest V3** - API moderna de extensiones

## 📦 Instalación

1. Clona o descarga este repositorio
2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Compila la extensión para producción:
```bash
npm run build
```

## 🔧 Desarrollo

El proyecto usa `@crxjs/vite-plugin` que permite desarrollo con Hot Module Replacement. Los cambios en el código se reflejan automáticamente en la extensión sin necesidad de recargarla manualmente.

### Estructura del Proyecto

```
ronhackseo/
├── manifest.config.js    # Configuración del manifest de la extensión
├── vite.config.js        # Configuración de Vite con crxjs
├── src/
│   ├── App.vue          # Componente principal
│   ├── main.js          # Punto de entrada
│   ├── content.js       # Content script (se ejecuta en las páginas web)
│   └── components/
│       ├── PerformanceMetrics.vue  # Análisis de velocidad
│       ├── WordDensity.vue         # Densidad de palabras
│       ├── SocialPreview.vue       # Vista previa social
│       └── LinkChecker.vue         # Verificación de enlaces
```

## 📱 Cargar la Extensión en Chrome

1. Compila el proyecto: `npm run build`
2. Abre Chrome y ve a `chrome://extensions/`
3. Habilita el "Modo de desarrollador" (Developer mode)
4. Haz clic en "Cargar extensión sin empaquetar" (Load unpacked)
5. Selecciona la carpeta `dist` generada por el build

## 🎯 Uso

1. Navega a cualquier página web
2. Haz clic en el ícono de la extensión
3. Haz clic en "Analizar Página"
4. Explora todas las métricas SEO disponibles:
   - Información básica (URL, título, meta description)
   - Análisis de velocidad de carga
   - Densidad de palabras clave
   - Vista previa social (Facebook/X)
   - Estado de los enlaces

## 🎨 Características de la UI

- Diseño moderno y limpio
- Colores y gradientes atractivos
- Animaciones suaves
- Responsive y fácil de usar
- Feedback visual claro para cada métrica

## 📝 Notas

- El análisis de velocidad requiere que la página haya cargado completamente
- El chequeo de enlaces puede tardar un poco dependiendo de la cantidad de enlaces
- Los enlaces externos pueden mostrar limitaciones debido a políticas CORS
- La extensión funciona mejor en páginas web normales (no en páginas especiales de Chrome como `chrome://`)

## 🔄 Próximas Mejoras

- Exportar reportes en PDF/CSV
- Comparación de métricas entre páginas
- Análisis de imágenes (alt text, optimización)
- Verificación de schema.org/JSON-LD
- Análisis de accesibilidad básico

---

Desarrollado con ❤️ usando Vue 3 y crxjs
