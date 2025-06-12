package config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.support.converter.RecordMessageConverter;
import org.springframework.kafka.support.converter.StringJsonMessageConverter;

/**
 * Kafka 설정
 */
@Configuration
public class KafkaConfig {

    /**
     * Kafka 메시지 변환기 설정 - JSON 변환을 위함
     */
    @Bean
    public RecordMessageConverter messageConverter() {
        return new StringJsonMessageConverter();
    }
} 