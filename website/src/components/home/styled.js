import styled from 'styled-components';
import {isMobile} from '../common';

export const Banner = styled.section`
  background: linear-gradient(135deg, #0c1a29 0%, #163b55 52%, #126f92 100%);
  color: var(--ifm-color-white);
  height: 460px;
  isolation: isolate;
  position: relative;
  z-index: 0;

  &::after {
    background: linear-gradient(
      90deg,
      rgba(10, 20, 32, 0.92) 0%,
      rgba(10, 20, 32, 0.58) 46%,
      rgba(10, 20, 32, 0.2) 100%
    );
    content: '';
    inset: 0;
    pointer-events: none;
    position: absolute;
    z-index: 1;
  }

  ${isMobile} {
    height: 480px;
  }
`;

export const Container = styled.div`
  position: relative;
  padding: 2rem;
  max-width: 80rem;
  width: 100%;
  height: 100%;
  margin: 0;
`;

export const BannerContainer = styled(Container)`
  position: absolute;
  bottom: 42px;
  height: auto;
  max-width: 780px;
  padding-left: 4rem;
  pointer-events: none;
  z-index: 2;

  @media screen and (max-width: 640px) {
    bottom: 28px;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
`;

export const HeroExampleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
`;

export const Section = styled.section`
  &:nth-child(2n + 1) {
    background: var(--ifm-color-gray-300);
  }
`;

export const ProjectName = styled.h1`
  color: var(--ifm-color-white);
  font-size: clamp(3.8rem, 10vw, 8rem);
  line-height: 0.85;
  text-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
  letter-spacing: -0.08em;
  font-weight: 700;
  margin: 0;
  margin-bottom: 22px;
`;

export const TagLine = styled.p`
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.1rem;
  line-height: 1.55;
  margin: 0;
  max-width: 510px;
  text-shadow: none;
`;

export const GetStartedLink = styled.a`
  align-items: center;
  background: var(--ifm-color-primary);
  border: 1px solid var(--ifm-color-primary);
  border-radius: 999px;
  color: #ffffff;
  display: inline-flex;
  font-size: 13px;
  font-weight: bold;
  gap: 10px;
  justify-content: center;
  letter-spacing: 0.04em;
  line-height: 1;
  margin: 24px 0 0;
  min-height: 44px;
  padding: 0 20px;
  pointer-events: all;
  position: relative;
  text-decoration: none;
  text-shadow: none;
  width: fit-content;
  z-index: 1;
  transition:
    background-color 180ms ease-in,
    border-color 180ms ease-in,
    color 180ms ease-in,
    transform 180ms ease-in;

  && {
    color: #ffffff;
  }

  &:visited {
    color: #ffffff;
  }
  &:active {
    color: #ffffff;
  }
  &:hover {
    color: #ffffff;
    background-color: transparent;
    border-color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transform: translateY(-2px);
  }

  > span {
    color: #ffffff;
    display: block;
    position: relative;
  }
`;
