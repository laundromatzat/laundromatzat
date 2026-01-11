import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PROJECTS } from "@/constants";
import { ProjectType } from "@/types";
import ProjectGrid from "@/components/ProjectGrid";
import PageMetadata from "@/components/PageMetadata";
import { compareProjectsByDateDesc } from "@/utils/projectDates";
import Container from "@/components/Container";

function CinemagraphsPage(): React.ReactNode {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const cinemagraphProjects = useMemo(
    () =>
      PROJECTS.filter(
        (project) => project.type === ProjectType.Cinemagraph
      ).sort(compareProjectsByDateDesc),
    []
  );

  const handleSlugChange = useCallback(
    (newSlug: string | null) => {
      if (newSlug) {
        navigate(`/cinemagraphs/${newSlug}`);
      } else {
        navigate("/cinemagraphs");
      }
    },
    [navigate]
  );

  return (
    <Container className="space-y-space-5 pt-8">
      <PageMetadata
        title="Cinemagraphs"
        description="Looping living photos that blend still imagery with subtle motion."
        path="/cinemagraphs"
        type="article"
      />

      <ProjectGrid
        projects={cinemagraphProjects}
        activeSlug={slug}
        onSlugChange={handleSlugChange}
      />
    </Container>
  );
}

export default CinemagraphsPage;
