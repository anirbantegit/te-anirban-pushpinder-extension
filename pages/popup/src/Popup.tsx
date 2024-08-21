import { ThemeProvider } from '@mui/material/styles';
import { NextUIProvider } from '@nextui-org/react';
import { theme } from '@src/styles/theme';
import { Dashboard } from '@src/pages/Dashboard';
import { PopupLayout } from '@src/components/layout/PopupLayout';

import '@src/styles/Popup.css';

const Popup = () => {
  return (
    <ThemeProvider theme={theme}>
      <NextUIProvider>
        <PopupLayout>
          <Dashboard />
        </PopupLayout>
      </NextUIProvider>
    </ThemeProvider>
  );
};

export default Popup;
