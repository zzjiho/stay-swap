dependencies {
    implementation(project(":stayswap-common"))

    // kafka
    implementation("org.springframework.cloud:spring-cloud-stream")
    implementation("org.springframework.cloud:spring-cloud-stream-binder-kafka")
    implementation("org.springframework.kafka:spring-kafka")

    // mongodb
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")

    // mysql
    runtimeOnly("com.mysql:mysql-connector-j")

    // todo: web 설정

}

// ✅ bootJar 활성화
tasks.bootJar {
    enabled = true
}