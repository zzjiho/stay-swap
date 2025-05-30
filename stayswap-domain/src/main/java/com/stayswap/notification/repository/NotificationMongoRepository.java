package com.stayswap.notification.repository;

import com.stayswap.notification.model.document.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationMongoRepository extends MongoRepository<Notification, String> {
}