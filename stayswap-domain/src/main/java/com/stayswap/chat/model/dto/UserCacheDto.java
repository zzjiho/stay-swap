package com.stayswap.chat.model.dto;

import com.stayswap.user.model.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCacheDto {
    
    private Long id;
    private String nickname;
    
    public static UserCacheDto from(User user) {
        return UserCacheDto.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .build();
    }
    
    public User toUser() {
        return User.builder()
                .id(this.id)
                .nickname(this.nickname)
                .build();
    }
}