package com.clb.charity.storage.controller;

import com.clb.charity.common.security.AuthPrincipal;
import com.clb.charity.storage.dto.response.MediaUploadResponse;
import com.clb.charity.storage.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final StorageService storageService;

    /**
     * Uploads an image and returns its public URL.
     *
     * @param file the multipart image file (jpeg/png/webp, max 5MB)
     * @param principal the authenticated principal, used to rate-limit uploads
     * @return the upload response with 201 status
     */
    @Operation(summary = "Upload an image (jpeg/png/webp, max 5MB) and get its public URL")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> upload(@RequestPart("file") MultipartFile file,
                                                       @AuthenticationPrincipal AuthPrincipal principal) {
        String url = storageService.upload(file, principal.memberId());
        return ResponseEntity.status(HttpStatus.CREATED).body(new MediaUploadResponse(url));
    }
}
