import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'TecnoCel';
const BASE_URL = 'https://tecnocel-web.vercel.app';
const DEFAULT_DESCRIPTION = 'TecnoCel — Tienda de productos tecnológicos en Argentina. Celulares, accesorios y más al mejor precio.';
const DEFAULT_IMAGE = `${BASE_URL}/og-default.jpg`;

interface PageMetaProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  /** true para páginas privadas/admin que no deben indexarse */
  noIndex?: boolean;
}

const PageMeta = ({ title, description, image, url, noIndex }: PageMetaProps) => {
  const fullTitle = `${title} — ${SITE_NAME}`;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;
  const canonical = url ? `${BASE_URL}${url}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:type" content="website" />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_AR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};

export default PageMeta;
