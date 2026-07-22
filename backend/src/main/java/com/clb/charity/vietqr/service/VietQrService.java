package com.clb.charity.vietqr.service;

import org.jspecify.annotations.Nullable;

/**
 * Proxies the free public VietQR image endpoint.
 */
public interface VietQrService {

    /**
     * Fetches the VietQR PNG image for the given bank account and payment details.
     *
     * @param accountNo the bank account number
     * @param accountName the bank account holder name
     * @param amount optional pre-filled amount, or null
     * @param description optional transfer description, or null
     * @return the QR image as PNG bytes
     */
    byte[] generateQrPng(String accountNo, String accountName, @Nullable Long amount, @Nullable String description);
}
