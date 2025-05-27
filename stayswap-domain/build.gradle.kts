dependencies {
    implementation(project(":stayswap-common"))

    // test containers    implementation("org.testcontainers:testcontainers:1.20.1")

    // redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // mongoDB
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
}