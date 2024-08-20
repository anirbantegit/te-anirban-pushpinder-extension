import React from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
  padding: 1rem;
  background-color: #f0f0f0;
  min-height: 100%;
`;

export const PopupLayout: React.FC = ({ children }) => {
  return <Container>{children}</Container>;
};
