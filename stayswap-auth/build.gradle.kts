dependencies {
    implementation(project(":stayswap-common"))
    implementation(project(":stayswap-domain"))
    
    // Spring Authorization Server
    implementation("org.springframework.security:spring-security-oauth2-authorization-server:1.4.0")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    
    // JWT
    implementation("org.springframework.security:spring-security-oauth2-jose")
    
    // Thymeleaf for login page
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    
    // Redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    
    // Database 
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("com.mysql:mysql-connector-j")

}