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
    
    // JWT
    implementation("io.jsonwebtoken:jjwt:0.12.3")
    
    // firebase
    implementation("com.google.firebase:firebase-admin:9.4.3")

    // xml 관련
    implementation("javax.xml.bind:jaxb-api:2.3.1")
}

// ✅ bootJar 활성화
tasks.bootJar {
    enabled = true
}