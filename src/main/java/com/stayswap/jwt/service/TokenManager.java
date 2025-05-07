package com.stayswap.jwt.service;

import com.stayswap.domains.user.constant.Role;
import com.stayswap.global.error.exception.AuthenticationException;
import com.stayswap.jwt.constant.GrantType;
import com.stayswap.jwt.constant.TokenType;
import com.stayswap.jwt.dto.JwtTokenDto;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static com.stayswap.global.code.ErrorCode.NOT_VALID_TOKEN;
import static com.stayswap.global.code.ErrorCode.TOKEN_EXPIRED;

@Slf4j
@RequiredArgsConstructor
public class TokenManager {

    //yml에서 설정한 값
    private final String accessTokenExpirationTime;
    private final String refreshTokenExpirationTime;
    private final String tokenSecret;

    public JwtTokenDto createJwtTokenDto(Long userId, Role role) { //생성하면서 토큰에 역할 넘김
        Date accessTokenExpireTime = createAccessTokenExpireTime();
        Date refreshTokenExpireTime = createRefreshTokenExpireTime();

        String accessToken = createAccessToken(userId, role, accessTokenExpireTime);
        String refreshToken = createRefreshToken(userId, refreshTokenExpireTime);

        return JwtTokenDto.builder()
                .grantType(GrantType.BEARER.getType())
                .accessToken(accessToken)
                .accessTokenExpireTime(accessTokenExpireTime)
                .refreshToken(refreshToken)
                .refreshTokenExpireTime(refreshTokenExpireTime)
                .build();
    }

    public JwtTokenDto createRefreshTokenDto(Long userId) {
        Date refreshTokenExpireTime = createRefreshTokenExpireTime();
        String refreshToken = createRefreshToken(userId, refreshTokenExpireTime);

        return JwtTokenDto.builder()
                .grantType(GrantType.BEARER.getType())
                .refreshToken(refreshToken)
                .refreshTokenExpireTime(refreshTokenExpireTime)
                .build();
    }

    public Date createAccessTokenExpireTime() {
        return new Date(System.currentTimeMillis() + Long.parseLong(accessTokenExpirationTime));
    }

    public Date createRefreshTokenExpireTime() {
        return new Date(System.currentTimeMillis() + Long.parseLong(refreshTokenExpirationTime));
    }

    /**
     * accessToken 생성
     */
    public String createAccessToken(Long userId, Role role, Date expirationTime) {
        String accessToken = Jwts.builder()
                .setSubject(TokenType.ACCESS.name()) //토큰 제목
                .setIssuedAt(new Date())            //토큰 발행일자
                .setExpiration(expirationTime)      //토큰 만료일자
                .claim("userId", userId)  //회원 아이디
                .claim("role", role.name())   //회원 권한
                .signWith(SignatureAlgorithm.HS512, tokenSecret.getBytes(StandardCharsets.UTF_8)) //토큰 암호화 알고리즘, secret값
                .setHeaderParam("typ", "JWT") //토큰 타입
                .compact();

        return accessToken;
    }

    /**
     * refreshToken 생성
     */
    public String createRefreshToken(Long userId, Date expirationTime) {
        String refreshToken = Jwts.builder()
                .setSubject(TokenType.REFRESH.name()) //토큰 제목
                .setIssuedAt(new Date())            //토큰 발행일자
                .setExpiration(expirationTime)      //토큰 만료일자
                .claim("userId", userId)  //회원 아이디
                .signWith(SignatureAlgorithm.HS512, tokenSecret.getBytes(StandardCharsets.UTF_8)) //토큰 암호화 알고리즘, secret값
                .setHeaderParam("typ", "JWT") //토큰 타입
                .compact();

        return refreshToken;
    }

    /**
     * 토큰 검증
     */
    public void validateToken(String token) {
        try {
            Jwts.parser()
                    .setSigningKey(Keys.hmacShaKeyFor(tokenSecret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

        } catch (ExpiredJwtException e) {
            log.info("token 만료", e);
            throw new AuthenticationException(TOKEN_EXPIRED);
        } catch (Exception e) {
            log.info("유효하지 않은 token", e);
            throw new AuthenticationException(NOT_VALID_TOKEN);
        }
    }

    /**
     * paylod에서 claim 정보 추출
     */
    public Claims getTokenClaims(String token) {
        Claims claims;
        try {
            claims = Jwts.parser()
                        .setSigningKey(Keys.hmacShaKeyFor(tokenSecret.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

        } catch (Exception e) {
            log.info("유효하지 않은 token", e);
            throw new AuthenticationException(NOT_VALID_TOKEN);
        }
        return claims;
    }

































}