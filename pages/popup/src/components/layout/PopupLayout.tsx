import React, { ReactNode } from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
    padding: 1rem;
    background-color: #f0f0f0;
    min-height: 100%;
`;

interface PopupLayoutProps {
  children: ReactNode;
}

export const PopupLayout: React.FC<PopupLayoutProps> = ({ children }) => {
  return <Container>{children}</Container>;
};
