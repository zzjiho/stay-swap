dependencies {
    implementation(project(":stayswap-common"))

    // mysql
    runtimeOnly("com.mysql:mysql-connector-j")
    
    // redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // mongodb
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")

    // kafka
    implementation("org.springframework.cloud:spring-cloud-stream")
    implementation("org.springframework.cloud:spring-cloud-stream-binder-kafka")
    implementation("org.springframework.kafka:spring-kafka")
    
    // jwt
    implementation("io.jsonwebtoken:jjwt:0.12.3")
    
    // firebase
    implementation("com.google.firebase:firebase-admin:9.4.3")

    // querydsl
    implementation("com.querydsl:querydsl-jpa:5.0.0:jakarta")
    annotationProcessor("com.querydsl:querydsl-apt:5.0.0:jakarta")
    annotationProcessor("jakarta.annotation:jakarta.annotation-api")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")
}

// ✅ QueryDsl Q클래스 생성 설정
val querydslDir = file("src/main/generated")

sourceSets {
    main {
        java {
            srcDir(querydslDir)
        }
    }
}

tasks.withType<JavaCompile> {
    options.generatedSourceOutputDirectory.set(querydslDir)
}

tasks.named("clean") {
    doLast {
        querydslDir.deleteRecursively()
    }
}

// ✅ bootJar 비활성화
tasks.bootJar {
    enabled = false
}

tasks.jar {
    enabled = true
    archiveClassifier.set("")
}