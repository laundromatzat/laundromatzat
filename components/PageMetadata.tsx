import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PageMetadataProps {
  title: string;
  description?: string;
  path?: string;
  type?: 'website' | 'article';
}

const SITE_NAME = 'Laundromatzat';
const DEFAULT_CANONICAL_BASE = typeof window === 'undefined'
  ? 'https://laundromatzat.com'
  : `${window.location.protocol}//${window.location.host}`;

function buildCanonical(path?: string): string | undefined {
  if (!path) {
    return undefined;
  }

  try {
    const base = import.meta.env.VITE_SITE_URL ?? DEFAULT_CANONICAL_BASE;
    return new URL(path, base).toString();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to construct canonical URL', error);
    }
    return undefined;
  }
}

function PageMetadata({ title, description, path, type = 'website' }: PageMetadataProps): React.ReactNode {
  const fullTitle = `${title} · ${SITE_NAME}`;
  const canonical = buildCanonical(path);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description ? <meta property="og:description" content={description} /> : null}
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:type" content={type} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description ? <meta name="twitter:description" content={description} /> : null}
    </Helmet>
  );
}

export default PageMetadata;
