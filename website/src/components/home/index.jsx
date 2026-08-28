import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  Banner,
  BannerContainer,
  HeroExampleContainer,
  ProjectName,
  TagLine,
  GetStartedLink
} from './styled';

export default function renderPage({HeroExample, children}) {
  const {siteConfig} = useDocusaurusContext();

  // Note: The Layout "wrapper" component adds header and footer etc
  return (
    <>
      <Banner >
        <HeroExampleContainer>{HeroExample && <HeroExample />}</HeroExampleContainer>
        <BannerContainer>
          <ProjectName>{siteConfig.title}</ProjectName>
          <TagLine>{siteConfig.tagline}</TagLine>
          <GetStartedLink href="./docs/developer-guide/get-started">
            <span>Get started</span>
            <span aria-hidden="true">→</span>
          </GetStartedLink>
        </BannerContainer>
      </Banner>
      {children}
    </>
  );
}
