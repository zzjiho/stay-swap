package com.stayswap.chat.controller;

import com.stayswap.chat.model.dto.ChatMessageResponse;
import com.stayswap.chat.model.dto.ChatRoomResponse;
import com.stayswap.chat.model.dto.ChatRoomListDto;
import com.stayswap.chat.service.ChatService;
import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.model.RestApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/chats")
@RestController
public class ChatController {

    private final ChatService chatService;

    /**
     * 숙소 문의용 1:1 채팅방 생성 또는 기존 방 반환
     * 게스트가 호스트에게 숙소에 대한 문의를 할 때 사용
     */
    @PostMapping("/house/{houseId}/inquiry")
    public RestApiResponse<ChatRoomResponse> createOrGetHouseInquiryChatRoom(
            @UserInfo UserInfoDto userInfo,
            @PathVariable("houseId") Long houseId) {

        return RestApiResponse.success(
                chatService.createOrGetHouseInquiryChatRoom(userInfo.getUserId(), houseId));
    }

    /**
     * 채팅방 목록 조회
     */
    @GetMapping
    public RestApiResponse<Slice<ChatRoomListDto>> getChatRoomList(
            @UserInfo UserInfoDto userInfo,
            @PageableDefault(size = 20) Pageable pageable) {

        return RestApiResponse.success(
                chatService.getChatroomList(userInfo.getUserId(), pageable));
    }

    /**
     * 특정 채팅방의 메시지 목록 조회
     */
    @GetMapping("/{chatRoomId}/messages")
    public RestApiResponse<Slice<ChatMessageResponse>> getMessageList(
            @UserInfo UserInfoDto userInfo,
            @PathVariable("chatRoomId") Long chatRoomId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        return RestApiResponse.success(
                chatService.getMessageList(chatRoomId, userInfo.getUserId(), pageable));
    }

    /**
     * 채팅방 나가기
     */
    @DeleteMapping("/{chatRoomId}")
    public RestApiResponse<Boolean> leaveChatRoom(
            @UserInfo UserInfoDto userInfo,
            @PathVariable("chatRoomId") Long chatRoomId) {

        return RestApiResponse.success(
                chatService.leaveChatroom(userInfo.getUserId(), chatRoomId));
    }

    /**
     * 마지막 읽은 시간 업데이트 (채팅방 나갈 때)
     */
    @PostMapping("/{chatRoomId}/read")
    public RestApiResponse<Void> updateLastCheckedAt(
            @UserInfo UserInfoDto userInfo,
            @PathVariable Long chatRoomId) {

        chatService.updateLastCheckedAt(userInfo.getUserId(), chatRoomId);
        return RestApiResponse.success(null);
    }

}
