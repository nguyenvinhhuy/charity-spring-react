package com.clb.charity.monitoring.dto.response;

import com.clb.charity.monitoring.domain.VercelState;

import java.time.Instant;

/**
 * Build duration of a single recent Vercel deployment.
 *
 * @param deployedAt when the deployment was created
 * @param buildSeconds how long the build took, in seconds
 * @param state the deployment's final (or current) state
 */
public record DeployDurationPoint(Instant deployedAt, long buildSeconds, VercelState state) {
}
