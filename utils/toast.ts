import { ToastType } from 'react-native-toast-notifications';

let toastRef: ToastType | null = null;

export const setToastRef = (ref: ToastType) => {
  toastRef = ref;
};

export const showToast = (message: string, type: 'normal' | 'success' | 'danger' | 'warning' = 'success') => {
  if (toastRef) {
    toastRef.show(message, {
      type,
      placement: 'top',
      duration: 3000,
      animationType: 'slide-in',
    });
  }
};

export const showSuccessToast = (message: string) => {
  showToast(message, 'success');
};

export const showErrorToast = (message: string) => {
  showToast(message, 'danger');
};

export const showWarningToast = (message: string) => {
  showToast(message, 'warning');
};

export const showInfoToast = (message: string) => {
  showToast(message, 'normal');
};
