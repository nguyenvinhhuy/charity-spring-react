# ── Build stage ──────────────────────────────────────────
FROM eclipse-temurin:26-jdk AS build
RUN apt-get update \
    && apt-get install -y --no-install-recommends maven \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
# Cache dependencies first
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Build the application
COPY src ./src
RUN mvn -B clean package -DskipTests

# ── Runtime stage ────────────────────────────────────────
FROM eclipse-temurin:26-jre
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
