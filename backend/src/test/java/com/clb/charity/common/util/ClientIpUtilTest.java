package com.clb.charity.common.util;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ClientIpUtilTest {

    @Test
    void resolve_returnsLastForwardedForSegment_whenMultipleHopsPresent() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn("6.6.6.6, 7.7.7.7");

        assertEquals("7.7.7.7", ClientIpUtil.resolve(request));
    }

    @Test
    void resolve_fallsBackToRemoteAddr_whenNoForwardedForHeader() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.5");

        assertEquals("10.0.0.5", ClientIpUtil.resolve(request));
    }

    @Test
    void resolve_trimsWhitespace_aroundLastSegment() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn("1.1.1.1,2.2.2.2,   3.3.3.3  ");

        assertEquals("3.3.3.3", ClientIpUtil.resolve(request));
    }
}
