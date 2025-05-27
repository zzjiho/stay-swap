package com.stayswap.user.repository;

import com.stayswap.user.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, UserRepositoryCustom {

    Optional<User> findByEmail(String email);

    boolean existsByNickname(String nickname);

    @Query("SELECT u FROM User u WHERE u.id = :userId")
    Optional<User> findNicknameAndProfileById(Long userId);

    Optional<User> findByRefreshToken(String refreshToken);

    @Query("SELECT u.refreshToken FROM User u WHERE u.id = :userId")
    String findRefreshTokenById(@Param("userId") Long userId);

}
