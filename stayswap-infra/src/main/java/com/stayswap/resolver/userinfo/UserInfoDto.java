package com.stayswap.resolver.userinfo;

import com.stayswap.user.constant.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoDto {

    private Long userId;
    private Role role;

}
