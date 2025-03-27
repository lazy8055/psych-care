import { DefaultTheme } from 'react-native-paper';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#5C6BC0', // Indigo
    accent: '#26A69A',  // Teal
    background: '#F5F7FA',
    surface: '#FFFFFF',
    text: '#333333',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#FFA000',
    info: '#1976D2',
    disabled: '#BDBDBD',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  roundness: 8,
  animation: {
    scale: 1.0,
  },
};

export default theme;