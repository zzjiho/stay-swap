package com.stayswap.config.test.mongo;

import com.mongodb.ConnectionString;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;

@Profile("test")
@Slf4j
@Configuration
public class LocalMongoConfig {

    private static final String MONGODB_IMAGE_NAME = "mongo:5.0";
    private static final int MONGODB_INNER_PORT = 27017;
    private static final String DATABASE_NAME = "notification";
    private static final GenericContainer mongo = createMongoInstance();

    private static GenericContainer createMongoInstance() {
        return new GenericContainer(DockerImageName.parse(MONGODB_IMAGE_NAME))
                .withExposedPorts(MONGODB_INNER_PORT);
    }

    @PostConstruct
    public void startMongo() {
        try {
            mongo.start();
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
    }

    @PreDestroy
    public void stopMongo() {
        try {
            if (mongo.isRunning()) mongo.stop();
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
    }

    @Bean(name = "notificationMongoFactory")
    public MongoDatabaseFactory notificationMongoFactory() {
        return new SimpleMongoClientDatabaseFactory(connectionString());
    }

    private ConnectionString connectionString() {
        String host = mongo.getHost();
        Integer port = mongo.getMappedPort(MONGODB_INNER_PORT);
        return new ConnectionString("mongodb://" + host + ":" + port + "/" + DATABASE_NAME);
    }
}
