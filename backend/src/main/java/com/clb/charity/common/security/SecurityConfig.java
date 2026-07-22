package com.clb.charity.common.security;

import com.clb.charity.common.config.AppProperties;
import com.clb.charity.common.exception.ProblemTypes;
import com.clb.charity.common.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import com.clb.charity.common.security.oauth2.OAuth2LoginFailureHandler;
import com.clb.charity.common.security.oauth2.OAuth2LoginSuccessHandler;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final String API = "/api/v1";

    private final JwtAuthFilter jwtAuthFilter;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<ClientRegistrationRepository> clientRegistrationRepository;
    private final HttpCookieOAuth2AuthorizationRequestRepository cookieAuthRequestRepository;
    private final OAuth2LoginSuccessHandler oauth2SuccessHandler;
    private final OAuth2LoginFailureHandler oauth2FailureHandler;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, AppProperties appProperties, ObjectMapper objectMapper,
                          ObjectProvider<ClientRegistrationRepository> clientRegistrationRepository,
                          HttpCookieOAuth2AuthorizationRequestRepository cookieAuthRequestRepository,
                          OAuth2LoginSuccessHandler oauth2SuccessHandler,
                          OAuth2LoginFailureHandler oauth2FailureHandler) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.cookieAuthRequestRepository = cookieAuthRequestRepository;
        this.oauth2SuccessHandler = oauth2SuccessHandler;
        this.oauth2FailureHandler = oauth2FailureHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(formLogin -> formLogin.disable())
                .authorizeHttpRequests(auth -> auth
                        // ── Public docs & health ──────────────────────────
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/actuator/health")
                        .permitAll()

                        // ── Auth & social login ───────────────────────────
                        // The /me endpoints act on the caller's own account and need authentication.
                        .requestMatchers(API + "/auth/me", API + "/auth/me/**").authenticated()
                        .requestMatchers(API + "/auth/**").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                        // ── Campaigns ─────────────────────────────────────
                        // Donations (money) are admin-only; listing them requires authentication.
                        .requestMatchers(HttpMethod.POST, API + "/campaigns/*/donations").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, API + "/campaigns/*/donations/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, API + "/campaigns/*/donations")
                        .hasAnyRole("MEMBER", "CONTRIBUTOR", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, API + "/campaigns/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, API + "/campaigns/*/progress").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, API + "/campaigns/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, API + "/campaigns").hasAnyRole("CONTRIBUTOR", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, API + "/campaigns/*").hasAnyRole("CONTRIBUTOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, API + "/campaigns/**").permitAll()

                        // ── Dashboard ─────────────────────────────────────
                        .requestMatchers(HttpMethod.GET, API + "/dashboard/**")
                        .hasAnyRole("MEMBER", "CONTRIBUTOR", "ADMIN")

                        // ── Events (non-fundraising internal activities) ──
                        .requestMatchers(HttpMethod.DELETE, API + "/events/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, API + "/events").hasAnyRole("CONTRIBUTOR", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, API + "/events/*").hasAnyRole("CONTRIBUTOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, API + "/events/**").permitAll()

                        // ── Posts ─────────────────────────────────────────
                        .requestMatchers(HttpMethod.PATCH, API + "/posts/*/publish").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, API + "/posts").hasAnyRole("CONTRIBUTOR", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, API + "/posts/*").hasAnyRole("CONTRIBUTOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, API + "/posts/**").permitAll()

                        // ── FAQs ──────────────────────────────────────────
                        .requestMatchers(HttpMethod.PATCH, API + "/faqs/*/publish").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, API + "/faqs/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, API + "/faqs").hasAnyRole("CONTRIBUTOR", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, API + "/faqs/*").hasAnyRole("CONTRIBUTOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, API + "/faqs/**").permitAll()

                        // ── Members ───────────────────────────────────────
                        .requestMatchers(HttpMethod.PATCH, API + "/members/*/role").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, API + "/members/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, API + "/members").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, API + "/members").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, API + "/members/*").hasAnyRole("MEMBER", "CONTRIBUTOR", "ADMIN")

                        // ── Reports ───────────────────────────────────────
                        .requestMatchers(HttpMethod.GET, API + "/reports/**").hasAnyRole("MEMBER", "CONTRIBUTOR", "ADMIN")

                        // ── Media upload ──────────────────────────────────
                        // Any authenticated member may upload (e.g. their own avatar).
                        .requestMatchers(HttpMethod.POST, API + "/media/**").authenticated()

                        // ── Everything else requires authentication ───────
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(problemAuthenticationEntryPoint())
                        .accessDeniedHandler(problemAccessDeniedHandler()))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        // Enable social login only when at least one OAuth2 client is configured, so the app
        // still starts with no provider credentials set.
        if (clientRegistrationRepository.getIfAvailable() != null) {
            http.oauth2Login(oauth -> oauth
                    .authorizationEndpoint(endpoint -> endpoint
                            .authorizationRequestRepository(cookieAuthRequestRepository))
                    .successHandler(oauth2SuccessHandler)
                    .failureHandler(oauth2FailureHandler));
        }

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(appProperties.cors().originList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private AuthenticationEntryPoint problemAuthenticationEntryPoint() {
        return (request, response, ex) -> writeProblem(request, response, HttpStatus.UNAUTHORIZED,
                "Unauthorized", "unauthorized",
                ex.getMessage() != null ? ex.getMessage() : "Authentication is required");
    }

    private AccessDeniedHandler problemAccessDeniedHandler() {
        return (request, response, ex) -> writeProblem(request, response, HttpStatus.FORBIDDEN,
                "Forbidden", "access-denied", "You do not have permission to access this resource");
    }

    private void writeProblem(HttpServletRequest request, HttpServletResponse response,
                              HttpStatus status, String title, String typeSlug, String detail)
            throws java.io.IOException {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        problem.setType(URI.create(ProblemTypes.BASE + "/" + typeSlug));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), problem);
    }
}
