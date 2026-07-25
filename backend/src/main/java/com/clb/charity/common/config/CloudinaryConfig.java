package com.clb.charity.common.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    private final AppProperties appProperties;

    public CloudinaryConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Bean
    public Cloudinary cloudinary() {
        AppProperties.Cloudinary cloudinary = appProperties.cloudinary();
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudinary.cloudName(),
                "api_key", cloudinary.apiKey(),
                "api_secret", cloudinary.apiSecret(),
                "secure", true
        ));
    }
}
