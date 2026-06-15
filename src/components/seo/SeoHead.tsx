// Per-route SEO head tags. Drop into a page component to override the
// sitewide title/description/canonical/og tags set in index.html.
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://theuntoldstories.lovable.app';

interface SeoHeadProps {
  title: string;
  description: string;
  path: string; // e.g. "/", "/campaigns"
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function SeoHead({ title, description, path, jsonLd }: SeoHeadProps) {
  const url = `${SITE_URL}${path}`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
