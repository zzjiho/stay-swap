package com.stayswap.notification.service.domain.house;

import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.notification.constant.NotificationType;
import com.stayswap.notification.dto.request.NotificationMessage;
import com.stayswap.notification.producer.LikeNotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.stayswap.code.ErrorCode.NOT_EXISTS_HOUSE;

/**
 * 숙소 좋아요 알림 서비스
 * 숙소 좋아요와 관련된 알림 처리를 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class HouseLikeNotificationService {

    private final LikeNotificationPublisher likeNotificationPublisher;
    private final HouseRepository houseRepository;

    /**
     * 숙소 좋아요 추가 알림 생성
     */
    public void createHouseLikeAddedNotification(Long recipientId, Long senderId, Long houseId) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
                
        String houseName = house.getTitle();

        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.LIKE_ADDED)
                .title("[좋아요 알림]")
                .content(String.format("회원님의 숙소 '%s'에 좋아요가 추가되었습니다.", houseName))
                .referenceId(houseId)
                .accommodationId(houseId)
                .accommodationName(houseName)
                .build();

        likeNotificationPublisher.sendNotification(message);
        log.info("숙소 좋아요 추가 알림 생성 완료 - recipientId: {}, houseId: {}", recipientId, houseId);
    }
    
    /**
     * 숙소 좋아요 취소 알림 생성
     */
    public void createHouseLikeRemovedNotification(Long recipientId, Long senderId, Long houseId) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_HOUSE));
                
        String houseName = house.getTitle();

        NotificationMessage message = NotificationMessage.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(NotificationType.LIKE_REMOVED)
                .title("[좋아요 취소 알림]")
                .content(String.format("회원님의 숙소 '%s'에 좋아요가 취소되었습니다.", houseName))
                .referenceId(houseId)
                .accommodationId(houseId)
                .accommodationName(houseName)
                .build();

        likeNotificationPublisher.sendNotification(message);
        log.info("숙소 좋아요 취소 알림 생성 완료 - recipientId: {}, houseId: {}", recipientId, houseId);
    }
} 