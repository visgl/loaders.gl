import React from 'react';
import styled from 'styled-components';
import Loader from '../../icons/loader.png';

const Spinner = styled.img`
  background: transparent;
  animation: rotation 2s infinite linear;

  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-359deg);
    }
  }
`;

export function LoadingSpinner() {
  return <Spinner data-testid="loading-spinner" alt="Loader" src={Loader} />;
}
