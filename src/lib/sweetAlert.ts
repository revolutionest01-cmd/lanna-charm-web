import Swal from 'sweetalert2';

const THEME_PRIMARY = 'hsl(var(--primary))';
const THEME_MUTED = 'hsl(var(--muted-foreground))';
const THEME_FOREGROUND = 'hsl(var(--foreground))';
const THEME_DESTRUCTIVE = 'hsl(var(--destructive))';

// SweetAlert2 utility functions with Thai-styled theme
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
  customClass: {
    popup: 'colored-toast'
  }
});

export const sweetAlert = {
  // Toast notifications (small, non-blocking)
  success: (message: string, title?: string) => {
    return Toast.fire({
      icon: 'success',
      title: title || message,
      text: title ? message : undefined,
    });
  },

  error: (message: string, title?: string) => {
    return Toast.fire({
      icon: 'error',
      title: title || message,
      text: title ? message : undefined,
    });
  },

  warning: (message: string, title?: string) => {
    return Toast.fire({
      icon: 'warning',
      title: title || message,
      text: title ? message : undefined,
    });
  },

  info: (message: string, title?: string) => {
    return Toast.fire({
      icon: 'info',
      title: title || message,
      text: title ? message : undefined,
    });
  },

  // Full modal alerts
  modal: {
    success: (title: string, text?: string) => {
      return Swal.fire({
        icon: 'success',
        title,
        text,
        confirmButtonColor: THEME_PRIMARY,
      });
    },

    error: (title: string, text?: string) => {
      return Swal.fire({
        icon: 'error',
        title,
        text,
        confirmButtonColor: THEME_PRIMARY,
      });
    },

    warning: (title: string, text?: string) => {
      return Swal.fire({
        icon: 'warning',
        title,
        text,
        confirmButtonColor: THEME_PRIMARY,
      });
    },

    info: (title: string, text?: string) => {
      return Swal.fire({
        icon: 'info',
        title,
        text,
        confirmButtonColor: THEME_PRIMARY,
      });
    },

    confirm: async (title: string, text?: string, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', useHtml = false) => {
      const options: Record<string, any> = {
        icon: 'question',
        title,
        showCancelButton: true,
        confirmButtonColor: THEME_PRIMARY,
        cancelButtonColor: THEME_MUTED,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: (dialog: HTMLElement) => {
          const confirmBtn = dialog.querySelector('.swal2-confirm') as HTMLElement;
          const cancelBtn = dialog.querySelector('.swal2-cancel') as HTMLElement;
          const backdrop = dialog.parentElement?.querySelector('.swal2-backdrop') as HTMLElement;
          if (confirmBtn) {
            confirmBtn.style.pointerEvents = 'auto';
            confirmBtn.style.cursor = 'pointer';
          }
          if (cancelBtn) {
            cancelBtn.style.pointerEvents = 'auto';
            cancelBtn.style.cursor = 'pointer';
          }
          if (backdrop) {
            backdrop.style.pointerEvents = 'none';
          }
        },
        customClass: {
          container: '!z-[99999]',
          popup: '!z-[99999]',
          backdrop: '!z-[99998]',
          title: '!text-[hsl(var(--foreground))]',
          htmlContainer: '!text-[hsl(var(--foreground))]',
          confirmButton: '!pointer-events-auto',
          cancelButton: '!pointer-events-auto',
        },
        titleColor: THEME_FOREGROUND,
        didRender: (dialog: HTMLElement) => {
          const content = dialog.querySelector('.swal2-html-container') as HTMLElement;
          if (content) {
            content.style.color = THEME_FOREGROUND;
          }
        },
      };
      if (useHtml) {
        options.html = text;
      } else {
        options.text = text;
      }
      const result = await Swal.fire(options);
      return result.isConfirmed;
    },

    confirmDelete: async (title = 'ยืนยันการลบ?', text = 'คุณต้องการลบรายการนี้หรือไม่?') => {
      const result = await Swal.fire({
        icon: 'warning',
        title,
        text,
        showCancelButton: true,
        confirmButtonColor: THEME_DESTRUCTIVE,
        cancelButtonColor: THEME_MUTED,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
      });
      return result.isConfirmed;
    },
  },

  // Loading indicator
  loading: (title = 'กำลังดำเนินการ...') => {
    Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  close: () => {
    Swal.close();
  },

  // Direct Swal.fire wrapper for custom alerts
  fire: (options: any) => {
    return Swal.fire(options);
  },
};

export default sweetAlert;
