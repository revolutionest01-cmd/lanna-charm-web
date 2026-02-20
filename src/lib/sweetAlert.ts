import Swal from 'sweetalert2';

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
        confirmButtonColor: '#8B6F47',
      });
    },

    error: (title: string, text?: string) => {
      return Swal.fire({
        icon: 'error',
        title,
        text,
        confirmButtonColor: '#8B6F47',
      });
    },

    warning: (title: string, text?: string) => {
      return Swal.fire({
        icon: 'warning',
        title,
        text,
        confirmButtonColor: '#8B6F47',
      });
    },

    info: (title: string, text?: string) => {
      return Swal.fire({
        icon: 'info',
        title,
        text,
        confirmButtonColor: '#8B6F47',
      });
    },

    confirm: async (title: string, text?: string, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', useHtml = false) => {
      const result = await Swal.fire({
        icon: 'question',
        title,
        [useHtml ? 'html' : 'text']: text,
        showCancelButton: true,
        confirmButtonColor: '#8B6F47',
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: (dialog) => {
          // Ensure buttons are clickable
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
          title: '!text-[hsl(12,55%,50%)]',
          htmlContainer: '!text-[hsl(12,55%,50%)]',
          confirmButton: '!pointer-events-auto',
          cancelButton: '!pointer-events-auto',
        },
        titleColor: 'hsl(12, 55%, 50%)',
        didRender: (dialog) => {
          const content = dialog.querySelector('.swal2-html-container');
          if (content) {
            content.style.color = 'hsl(12, 55%, 50%)';
          }
        },
      });
      return result.isConfirmed;
    },

    confirmDelete: async (title = 'ยืนยันการลบ?', text = 'คุณต้องการลบรายการนี้หรือไม่?') => {
      const result = await Swal.fire({
        icon: 'warning',
        title,
        text,
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
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
};

export default sweetAlert;
