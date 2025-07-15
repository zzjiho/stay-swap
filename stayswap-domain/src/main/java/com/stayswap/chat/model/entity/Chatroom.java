package com.stayswap.chat.model.entity;

import com.stayswap.house.model.entity.House;
import com.stayswap.user.model.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Chatroom {

    @Id
    @Column(name = "chatroom_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String title;

    @OneToMany(mappedBy = "chatroom")
    Set<ChatMember> chatMembers;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "house_id")
    private House house;

    LocalDateTime createdAt;

    @Transient
    Boolean hasNewMessage;

    public void setHasNewMessage(Boolean hasNewMessage) {
        this.hasNewMessage = hasNewMessage;
    }

    public ChatMember addMember(User user) {
        if (this.getChatMembers() == null) {
            this.chatMembers = new HashSet<>();
        }

        ChatMember chatMember = ChatMember.builder()
            .user(user)
            .chatroom(this)
            .build();

        this.chatMembers.add(chatMember);

        return chatMember;
    }
}
