dependencies {
    implementation(project(":stayswap-common"))

    // redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // mongoDB
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
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

// ✅ bootJar는 비활성화 (라이브러리 모듈이므로)
tasks.bootJar {
    enabled = false
}

tasks.jar {
    enabled = true
    archiveClassifier.set("")
}