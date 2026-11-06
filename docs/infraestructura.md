# Infraestructura

UniEvent Pay utiliza Docker para ejecutar los componentes de infraestructura necesarios para el funcionamiento del sistema.

## Contenedores principales

| Componente | Puerto | Función |
|---|---:|---|
| Apache Kafka | 9092 | Mensajería entre servicios |
| Kafka UI | 8085 | Administración visual de Kafka |
| Prometheus | 9090 | Recolección de métricas |
| Grafana | 3000 | Visualización de métricas |

## Bases de datos PostgreSQL

Cada servicio dispone de su propia base de datos de desarrollo.

| Base de datos | Puerto local |
|---|---:|
| Event | 15434 |
| Auth | 15435 |
| Enrollment | 15436 |
| Notification | 15437 |

## Contenedores Docker

La infraestructura se define en `infra/docker-compose.yml`.

Para consultar los contenedores activos:

`docker ps`

Para visualizar los servicios definidos en Docker Compose:

`docker compose -f infra/docker-compose.yml config --services`
