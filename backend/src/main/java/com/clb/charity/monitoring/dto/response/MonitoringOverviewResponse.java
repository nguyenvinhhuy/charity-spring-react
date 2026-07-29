package com.clb.charity.monitoring.dto.response;

import java.time.Instant;

/**
 * Aggregated status of all 4 monitored external services.
 *
 * @param render Render (backend hosting) status
 * @param vercel Vercel (frontend hosting) status
 * @param database Supabase/Postgres status
 * @param cloudinary Cloudinary (storage) status
 * @param fetchedAt when this snapshot was assembled
 */
public record MonitoringOverviewResponse(
        RenderStatusResponse render,
        VercelStatusResponse vercel,
        DatabaseStatusResponse database,
        CloudinaryStatusResponse cloudinary,
        Instant fetchedAt
) {
}
