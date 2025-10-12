import { Project } from '../types';

/**
 * Normalizes a project's MM/YYYY date string into a comparable timestamp for sorting.
 * Returns `null` when the project is missing a valid date so callers can defer ordering.
 */
export function toComparableDate(project: Project): number | null {
  if (!project.date) {
    return null;
  }

  const [month, year] = project.date.split('/');
  const comparableDate = new Date(`${year}-${month}-01`).getTime();

  return Number.isNaN(comparableDate) ? null : comparableDate;
}
