dependencies {
    implementation(project(":stayswap-domain"))
    implementation(project(":stayswap-consumer"))
    implementation(project(":stayswap-common"))

    // spring batch
    implementation("org.springframework.boot:spring-boot-starter-batch")
    
    // web (테스트용)
    implementation("org.springframework.boot:spring-boot-starter-web")

    // kafka
    implementation("org.springframework.kafka:spring-kafka")

    // mongodb
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
}

// ✅ bootJar 활성화
tasks.bootJar {
    enabled = true
}