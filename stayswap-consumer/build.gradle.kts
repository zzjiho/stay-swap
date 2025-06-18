dependencies {
    implementation(project(":stayswap-domain"))
    implementation(project(":stayswap-common"))
    implementation(project(":stayswap-api"))
    implementation(project(":stayswap-producer"))

    // mongodb
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")

    // kafka
    implementation("org.springframework.cloud:spring-cloud-stream")
    implementation("org.springframework.cloud:spring-cloud-stream-binder-kafka")
    implementation("org.springframework.kafka:spring-kafka")

    // firebase
    implementation("com.google.firebase:firebase-admin:9.4.3")

    // web
    implementation("org.springframework.boot:spring-boot-starter-web")

    // querydsl
    implementation("com.querydsl:querydsl-jpa:5.0.0:jakarta")
    annotationProcessor("com.querydsl:querydsl-apt:5.0.0:jakarta")
    annotationProcessor("jakarta.annotation:jakarta.annotation-api")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")

    // test
    testImplementation("org.springframework.boot:spring-boot-starter-test")

    // h2
    testRuntimeOnly("com.h2database:h2")

    // TestChannelBinder
    testImplementation("org.springframework.cloud:spring-cloud-stream-test-binder")
    testImplementation("org.awaitility:awaitility")



}

// ✅ bootJar 활성화
tasks.bootJar {
    enabled = true
}