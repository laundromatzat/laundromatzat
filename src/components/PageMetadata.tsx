import React, { useEffect } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';

interface PageMetadataProps {
  title: string;
  description?: string;
  path?: string;
  type?: 'website' | 'article' | 'video.other';
  /** Absolute URL of the image link unfurlers should show. */
  image?: string;
  /** Alt text for that image. Defaults to the page title. */
  imageAlt?: string;
  /** Absolute URL of the video file, for players that embed it inline. */
  videoUrl?: string;
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

/**
 * Drops the meta/link tags baked into the HTML by scripts/prerender.mjs.
 *
 * Crawlers read the served HTML and never get this far, but a real browser
 * would otherwise end up with both the prerendered tags and Helmet's, and the
 * prerendered ones would go stale as soon as the visitor pages to another
 * video.
 */
function useDropPrerenderedTags(): void {
  useEffect(() => {
    document
      .querySelectorAll('head [data-prerendered]')
      .forEach((element) => element.remove());
  }, []);
}

function PageMetadata({
  title,
  description,
  path,
  type = 'website',
  image,
  imageAlt,
  videoUrl,
}: PageMetadataProps): React.ReactNode {
  const fullTitle = `${title} · ${SITE_NAME}`;
  const canonical = buildCanonical(path);

  useDropPrerenderedTags();

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
      {image ? <meta property="og:image" content={image} /> : null}
      {image ? <meta property="og:image:alt" content={imageAlt ?? title} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description ? <meta name="twitter:description" content={description} /> : null}
      {image ? <meta name="twitter:image" content={image} /> : null}
      {image ? <meta name="twitter:image:alt" content={imageAlt ?? title} /> : null}
      {videoUrl ? <meta property="og:video" content={videoUrl} /> : null}
      {videoUrl ? <meta property="og:video:secure_url" content={videoUrl} /> : null}
      {videoUrl ? <meta property="og:video:type" content="video/mp4" /> : null}
    </Helmet>
  );
}

export default PageMetadata;
