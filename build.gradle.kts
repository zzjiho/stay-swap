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

extra["springCloudVersion"] = "2024.0.0"

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
		// lombok
		compileOnly("org.projectlombok:lombok")
		annotationProcessor("org.projectlombok:lombok")
		
		// validation
		implementation("org.springframework.boot:spring-boot-starter-validation")
		
		// test
		testImplementation("org.springframework.boot:spring-boot-starter-test")
		testRuntimeOnly("org.junit.platform:junit-platform-launcher")
		testImplementation("org.junit.jupiter:junit-jupiter:5.8.1")

		// feign
		implementation("org.springframework.cloud:spring-cloud-starter-openfeign:4.2.1")

		// springdoc
		implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")
		implementation("commons-codec:commons-codec:1.15")

		// aws S3
		implementation("com.amazonaws:aws-java-sdk-s3:1.12.619")

		// jpa
		implementation("org.springframework.boot:spring-boot-starter-data-jpa")
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

// 루트 프로젝트에서 bootJar 비활성화
tasks.bootJar {
	enabled = false
}

tasks.jar {
	enabled = true
}