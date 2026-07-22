package com.clb.charity.vietqr.service.impl;

import com.clb.charity.common.exception.StorageException;
import com.clb.charity.vietqr.service.VietQrService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;
import org.jspecify.annotations.Nullable;

import java.util.Optional;

/**
 * Proxies the free public VietQR image as PNG bytes, server-side, so the browser avoids a cross-origin call.
 */
@Service
@RequiredArgsConstructor
public class VietQrServiceImpl implements VietQrService {

    private static final String BASE_URL = "https://img.vietqr.io/image";
    private static final String BANK_CODE = "MB";
    private static final String TEMPLATE = "compact2";

    private final RestClient restClient;

    @Override
    public byte[] generateQrPng(String accountNo, String accountName, @Nullable Long amount, @Nullable String description) {
        // Free public endpoint, no API key: /image/MB-{accountNo}-compact2.png?amount&addInfo&accountName
        String url = UriComponentsBuilder
                .fromUriString(BASE_URL + "/" + BANK_CODE + "-" + accountNo + "-" + TEMPLATE + ".png")
                .queryParamIfPresent("amount",
                        Optional.ofNullable(amount).filter(a -> a > 0))
                .queryParamIfPresent("addInfo",
                        Optional.ofNullable(description).filter(d -> !d.isBlank()))
                .queryParamIfPresent("accountName",
                        Optional.ofNullable(accountName).filter(n -> !n.isBlank()))
                .encode()
                .toUriString();
        try {
            byte[] body = restClient.get().uri(url).retrieve().body(byte[].class);
            if (body == null || body.length == 0) {
                throw new StorageException("VietQR service returned an empty image");
            }
            return body;
        } catch (RestClientException ex) {
            throw new StorageException("Failed to fetch VietQR image: " + ex.getMessage());
        }
    }
}
