import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type TrackAnalyticsInput } from "@shared/routes";
import { fetchWithAuth } from "@/lib/api";

export function useTrackCardView() {
  return useMutation({
    mutationFn: async (data: TrackAnalyticsInput) => {
      const validated = api.analytics.track.input.parse(data);
      const res = await fetch(api.analytics.track.path, {
        method: api.analytics.track.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Tracking failed");
      return api.analytics.track.responses[201].parse(await res.json());
    },
    // Fail silently for tracking
    onError: (err) => console.error("[Analytics]", err)
  });
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: [api.analytics.summary.path],
    queryFn: async () => {
      const res = await fetchWithAuth(api.analytics.summary.path);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return api.analytics.summary.responses[200].parse(await res.json());
    },
  });
}
