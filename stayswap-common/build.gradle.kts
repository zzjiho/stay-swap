dependencies {
    // redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    
    // web
    implementation("org.springframework.boot:spring-boot-starter-web")

    // mongodb
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")

    // feign
    implementation("org.springframework.cloud:spring-cloud-starter-openfeign:4.2.1")

}

// ✅ bootJar 비활성화
tasks.bootJar {
    enabled = false
}

tasks.jar {
    enabled = true
    archiveClassifier.set("")
}