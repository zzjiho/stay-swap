package com.stayswap;

import com.stayswap.common.config.firebase.FirebaseConfig;
import com.stayswap.common.config.firebase.FirebaseWebController;
import com.stayswap.notification.consumer.core.PushNotificationService;
import com.stayswap.notification.repository.NotificationMongoRepository;
import com.stayswap.notification.service.integration.FCMService;
import com.stayswap.user.repository.UserRepository;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.stream.binder.test.TestChannelBinderConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@ActiveProfiles("test")
@Import(TestChannelBinderConfiguration.class)
@SpringBootTest(classes = StayswapConsumerApplication.class)
public abstract class ConsumerIntegrationTest {

    @MockitoBean
    protected UserRepository userRepository;

    @MockitoBean
    protected NotificationMongoRepository notificationMongoRepository;

    @MockitoBean
    protected PushNotificationService pushNotificationService;

    @MockitoBean
    protected FCMService fcmService;

    @MockitoBean
    protected FirebaseConfig firebaseConfig;

    @MockitoBean
    protected FirebaseWebController firebaseWebController;

}