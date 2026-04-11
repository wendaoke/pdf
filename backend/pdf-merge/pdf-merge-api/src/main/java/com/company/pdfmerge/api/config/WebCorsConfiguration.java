package com.company.pdfmerge.api.config;

import com.company.pdfmerge.common.config.PdfMergeProperties;
import java.util.List;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Servlet CorsFilter runs before Spring MVC and reliably answers OPTIONS preflight with CORS headers.
 * WebMvcConfigurer-only CORS can miss preflight in some Boot 4 / servlet combinations.
 */
@Configuration
public class WebCorsConfiguration {

    /**
     * 本地浏览器常见 Origin（Next dev、start-prod 等）。显式端口 + 通配端口，避免仅配 {@code *} 时个别环境匹配异常。
     */
    private static void appendLocalBrowserOrigins(CorsConfiguration config) {
        config.addAllowedOriginPattern("http://localhost:3000");
        config.addAllowedOriginPattern("http://127.0.0.1:3000");
        config.addAllowedOriginPattern("http://localhost:*");
        config.addAllowedOriginPattern("http://127.0.0.1:*");
    }

    @Bean
    public FilterRegistrationBean<CorsFilter> pdfMergeCorsFilter(PdfMergeProperties pdfMergeProperties) {
        CorsConfiguration config = new CorsConfiguration();
        List<String> patterns = pdfMergeProperties.getCors().getAllowedOriginPatterns();
        if (patterns != null && !patterns.isEmpty()) {
            for (String pattern : patterns) {
                if (pattern != null && !pattern.isBlank()) {
                    config.addAllowedOriginPattern(pattern.trim());
                }
            }
        }
        appendLocalBrowserOrigins(config);

        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);
        config.addExposedHeader("Content-Disposition");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // 含 uploads:init 等带冒号的路径，部分环境下 /api/** 匹配不如 /** 稳
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(new CorsFilter(source));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
