dependencies {
    // redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    
    // web
    implementation("org.springframework.boot:spring-boot-starter-web")

}

// ✅ bootJar 비활성화
tasks.bootJar {
    enabled = false
}

tasks.jar {
    enabled = true
    archiveClassifier.set("")
}