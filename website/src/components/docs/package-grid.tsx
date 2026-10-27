import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {FormatLogo} from './format-logo';
import styles from './package-grid.module.css';

/** Content rendered by a package tile or its containing list. */
type PackageContainerProps = {
  /** Package introductions or the content of one introduction. */
  children: ReactNode;
};

/** Arranges package introductions into large, vertically stacked tiles. */
export function PackageGrid({children}: PackageContainerProps) {
  return <div className={styles.grid}>{children}</div>;
}

/** Keeps a package heading, description, and documentation links within one tile. */
export function PackageTile({children, formats = []}: PackageContainerProps & {
  /** Representative formats from the shared documentation logo registry. */
  formats?: readonly {
    /** Format identifier in the shared logo registry. */
    slug: string;
    /** Documentation route for this format. */
    to: string;
  }[];
}) {
  return (
    <article className={styles.tile}>
      {children}
      {formats.length > 0 && (
        <div className={styles.logos}>
          {formats.map(format => (
            <Link key={format.slug} to={format.to} className={styles.logoLink}>
              <FormatLogo slug={format.slug} />
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
