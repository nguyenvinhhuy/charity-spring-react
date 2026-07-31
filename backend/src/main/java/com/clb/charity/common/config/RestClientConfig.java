package com.clb.charity.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Shared {@link RestClient} used for outbound HTTP calls (e.g. proxying the public VietQR image endpoint).
 */
@Configuration
public class RestClientConfig {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(10);

    /**
     * Builds the outbound {@link RestClient} backed by a simple HttpURLConnection factory with timeouts.
     *
     * @return the configured rest client
     */
    @Bean
    public RestClient restClient() {
        // Connects lazily per request so bean creation doesn't open a loopback selector (fails in sandboxed tests).
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT);
        factory.setReadTimeout(READ_TIMEOUT);
        return RestClient.builder().requestFactory(factory).build();
    }
}
