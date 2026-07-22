package com.clb.charity.faq.service.impl;

import com.clb.charity.common.exception.FaqNotFoundException;
import com.clb.charity.faq.domain.Faq;
import com.clb.charity.faq.dto.request.CreateFaqRequest;
import com.clb.charity.faq.dto.request.UpdateFaqRequest;
import com.clb.charity.faq.dto.response.FaqResponse;
import com.clb.charity.faq.mapper.FaqMapper;
import com.clb.charity.faq.repository.FaqRepository;
import com.clb.charity.faq.service.FaqService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class FaqServiceImpl implements FaqService {

    private final FaqRepository faqRepository;
    private final FaqMapper faqMapper;

    @Override
    public Page<FaqResponse> list(@Nullable Boolean published, @Nullable String search, Pageable pageable) {
        return faqRepository.search(published, search, pageable).map(faqMapper::toResponse);
    }

    @Override
    @Transactional
    public FaqResponse create(CreateFaqRequest request, Long createdBy) {
        Faq faq = faqMapper.toEntity(request);
        faq.setCreatedBy(createdBy);
        return faqMapper.toResponse(faqRepository.save(faq));
    }

    @Override
    @Transactional
    public FaqResponse update(Long id, UpdateFaqRequest request) {
        Faq faq = loadById(id);
        faqMapper.updateEntity(request, faq);
        return faqMapper.toResponse(faqRepository.save(faq));
    }

    @Override
    @Transactional
    public FaqResponse publish(Long id, boolean published) {
        Faq faq = loadById(id);
        faq.setPublished(published);
        faq.setPublishedAt(published ? Instant.now() : null);
        return faqMapper.toResponse(faqRepository.save(faq));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        faqRepository.delete(loadById(id));
    }

    /**
     * Loads a FAQ by id or throws when it is not found.
     *
     * @param id the FAQ id
     * @return the FAQ entity
     */
    private Faq loadById(Long id) {
        return faqRepository.findById(id)
                .orElseThrow(() -> new FaqNotFoundException(String.valueOf(id)));
    }
}
