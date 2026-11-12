-- Idempotencia del consumidor Kafka: cada evento de negocio (event_id) se aplica una sola vez.
CREATE TABLE IF NOT EXISTS eventos_procesados (
    event_id VARCHAR(64) NOT NULL,
    tipo VARCHAR(40) NOT NULL,
    procesado_en TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id)
);
