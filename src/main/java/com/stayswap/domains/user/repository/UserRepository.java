package com.stayswap.domains.user.repository;

import com.stayswap.domains.user.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}
