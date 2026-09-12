import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { VIDEOS } from "@/constants";
import ProjectGrid from "@/components/ProjectGrid";
import PageMetadata from "@/components/PageMetadata";
import FilterBar from "@/components/FilterBar";
import { AuraButton } from "@/components/aura";
import { compareProjectsByDateDesc } from "@/utils/projectDates";
import { findProjectBySlug } from "@/utils/slugs";
import { buildSocialMetadata } from "@/utils/socialMetadata";
import {
  EMPTY_FILTERS,
  VideoFilters,
  collectFilterTags,
  collectYears,
  filterVideos,
  filtersFromSearchParams,
  hasActiveFilters,
  searchParamsFromFilters,
} from "@/utils/videoFilters";
import Container from "@/components/Container";

function VideosPage(): React.ReactNode {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const videos = useMemo(() => [...VIDEOS].sort(compareProjectsByDateDesc), []);

  // Filters live in the URL, so a narrowed view can be bookmarked or shared.
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);

  const years = useMemo(() => collectYears(videos), [videos]);
  const tags = useMemo(() => collectFilterTags(videos), [videos]);

  const activeProject = useMemo(
    () => findProjectBySlug(videos, slug),
    [videos, slug],
  );

  const visible = useMemo(() => {
    const matching = filterVideos(videos, filters);
    // A deep link wins over the filters: someone following a shared link to a
    // video the current filters exclude should still see it open, and should
    // be able to page on from there.
    if (activeProject && !matching.includes(activeProject)) {
      return videos;
    }
    return matching;
  }, [videos, filters, activeProject]);

  const metadata = useMemo(
    () => buildSocialMetadata(videos, activeProject),
    [videos, activeProject],
  );

  const handleFiltersChange = useCallback(
    (next: VideoFilters) => {
      // replace, not push: typing in the search box should not bury the page
      // the visitor arrived on under a history entry per keystroke.
      setSearchParams(searchParamsFromFilters(next), { replace: true });
    },
    [setSearchParams],
  );

  const handleSlugChange = useCallback(
    (newSlug: string | null) => {
      const query = searchParams.toString();
      const suffix = query ? `?${query}` : "";
      navigate(newSlug ? `/vids/${newSlug}${suffix}` : `/${suffix}`);
    },
    [navigate, searchParams],
  );

  return (
    <Container className="space-y-space-5 pt-8 pb-24">
      <PageMetadata
        title={metadata.title}
        description={metadata.description}
        path={metadata.path}
        type={metadata.type}
        image={metadata.image}
        imageAlt={metadata.imageAlt}
        videoUrl={metadata.videoUrl}
      />

      <FilterBar
        filters={filters}
        onChange={handleFiltersChange}
        years={years}
        tags={tags}
        resultCount={visible.length}
        totalCount={videos.length}
      />

      <ProjectGrid
        projects={visible}
        activeSlug={slug}
        onSlugChange={handleSlugChange}
        emptyState={
          <div className="rounded-2xl border border-aura-border bg-aura-surface px-6 py-10 text-center">
            <p className="text-aura-text-primary font-semibold">Nothing matches that.</p>
            <p className="mt-1 text-sm text-aura-text-secondary">
              Try a different word, or widen the year and tag filters.
            </p>
            {hasActiveFilters(filters) ? (
              <AuraButton
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => handleFiltersChange(EMPTY_FILTERS)}
              >
                Clear filters
              </AuraButton>
            ) : null}
          </div>
        }
      />
    </Container>
  );
}

export default VideosPage;
