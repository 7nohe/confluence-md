# Markdown to Confluence

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Confluence%20MD-blue?logo=github)](https://github.com/marketplace/actions/confluence-md)

Convierte Markdown (GFM) al formato de almacenamiento de Confluence Cloud y actualiza una página existente.

Disponible tanto como **GitHub Action** como herramienta de **CLI**.

## Características
- Conversión de GFM con tablas, tachado y respaldo de texto para listas de tareas
- Bloques de código Mermaid a macros de Mermaid de Confluence
- Carga de imágenes locales o URLs de imágenes externas
- Auto-creación de nuevas páginas con `space_key` (el ID de la página se escribe de vuelta en el frontmatter)
- Omite la actualización cuando el contenido no ha cambiado
- Modo de ejecución simulada (dry run) para inspeccionar el XML de almacenamiento generado
- Sincronización de directorios para múltiples archivos Markdown

## Requisitos
- Sitio de Confluence Cloud
- Token de API con permisos para actualizar la página de destino
- Macro de Mermaid habilitada en Confluence si utilizas bloques de Mermaid

## Uso

### CLI

Instala y ejecuta con npx:

```bash
# Establece el token de API como variable de entorno (requerido)
export CONFLUENCE_API_TOKEN="your-api-token"

# Uso básico
npx @7nohe/confluence-md docs/page.md \
  --url https://example.atlassian.net \
  --email you@example.com

# Con el ID de página especificado
npx @7nohe/confluence-md docs/page.md \
  --url https://example.atlassian.net \
  --email you@example.com \
  --page-id 123456

# Ejecución simulada (vista previa sin actualizar)
npx @7nohe/confluence-md docs/page.md --dry-run

# Salida JSON para scripting
npx @7nohe/confluence-md docs/page.md --json

# Sincronización de directorio (los IDs de página deben definirse en el frontmatter)
npx @7nohe/confluence-md docs/ \
  --url https://example.atlassian.net \
  --email you@example.com

# Alias corto
cfmd docs/page.md --dry-run
```

#### Opciones de la CLI

```
-u, --url <url>            URL base de Confluence (o variable CONFLUENCE_BASE_URL)
-e, --email <email>        Email de la cuenta de Confluence (o variable CONFLUENCE_EMAIL)
-p, --page-id <id>         ID de la página de Confluence (o usa el frontmatter)
-s, --space-key <key>      Clave del espacio de Confluence (crea una página nueva si no hay page_id)
--parent-page-id <id>      ID de la página padre para páginas nuevas
--no-write-page-id         Desactiva la escritura del ID de la página creada en el frontmatter
--title <title>            Anular el título de la página
--attachments-base <path>  Directorio base para resolver rutas de imágenes
--image-mode <mode>        Manejo de imágenes: upload o external (predeterminado: upload)
--download-remote-images   Descargar imágenes remotas como archivos adjuntos
--mermaid-macro <name>     Nombre de la macro para bloques de mermaid (debe coincidir con tu app de Confluence)
--exclude <patterns>       Patrones glob para excluir archivos (separados por comas)
--no-skip-unchanged        Actualizar incluso si el contenido no ha cambiado
--dry-run                  Vista previa sin actualizar Confluence
--json                     Salida de resultados en formato JSON
-v, --verbose              Habilitar salida detallada
-c, --config <path>        Ruta al archivo de configuración
```

#### Archivo de Configuración

Crea un archivo `.confluence.yml` en la raíz de tu proyecto:

```yaml
confluence_base_url: https://example.atlassian.net
email: you@example.com
frontmatter_page_id_key: confluence_page_id
image_mode: upload
skip_if_unchanged: true
```

Nota: Por seguridad, el token de API debe establecerse a través de la variable de entorno `CONFLUENCE_API_TOKEN`.

#### Sincronización de Directorios

Puedes pasar un directorio al parámetro `source` tanto en la CLI como en la GitHub Action. La herramienta escanea el directorio recursivamente y sincroniza cada archivo `*.md` en orden.

Cada archivo Markdown debe definir su propio ID de página en el frontmatter:

```markdown
---
confluence_page_id: 123456
---

# Título de la página
```

Cuando `source` es un directorio:

- `page_id` se ignora para evitar sobrescrituras accidentales
- Los archivos sin un ID de página en el frontmatter se omiten, a menos que se haya configurado `space_key` (en cuyo caso se crea una página nueva; ver más abajo)
- `attachments_base` toma por defecto el directorio de cada archivo si no se define explícitamente
- La opción `--json` de la CLI devuelve resultados agregados y detalles por archivo

#### Auto-creación de páginas

Si un archivo no tiene ID de página y se proporciona un `space_key`, se crea una página nueva en ese espacio (bajo el `parent_page_id` si está definido). Por defecto (`write_page_id: true`), el ID de la página creada se escribe de vuelta en el frontmatter del archivo para que las ejecuciones posteriores actualicen la misma página en lugar de crear duplicados. No se escribe nada en modo `dry-run`.

```bash
npx @7nohe/confluence-md docs/ \
  --url https://example.atlassian.net \
  --email you@example.com \
  --space-key DOCS
```

Nota para GitHub Actions: la escritura en el frontmatter modifica el archivo solo en el espacio de trabajo del runner. Debes hacer commit del cambio en tu repositorio (por ejemplo, con un paso de commit o usando `stefanzweifel/git-auto-commit-action`) para persistir los IDs de página.

### GitHub Action

```yaml
name: Publish docs
on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: 7nohe/confluence-md@v0.2.2
        with:
          confluence_base_url: https://example.atlassian.net
          email: you@example.com
          api_token: ${{ secrets.CONFLUENCE_API_TOKEN }}
          source: docs/
          # Opcional: crear páginas para archivos sin un page ID
          space_key: DOCS
```

### ID de página en Frontmatter

```markdown
---
confluence_page_id: 123456
title: Mi Página de Confluence
---

# Título de la página
```

También puedes pasar el `page_id` directamente como entrada para sincronizaciones de archivo único. Si el frontmatter incluye un `title`, se utilizará como el título de la página de Confluence. En modo de archivo único, `title_override` sigue teniendo prioridad.

## Entradas (Inputs) de GitHub Action

| Nombre | Requerido | Predeterminado | Descripción |
| --- | --- | --- | --- |
| confluence_base_url | sí | - | URL base de Confluence (ej. https://example.atlassian.net) |
| page_id | no | - | ID de la página de Confluence (respaldo si falta el frontmatter en modo archivo único) |
| space_key | no | - | Clave del espacio de Confluence (crea una página nueva si no se encuentra un ID de página) |
| parent_page_id | no | - | ID de la página padre para páginas recién creadas |
| write_page_id | no | true | Escribir el ID de la página creada de vuelta en el frontmatter del archivo |
| email | sí | - | Email de la cuenta de Confluence |
| api_token | sí | - | Token de API de Confluence |
| source | sí | - | Ruta al archivo Markdown o directorio |
| attachments_base | no | dir(source) | Directorio base para resolver rutas de imágenes relativas |
| title_override | no | - | Anular el título de la página |
| frontmatter_page_id_key | no | confluence_page_id | Clave del frontmatter utilizada para extraer el ID de la página |
| image_mode | no | upload | Modo de manejo de imágenes: upload o external |
| download_remote_images | no | false | Descargar imágenes remotas y subirlas como adjuntos |
| mermaid_macro | no | mermaid | Nombre de la macro emitida para bloques de código mermaid (debe coincidir con tu app de Confluence) |
| skip_if_unchanged | no | true | Omitir actualización cuando la salida de almacenamiento sea idéntica |
| exclude | no | - | Patrones glob para excluir archivos en modo directorio (separados por comas o saltos de línea) |
| dry_run | no | false | Construir la salida pero no actualizar Confluence |
| notify_watchers | no | false | Aceptado pero actualmente ignorado |
| user_agent | no | confluence-md | User agent HTTP |

## Salidas (Outputs) de GitHub Action

| Nombre | Descripción |
| --- | --- |
| page_url | URL de la página de Confluence actualizada |
| page_id | ID de la página de Confluence actualizada |
| version | Nuevo número de versión de la página |
| updated | Si la página fue realmente actualizada (true o false) |
| created | Si se creó una página nueva (true o false) |
| attachments_uploaded | Número de archivos adjuntos subidos |
| content_hash | Hash del contenido de almacenamiento generado |
| total_files | Número total de archivos Markdown procesados en modo directorio |
| succeeded_files | Número de archivos procesados exitosamente en modo directorio |
| failed_files | Número de archivos que fallaron en modo directorio |
| updated_files | Número de archivos actualizados en modo directorio |
| attachments_uploaded_total | Total de adjuntos subidos en modo directorio |
| results_json | Array JSON de resultados por archivo en modo directorio |
| failures_json | Array JSON de fallos por archivo en modo directorio |
| skipped_files | Número de archivos omitidos (sin ID de página) en modo directorio |
| skipped_json | Array JSON de entradas omitidas por archivo en modo directorio |

Las salidas de archivo único (`page_url`, `page_id`, `version`, `updated`, `created`, `attachments_uploaded`, `content_hash`) solo se completan en ejecuciones de archivo único. Las ejecuciones de directorio utilizan las salidas agregadas anteriores.

## Manejo de Imágenes
- Las imágenes locales se resuelven relativas a `attachments_base`.
- Las imágenes remotas utilizan `ri:url` cuando `image_mode=external`.
- Si `download_remote_images=true`, las imágenes remotas se descargan y se suben como adjuntos.
- En modo directorio sin `attachments_base`, las imágenes locales se resuelven relativas a cada archivo Markdown.

## Mermaid

Confluence Cloud no tiene una macro de Mermaid integrada, por lo que el renderizado depende de una aplicación de Mermaid instalada en tu sitio. Los bloques de código ` ```mermaid ` se convierten en `<ac:structured-macro ac:name="...">` con el código del diagrama como cuerpo de la macro.

Dado que cada aplicación de Mermaid utiliza un nombre de macro diferente, establece `mermaid_macro` para que coincida con la aplicación instalada en tu sitio (por ejemplo, `mermaid-cloud`). El valor predeterminado es `mermaid`. Si no hay ninguna aplicación de Mermaid instalada que coincida, el diagrama se renderizará como una macro desconocida; en ese caso, renderiza previamente el diagrama como una imagen y referénciala como una imagen normal de Markdown.

## Limitaciones
- Solo para Confluence Cloud (sin soporte para Server o Data Center).
- Cada archivo Markdown se mapea a una sola página de Confluence. El modo directorio sincroniza múltiples archivos secuencialmente.
- El HTML puro en Markdown se elimina por seguridad.
- Para saltos de línea dentro de las celdas de una tabla, usa `<br>` o `<br/>`. Los saltos de línea literales dentro de las celdas de tablas GFM no son compatibles y pueden interpretarse como filas separadas.

## Versionado
Este proyecto sigue el Versionado Semántico. Consulta `CHANGELOG.md` para ver las notas de lanzamiento.

## Licencia
MIT. Consulta `LICENSE`.
