dependencies {
    implementation(project(":stayswap-domain"))
    implementation(project(":stayswap-common"))
    implementation(project(":stayswap-infra"))

    // web
    implementation("org.springframework.boot:spring-boot-starter-web")

    // thymeleaf
    implementation("nz.net.ultraq.thymeleaf:thymeleaf-layout-dialect")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")

    // spring-doc
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")
    implementation("commons-codec:commons-codec:1.15")
}