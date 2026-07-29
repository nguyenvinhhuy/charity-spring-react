package com.clb.charity.monitoring.dto.response;

import com.clb.charity.monitoring.domain.VercelState;
import org.jspecify.annotations.Nullable;

import java.util.List;

/**
 * Current status and recent build-time trend of the Vercel-hosted frontend.
 *
 * @param configured whether {@code VERCEL_API_TOKEN}/{@code VERCEL_PROJECT_ID} are set
 * @param status the most recent deployment's state
 * @param deploymentUrl the most recent deployment's URL
 * @param recentBuilds build duration of the last few deployments, oldest first
 * @param errorMessage set when this card could not be fetched; null otherwise
 */
public record VercelStatusResponse(
        boolean configured,
        VercelState status,
        @Nullable String deploymentUrl,
        List<DeployDurationPoint> recentBuilds,
        @Nullable String errorMessage
) {
}
