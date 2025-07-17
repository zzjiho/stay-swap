package com.stayswap.chat.model.dto;

import com.stayswap.chat.model.entity.Chatroom;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ChatRoomListDto {
    private Long id;
    private String title;
    private String lastMessage;
    private Long unreadCount;
    private String partnerNickname;
    private String partnerProfileUrl;
    private LocalDateTime lastMessageCreatedAt;
    private LocalDateTime createdAt;
    private Boolean hasNewMessage;

    public static ChatRoomListDto from(Chatroom chatroom, Long currentUserId) {
        // 상대방 정보 찾기
        String partnerNickname = "상대방";
        String partnerProfileUrl = "/images/profile.png";
        
        if (chatroom.getChatMembers() != null) {
            var partnerMember = chatroom.getChatMembers().stream()
                .filter(member -> !member.getUser().getId().equals(currentUserId))
                .findFirst();
            
            if (partnerMember.isPresent()) {
                var partner = partnerMember.get().getUser();
                partnerNickname = partner.getNickname() != null ? partner.getNickname() : "상대방";
                partnerProfileUrl = partner.getProfile() != null ? partner.getProfile() : "/images/profile.png";
            }
        }

        return ChatRoomListDto.builder()
                .id(chatroom.getId())
                .title(chatroom.getTitle())
                .partnerNickname(partnerNickname)
                .partnerProfileUrl(partnerProfileUrl)
                .createdAt(chatroom.getCreatedAt())
                .hasNewMessage(chatroom.getHasNewMessage())
                .build();
    }
} 