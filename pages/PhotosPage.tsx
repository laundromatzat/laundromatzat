import React from "react";
import { PROJECTS } from "../constants";
import { ProjectType } from "../types";
import ProjectGrid from "../components/ProjectGrid";
import Container from "../components/Container";

function PhotosPage(): React.ReactNode {
  const photoProjects = PROJECTS.filter(
    (p) => p.type === ProjectType.Photo
  ).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    const [aMonth, aYear] = a.date.split("/");
    const [bMonth, bYear] = b.date.split("/");
    return (
      new Date(`${bYear}-${bMonth}-01`).getTime() -
      new Date(`${aYear}-${aMonth}-01`).getTime()
    );
  });

  return (
    <Container className="space-y-8 pt-8">
      <ProjectGrid projects={photoProjects} />
    </Container>
  );
}

export default PhotosPage;
