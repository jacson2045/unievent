# syntax=docker/dockerfile:1
# Imagen multi-etapa: compila con Maven dentro de Docker (no requiere JDK en la máquina)
# y ejecuta con un JRE liviano como usuario sin privilegios.

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
# La caché de ~/.m2 acelera las reconstrucciones (BuildKit).
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -DskipTests package \
    && cp target/*-SNAPSHOT.jar /app.jar

FROM eclipse-temurin:21-jre
# curl se usa en el HEALTHCHECK de docker-compose.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 1001 spring
WORKDIR /app
COPY --from=build /app.jar app.jar
USER spring
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
