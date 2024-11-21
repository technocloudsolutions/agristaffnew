import { toast as hotToast } from 'react-hot-toast';

export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  info: (message: string) => hotToast(message, {
    icon: 'ℹ️',
    duration: 2000,
  }),
  warning: (message: string) => hotToast(message, {
    icon: '⚠️',
    duration: 3000,
  }),
}; 