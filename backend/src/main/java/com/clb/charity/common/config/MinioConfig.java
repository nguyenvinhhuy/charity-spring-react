package com.clb.charity.common.config;

import io.minio.MinioClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

    private final AppProperties appProperties;

    public MinioConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Bean
    public MinioClient minioClient() {
        AppProperties.Minio minio = appProperties.minio();
        return MinioClient.builder()
                .endpoint(minio.endpoint())
                .credentials(minio.accessKey(), minio.secretKey())
                .build();
    }
}
