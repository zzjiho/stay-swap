dependencies {
    implementation(project(":stayswap-common"))
    implementation(project(":stayswap-producer"))

    // mysql
    runtimeOnly("com.mysql:mysql-connector-j")
    
    // redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // mongodb
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")

    
    
    // firebase
    implementation("com.google.firebase:firebase-admin:9.4.3")

    // querydsl
    implementation("com.querydsl:querydsl-jpa:5.0.0:jakarta")
    annotationProcessor("com.querydsl:querydsl-apt:5.0.0:jakarta")
    annotationProcessor("jakarta.annotation:jakarta.annotation-api")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")

    // testContainers
    implementation("org.testcontainers:testcontainers:1.20.1")

    // test
    testImplementation("org.springframework.boot:spring-boot-starter-test")

    // h2
    testRuntimeOnly("com.h2database:h2")



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
