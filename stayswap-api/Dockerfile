FROM gradle:8.5-jdk21 AS build
WORKDIR /home/gradle/src
COPY . .

# 의존성 모듈들 먼저 빌드
RUN gradle :stayswap-common:build :stayswap-domain:build :stayswap-api:build --no-daemon -x test
# 빌드 결과 확인
RUN ls -la /home/gradle/src/stayswap-api/build/libs/

# Runtime Stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# 실행 가능한 JAR 파일만 복사
COPY --from=build /home/gradle/src/stayswap-api/build/libs/stayswap-api-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENV TZ=Asia/Seoul
ENV SPRING_PROFILES_ACTIVE=prd
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
