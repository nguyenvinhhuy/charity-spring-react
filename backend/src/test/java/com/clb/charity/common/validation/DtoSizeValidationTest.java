package com.clb.charity.common.validation;

import com.clb.charity.campaign.domain.CampaignCategory;
import com.clb.charity.campaign.dto.request.CreateCampaignRequest;
import com.clb.charity.post.dto.request.CreatePostRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DtoSizeValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void createCampaignRequest_rejectsTitleOver255Chars() {
        CreateCampaignRequest request = new CreateCampaignRequest(
                "a".repeat(256), null, "desc", null, null, null, null, null,
                1000, "123456", "Test", null, null, CampaignCategory.OTHER,
                LocalDate.now(), null, null, null, null);

        Set<ConstraintViolation<CreateCampaignRequest>> violations = validator.validate(request);

        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("title")));
    }

    @Test
    void createCampaignRequest_acceptsTitleAt255Chars() {
        CreateCampaignRequest request = new CreateCampaignRequest(
                "a".repeat(255), null, "desc", null, null, null, null, null,
                1000, "123456", "Test", null, null, CampaignCategory.OTHER,
                LocalDate.now(), null, null, null, null);

        Set<ConstraintViolation<CreateCampaignRequest>> violations = validator.validate(request);

        assertFalse(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("title")));
    }

    @Test
    void createPostRequest_rejectsMoreThan10Tags() {
        CreatePostRequest request = new CreatePostRequest(
                "title", null, "content", null, null, null, null,
                List.of("t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10", "t11"));

        Set<ConstraintViolation<CreatePostRequest>> violations = validator.validate(request);

        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("tags")));
    }

    @Test
    void createPostRequest_rejectsTagOver30Chars() {
        CreatePostRequest request = new CreatePostRequest(
                "title", null, "content", null, null, null, null,
                List.of("a".repeat(31)));

        Set<ConstraintViolation<CreatePostRequest>> violations = validator.validate(request);

        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().contains("tags")));
    }
}
