plugins {
	java
	id("org.springframework.boot") version "3.4.4"
	id("io.spring.dependency-management") version "1.1.7"
}

java {
	toolchain {
		languageVersion.set(JavaLanguageVersion.of(21))
	}
}

extra["springCloudVersion"] = "2023.0.2"

allprojects {
	group = "com.stayswap"
	version = "0.0.1-SNAPSHOT"

	repositories {
		mavenCentral()
	}
}

subprojects {
	apply {
		plugin("java")
		plugin("java-library")
		plugin("org.springframework.boot")
		plugin("io.spring.dependency-management")
	}

	java {
		toolchain {
			languageVersion.set(JavaLanguageVersion.of(21))
		}
	}

	dependencies {
		// jpa
		implementation("org.springframework.boot:spring-boot-starter-data-jpa")

		// web
		implementation("org.springframework.boot:spring-boot-starter-web")

		// thymeleaf
		implementation("nz.net.ultraq.thymeleaf:thymeleaf-layout-dialect")
		implementation("org.springframework.boot:spring-boot-starter-thymeleaf")

		// validation
		implementation("org.springframework.boot:spring-boot-starter-validation")

		// spring-doc
		implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")
		implementation("commons-codec:commons-codec:1.15")

		testImplementation("org.junit.jupiter:junit-jupiter:5.8.1")

		// lombok
		compileOnly("org.projectlombok:lombok")
		annotationProcessor("org.projectlombok:lombok")

		// mysql
		runtimeOnly("com.mysql:mysql-connector-j")

		// JWT
		implementation("io.jsonwebtoken:jjwt:0.12.3")

		// xml문서와 java객체 간 매핑 자동화
		implementation("javax.xml.bind:jaxb-api:2.3.1")

		// aws S3
		implementation("com.amazonaws:aws-java-sdk-s3:1.12.619")

		// test
		testImplementation("org.springframework.boot:spring-boot-starter-test")
		testRuntimeOnly("org.junit.platform:junit-platform-launcher")

		// === Querydsl 추가 ===
		implementation("com.querydsl:querydsl-jpa:5.0.0:jakarta")
		annotationProcessor("com.querydsl:querydsl-apt:5.0.0:jakarta")
		annotationProcessor("jakarta.annotation:jakarta.annotation-api")
		annotationProcessor("jakarta.persistence:jakarta.persistence-api")
		// === QueryDsl 끝 ===

		// feign
		implementation("org.springframework.cloud:spring-cloud-starter-openfeign:4.2.1")

		// firebase admin
		implementation("com.google.firebase:firebase-admin:9.4.3")

		// rabbitMQ
		implementation("org.springframework.boot:spring-boot-starter-amqp")
	}

	dependencyManagement {
		imports {
			mavenBom("org.springframework.cloud:spring-cloud-dependencies:${property("springCloudVersion")}")
		}
	}

	tasks.test {
		useJUnitPlatform()
	}

	// 테스트 코드를 제외한 빌드 수행
	tasks.withType<Test> {
		enabled = false
	}

	tasks.withType<JavaCompile> {
		options.compilerArgs.add("-parameters")
	}
}

dependencies {
	// 루트 프로젝트에서 필요한 의존성이 있다면 여기에 추가
}