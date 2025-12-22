import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PROJECTS } from "../constants";
import { ProjectType } from "../types";
import ProjectGrid from "../components/ProjectGrid";
import PageMetadata from "../components/PageMetadata";
import { compareProjectsByDateDesc } from "../utils/projectDates";

function ImagesPage(): React.ReactNode {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const photoProjects = useMemo(
    () =>
      PROJECTS.filter((project) => project.type === ProjectType.Photo).sort(
        compareProjectsByDateDesc
      ),
    []
  );

  const handleSlugChange = useCallback(
    (newSlug: string | null) => {
      if (newSlug) {
        navigate(`/images/${newSlug}`);
      } else {
        navigate("/images");
      }
    },
    [navigate]
  );

  return (
    <div className="space-y-space-5 pt-24">
      <PageMetadata
        title="Images"
        description="Browse still photography captured across Alaska, California, and beyond."
        path="/images"
        type="article"
      />

      <ProjectGrid
        projects={photoProjects}
        activeSlug={slug}
        onSlugChange={handleSlugChange}
      />
    </div>
  );
}

export default ImagesPage;
