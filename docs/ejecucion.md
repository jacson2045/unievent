# Ejecución del proyecto

## Requisitos previos

- Java JDK 21.
- Node.js y npm.
- Docker Desktop.
- Python 3.12.
- Git.

## Iniciar la infraestructura

Desde la raíz del proyecto:

`docker compose -f infra/docker-compose.yml up -d`

## Iniciar los microservicios

Los servicios backend se ejecutan individualmente desde sus respectivos directorios.

| Servicio | Puerto |
|---|---:|
| Auth Service | 8082 |
| Event Service | 8080 |
| Enrollment Service | 8083 |
| Notification Service | 8084 |
| API Gateway | 8000 |

## Iniciar el frontend

Desde la raíz del proyecto:

`npm.cmd run dev`

El frontend se encuentra disponible en:

`http://localhost:8443/`

## Herramientas de administración

- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Kafka UI: `http://localhost:8085`
