import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { VIDEOS } from "@/constants";
import ProjectGrid from "@/components/ProjectGrid";
import PageMetadata from "@/components/PageMetadata";
import { compareProjectsByDateDesc } from "@/utils/projectDates";
import { findProjectBySlug } from "@/utils/slugs";
import { buildSocialMetadata } from "@/utils/socialMetadata";
import Container from "@/components/Container";

function VideosPage(): React.ReactNode {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const videos = useMemo(
    () => [...VIDEOS].sort(compareProjectsByDateDesc),
    [],
  );

  const activeProject = useMemo(
    () => findProjectBySlug(videos, slug),
    [videos, slug],
  );

  const metadata = useMemo(
    () => buildSocialMetadata(videos, activeProject),
    [videos, activeProject],
  );

  const handleSlugChange = useCallback(
    (newSlug: string | null) => {
      navigate(newSlug ? `/vids/${newSlug}` : "/");
    },
    [navigate],
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

      <ProjectGrid
        projects={videos}
        activeSlug={slug}
        onSlugChange={handleSlugChange}
      />
    </Container>
  );
}

export default VideosPage;
