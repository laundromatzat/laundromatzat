import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PROJECTS } from "../constants";
import { ProjectType } from "../types";
import ProjectGrid from "../components/ProjectGrid";
import PageMetadata from "../components/PageMetadata";
import { compareProjectsByDateDesc } from "../utils/projectDates";

interface VideosPageProps {
  forcedSlug?: string;
}

function VideosPage({ forcedSlug }: VideosPageProps): React.ReactNode {
  const { slug: paramsSlug } = useParams<{ slug: string }>();
  const slug = forcedSlug || paramsSlug;
  const navigate = useNavigate();

  const videoProjects = useMemo(
    () =>
      PROJECTS.filter((project) => project.type === ProjectType.Video).sort(
        compareProjectsByDateDesc
      ),
    []
  );

  const handleSlugChange = useCallback(
    (newSlug: string | null) => {
      if (newSlug) {
        navigate(`/vids/${newSlug}`);
      } else {
        navigate("/vids");
      }
    },
    [navigate]
  );

  return (
    <div className="space-y-space-5 pt-24">
      <PageMetadata
        title="Videos"
        description="Road films, holiday epics, and family travelogues spanning two decades."
        path="/vids"
        type="article"
      />

      <ProjectGrid
        projects={videoProjects}
        activeSlug={slug}
        onSlugChange={handleSlugChange}
      />
    </div>
  );
}

export default VideosPage;
