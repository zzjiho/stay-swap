FROM gradle:8.5-jdk21 AS build
WORKDIR /home/gradle/src
COPY . .

RUN gradle :stayswap-common:build :stayswap-domain:build :stayswap-producer:build --no-daemon -x test
RUN ls -la /home/gradle/src/stayswap-producer/build/libs/

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /home/gradle/src/stayswap-producer/build/libs/stayswap-producer-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8084
ENV TZ=Asia/Seoul
ENV SPRING_PROFILES_ACTIVE=prd
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
