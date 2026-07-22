package com.clb.charity.dashboard.service.impl;

import com.clb.charity.campaign.dto.response.CampaignStatsResponse;
import com.clb.charity.campaign.service.CampaignService;
import com.clb.charity.common.model.Granularity;
import com.clb.charity.dashboard.dto.response.DashboardResponse;
import com.clb.charity.dashboard.dto.response.DashboardResponse.ActivityItem;
import com.clb.charity.dashboard.service.DashboardService;
import com.clb.charity.member.dto.response.MemberStatsResponse;
import com.clb.charity.member.service.MemberService;
import com.clb.charity.post.dto.response.PostActivityView;
import com.clb.charity.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final String CAMPAIGN_CREATED = "CAMPAIGN_CREATED";
    private static final String DONATION_ADDED = "DONATION_ADDED";
    private static final String POST_CREATED = "POST_CREATED";
    private static final int ACTIVITY_LIMIT = 12;

    private final CampaignService campaignService;
    private final MemberService memberService;
    private final PostService postService;

    @Override
    public DashboardResponse summary(Granularity granularity) {
        CampaignStatsResponse campaignStats = campaignService.stats(granularity);
        MemberStatsResponse memberStats = memberService.stats();
        List<PostActivityView> recentPosts = postService.recentActivity();

        // Resolve author names for every actor referenced in the activity feed in one lookup.
        Set<Long> actorIds = new HashSet<>();
        campaignStats.recentCampaigns().forEach(c -> addId(actorIds, c.createdBy()));
        campaignStats.recentDonations().forEach(d -> addId(actorIds, d.createdBy()));
        recentPosts.forEach(p -> addId(actorIds, p.createdBy()));
        Map<Long, String> names = memberService.namesByIds(actorIds);

        List<ActivityItem> activity = new ArrayList<>();
        for (var c : campaignStats.recentCampaigns()) {
            activity.add(new ActivityItem(CAMPAIGN_CREATED, c.title(), 0, names.get(c.createdBy()), c.createdAt()));
        }
        for (var d : campaignStats.recentDonations()) {
            activity.add(new ActivityItem(DONATION_ADDED, d.campaignTitle(), d.amount(),
                    names.get(d.createdBy()), d.createdAt()));
        }
        for (var p : recentPosts) {
            activity.add(new ActivityItem(POST_CREATED, p.title(), 0, names.get(p.createdBy()), p.createdAt()));
        }
        activity.sort(Comparator.comparing(ActivityItem::at,
                Comparator.nullsLast(Comparator.reverseOrder())));
        List<ActivityItem> recentActivity = activity.stream().limit(ACTIVITY_LIMIT).toList();

        return new DashboardResponse(
                campaignStats.totalRaised(),
                campaignStats.totalDonors(),
                campaignStats.activeCount(),
                campaignStats.completedCount(),
                campaignStats.totalCount(),
                memberStats.total(),
                memberStats.byRole(),
                campaignStats.categoryAmounts(),
                campaignStats.progress(),
                campaignStats.donationSeries(),
                recentActivity);
    }

    /** Adds a non-null id to the set. */
    private static void addId(Set<Long> ids, Long id) {
        if (id != null) {
            ids.add(id);
        }
    }
}
