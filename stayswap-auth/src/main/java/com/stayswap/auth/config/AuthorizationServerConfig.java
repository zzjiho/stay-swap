package com.stayswap.auth.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.stayswap.auth.handler.OAuth2LoginSuccessHandler;
import com.stayswap.auth.handler.CustomLogoutSuccessHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Configuration
@EnableWebSecurity
@Slf4j
public class AuthorizationServerConfig {

    // 키 파일 경로
    private static final String KEY_DIR = "stayswap-auth/src/main/resources/keys/";
    private static final String PRIVATE_KEY_FILE = KEY_DIR + "jwt.key";
    private static final String PUBLIC_KEY_FILE = KEY_DIR + "jwt.pub";

    /**
     * oauth2/OIDC 엔드포인트를 보호함. 인증되지않은 요청이 오면 리다이렉트해서 소셜 로그인 유도
     */
    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);

        http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
                .oidc(Customizer.withDefaults()); // OIDC 활성화

        http
                .exceptionHandling((exceptions) -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                new LoginUrlAuthenticationEntryPoint("/login"),
                                new MediaTypeRequestMatcher(MediaType.TEXT_HTML)
                        )
                )
                .oauth2ResourceServer((resourceServer) -> resourceServer
                        .jwt(Customizer.withDefaults()));

        return http.build();
    }

    /**
     * 일반적인 웹 보안 및 소셜 로그인 처리
     * /login 페이지를 통해 로그인하고, 로그인 성공시 / 로 리다이렉트
     */
    @Bean
    @Order(2)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http, OAuth2LoginSuccessHandler successHandler, CustomLogoutSuccessHandler customLogoutSuccessHandler) throws Exception {
        http.authorizeHttpRequests((authorize) -> authorize
                        .requestMatchers("/login", "/oauth2/**", "/error", "/css/**", "/js/**",
                                "/.well-known/**", "/test/**", "/api/auth/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .successHandler(successHandler)
                )
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/auth/**", "/logout"))
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .logout(logout -> logout
                        .logoutUrl("/logout") // 로그아웃 요청을 처리할 URL
                        .logoutSuccessHandler(customLogoutSuccessHandler) // 커스텀 로그아웃 성공 핸들러
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID", "accessToken", "refreshToken")); // 쿠키 삭제

        return http.build();
    }

    // CORS 설정 빈 추가
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:8080")); // 프론트엔드 주소 허용
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS")); // 허용할 HTTP 메소드
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        RegisteredClient webClient = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("stayswap-web")
                .clientSecret("{noop}stayswap-web-secret-2024")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("http://localhost:8081/login/oauth2/code/kakao")
                .redirectUri("http://localhost:8080/api/oauth/callback")
                .redirectUri("https://stayswap.com/callback")
                .scope(OidcScopes.OPENID)
                .scope(OidcScopes.EMAIL)
                .scope("user")
                .scope("profile_nickname")
                .scope("account_email")
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(30))
                        .refreshTokenTimeToLive(Duration.ofDays(14))
                        .reuseRefreshTokens(false)
                        .accessTokenFormat(OAuth2TokenFormat.SELF_CONTAINED)
                        .build())
                .build();

        // pkce
        RegisteredClient mobileClient = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("stayswap-mobile")
                .clientSecret("{noop}stayswap-mobile-secret-2024")
                .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("stayswap://callback")
                .scope(OidcScopes.OPENID)
                .scope(OidcScopes.EMAIL)
                .scope("user")
                .clientSettings(ClientSettings.builder()
                        .requireProofKey(true)
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(30))
                        .refreshTokenTimeToLive(Duration.ofDays(14))
                        .reuseRefreshTokens(false)
                        .accessTokenFormat(OAuth2TokenFormat.SELF_CONTAINED)
                        .build())
                .build();

        return new InMemoryRegisteredClientRepository(webClient, mobileClient);
    }

    /**
     * JWT 서명을 위한 JWK Source
     */
    @Bean
    public JWKSource<SecurityContext> jwkSource() {
        KeyPair keyPair = generateRsaKey();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();

        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(UUID.randomUUID().toString())
                .build();

        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    /**
     * RSA 키 쌍 생성
     */
    private KeyPair generateRsaKey() {
        try {
            Path privateKeyPath = Paths.get(PRIVATE_KEY_FILE);
            Path publicKeyPath = Paths.get(PUBLIC_KEY_FILE);

            // 키 파일이 존재하면 로드
            if (Files.exists(privateKeyPath) && Files.exists(publicKeyPath)) {
                log.info("기존 RSA 키 페어를 파일에서 로드합니다.");
                byte[] privateKeyBytes = Files.readAllBytes(privateKeyPath);
                byte[] publicKeyBytes = Files.readAllBytes(publicKeyPath);

                KeyFactory keyFactory = KeyFactory.getInstance("RSA");
                PKCS8EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privateKeyBytes));
                X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(Base64.getDecoder().decode(publicKeyBytes));

                RSAPrivateKey privateKey = (RSAPrivateKey) keyFactory.generatePrivate(privateKeySpec);
                RSAPublicKey publicKey = (RSAPublicKey) keyFactory.generatePublic(publicKeySpec);

                return new KeyPair(publicKey, privateKey);
            } else {
                // 키 파일이 없으면 새로 생성하고 파일로 저장
                KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
                keyPairGenerator.initialize(2048);
                KeyPair keyPair = keyPairGenerator.generateKeyPair();

                // 개인 키 저장
                Files.createDirectories(privateKeyPath.getParent());
                Files.write(privateKeyPath, Base64.getEncoder().encode(keyPair.getPrivate().getEncoded()));
                // 공개 키 저장
                Files.write(publicKeyPath, Base64.getEncoder().encode(keyPair.getPublic().getEncoded()));

                return keyPair;
            }
        } catch (Exception ex) {
            log.error("RSA 키 페어 생성 또는 로드 중 오류 발생", ex);
            throw new IllegalStateException(ex);
        }
    }

    /**
     * JWT Decoder
     */
    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }

    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    /**
     * Authorization Server 설정
     */
    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder()
                .issuer("http://localhost:8081")
                .build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}