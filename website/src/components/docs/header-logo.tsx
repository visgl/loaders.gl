import React, {type ReactNode} from 'react';
import {FormatLogo} from './format-logo';
import {getFormatDocPath} from './format-doc-paths';

/** An ecosystem image or format mark displayed in a documentation header. */
export type HeaderLogoData = {
  /** Accessible description of the logo. */
  alt: string;
  /** Optional override for the default destination. */
  href?: string;
  /** Absolute or site-relative image URL. */
  src?: string;
  /** Canonical format badge used instead of an ecosystem image. */
  format?: string;
};

const ECOSYSTEM_LINKS: Readonly<Record<string, string>> = {
  'Apache Software Foundation': 'https://www.apache.org/'
};

/** Renders a header logo with its shared project destination when available. */
export function HeaderLogo({logo, className, imageClassName}: {
  logo: HeaderLogoData;
  className: string;
  imageClassName: string;
}): ReactNode {
  const image = logo.format ? <FormatLogo slug={logo.format} linked={false} /> : <img className={imageClassName} src={logo.src} alt={logo.alt} />;
  const destination = logo.href || (logo.format ? getFormatDocPath(logo.format) : ECOSYSTEM_LINKS[logo.alt]);
  return destination ? (
    <a className={className} href={destination} aria-label={logo.alt}>{image}</a>
  ) : (
    <span className={className}>{image}</span>
  );
}
