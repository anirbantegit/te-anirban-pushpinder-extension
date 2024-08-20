import { ThemeProvider } from '@mui/material/styles';
import { NextUIProvider } from '@nextui-org/react';
import { theme } from '@src/styles/theme';
import { Register } from '@src/pages/Register';
import { PopupLayout } from '@src/components/layout/PopupLayout';

import '@src/styles/Popup.css';

const Popup = () => {
  return (
    <ThemeProvider theme={theme}>
      <NextUIProvider>
        <PopupLayout>
          <Register />
        </PopupLayout>
      </NextUIProvider>
    </ThemeProvider>
  );
};

export default Popup;
