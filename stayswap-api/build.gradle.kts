dependencies {
    implementation(project(":stayswap-domain"))
    implementation(project(":stayswap-common"))

    // web
    implementation("org.springframework.boot:spring-boot-starter-web")

    // thymeleaf
    implementation("nz.net.ultraq.thymeleaf:thymeleaf-layout-dialect")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")

    // validation
    implementation("org.springframework.boot:spring-boot-starter-validation")
    
    // OAuth2 Resource Server
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    
    // firebase
    implementation("com.google.firebase:firebase-admin:9.4.3")

    // feign
    implementation("org.springframework.cloud:spring-cloud-starter-openfeign:4.2.1")

    // xml 관련
    implementation("javax.xml.bind:jaxb-api:2.3.1")

    // kafka
    implementation("org.springframework.cloud:spring-cloud-stream")
    implementation("org.springframework.cloud:spring-cloud-stream-binder-kafka")
    implementation("org.springframework.kafka:spring-kafka")

    // websocket
    implementation ("org.springframework.boot:spring-boot-starter-websocket")

}

// ✅ bootJar 활성화
tasks.bootJar {
    enabled = true
}