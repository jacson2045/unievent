# Repositorio y estándares

- **Repositorio:** <https://github.com/jacson2045/unievent>
- **Documentación:** este sitio, generado con MkDocs Material desde la carpeta `docs/`.

## Organización

| Carpeta | Contenido |
|---|---|
| `src/` | Frontend React (TypeScript) |
| `services/` | Un proyecto Maven por microservicio, cada uno con su `Dockerfile` |
| `infra/` | Config Server y su `config-repo/`, Prometheus, Grafana (paneles versionados) |
| `tests/e2e/` | Pruebas integrales contra el sistema real |
| `docker/` | Imagen del frontend (nginx) |
| `docs/` | Documentación MkDocs |

## Estándares

| Aspecto | Práctica |
|---|---|
| Ramas | `main` estable; trabajo en ramas `feature/<tema>` (por ejemplo `feature/kafka-notificaciones`) |
| Commits | Prefijos convencionales: `feat:`, `fix:`, `test:`, `docs:`, `chore:`; un commit por paso funcional con descripción de qué y por qué |
| Secretos | Nunca en el repositorio: `.env` está en `.gitignore`; `.env.example` documenta las variables |
| Base de datos | Cambios de esquema solo mediante migraciones Flyway versionadas (`V1__…`, `V2__…`) |
| Configuración | Centralizada en `config-repo/` por servicio y ambiente |
| Calidad | Pruebas unitarias en los servicios (`./mvnw test`) y pruebas integrales (`pnpm test:e2e`) |
| Reproducibilidad | `docker compose up -d --build` desde una copia limpia, verificado (ver [Pruebas](pruebas.md)) |
| Lenguaje | Código y documentación en español, coherente con el dominio |

## Topics sugeridos en GitHub

`microservices` · `spring-boot` · `spring-cloud` · `eureka` · `api-gateway` · `kafka` ·
`docker-compose` · `jwt` · `react` · `prometheus` · `grafana` · `zipkin` · `mercadopago` ·
`upeu` · `aplicaciones-distribuidas`

## Publicar esta documentación

```bash
pip install mkdocs-material
mkdocs serve          # vista local en http://127.0.0.1:8000
mkdocs gh-deploy      # publica en GitHub Pages (rama gh-pages)
```
