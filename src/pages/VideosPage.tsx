import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { VIDEOS } from "@/constants";
import ProjectGrid from "@/components/ProjectGrid";
import PageMetadata from "@/components/PageMetadata";
import { compareProjectsByDateDesc } from "@/utils/projectDates";
import Container from "@/components/Container";

function VideosPage(): React.ReactNode {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const videos = useMemo(
    () => [...VIDEOS].sort(compareProjectsByDateDesc),
    [],
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
        title="Music Videos"
        description="Road films, holiday epics, and family travelogues spanning two decades."
        path="/"
        type="website"
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
