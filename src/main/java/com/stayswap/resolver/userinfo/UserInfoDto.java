package com.stayswap.resolver.userinfo;

import com.stayswap.domains.user.constant.Role;
import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class UserInfoDto {

    private Long userId;
    private Role role;

}
