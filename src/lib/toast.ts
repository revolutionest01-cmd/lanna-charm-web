// Compatibility layer - redirects toast calls to sweetAlert
import sweetAlert from './sweetAlert';

export const toast = {
  success: sweetAlert.success,
  error: sweetAlert.error,
  warning: sweetAlert.warning,
  info: sweetAlert.info,
};

export default toast;
