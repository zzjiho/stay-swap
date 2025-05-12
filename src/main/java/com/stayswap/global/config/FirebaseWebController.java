package com.stayswap.global.config;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Firebase 설정 정보를 클라이언트에 제공하는 컨트롤러
 * 서비스 워커에서 사용하기 위함
 */
@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class FirebaseWebController {

    private final FirebaseConfig firebaseConfig;
    
    /**
     * Firebase 설정 정보를 JSON으로 반환
     */
    @GetMapping("/firebase")
    public FirebaseConfig getFirebaseConfig() {
        return firebaseConfig;
    }
} 