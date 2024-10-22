# Stage 1: Build Angular frontend
FROM node:16.4.0 AS frontend-build
WORKDIR /app
# Copy Angular project files
COPY angular/ /app/
# Install dependencies and build the Angular app for production
RUN npm install
RUN npm run elephant

# Stage 2: Build Spring Boot backend with Gradle
FROM gradle:7.6-jdk11 AS backend-build
WORKDIR /app
# Copy Spring Boot project files
COPY . /app/
# Copy Angular dist files to Spring Boot static resources
COPY --from=frontend-build /app/dist/amradio /app/src/main/resources/static/
# Build the Spring Boot app using Gradle
RUN gradle build --prod

# Stage 3: Run the Spring Boot application
FROM openjdk:11-jre-slim
WORKDIR /app
# Copy the built Spring Boot JAR to the final image
COPY --from=backend-build /app/build/libs/*.jar app.jar
# Set the entrypoint to run the Spring Boot app
ENTRYPOINT ["java", "-jar", "app.jar"]
EXPOSE 8080
