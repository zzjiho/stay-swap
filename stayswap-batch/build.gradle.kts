dependencies {
    implementation(project(":stayswap-domain"))
    
    // spring batch
    implementation("org.springframework.boot:spring-boot-starter-batch")
}

// ✅ bootJar 활성화
tasks.bootJar {
    enabled = true
}