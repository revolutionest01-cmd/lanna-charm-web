/**
 * Validation utilities for booking form fields
 */

/**
 * Validate guests count - only digits 0-9, max 2 digits
 */
export const validateGuests = (value: string): boolean => {
  const regex = /^\d{1,2}$/;
  return regex.test(value) || value === '';
};

/**
 * Sanitize guests input - only allow digits, max 2 digits
 */
export const sanitizeGuests = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 2);
};

/**
 * Validate name - Thai/English letters and spaces only
 */
export const validateName = (value: string): boolean => {
  // Thai: \u0E00-\u0E7F, English: a-zA-Z, spaces allowed
  const regex = /^[ก-๙a-zA-Z\s]*$/;
  return regex.test(value);
};

/**
 * Sanitize name - remove invalid characters
 */
export const sanitizeName = (value: string): string => {
  return value.replace(/[^ก-๙a-zA-Z\s]/g, '');
};

/**
 * Validate email format
 */
export const validateEmail = (value: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value);
};

/**
 * Validate phone number - only digits, max 10 digits
 */
export const validatePhone = (value: string): boolean => {
  const regex = /^\d{1,10}$/;
  return regex.test(value) || value === '';
};

/**
 * Sanitize phone - only allow digits, max 10
 */
export const sanitizePhone = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 10);
};

/**
 * Validate all fields before submission
 */
export const validateBookingForm = (
  checkIn: Date | undefined,
  checkOut: Date | undefined,
  guests: string,
  name: string,
  email: string,
  phone: string
): { valid: boolean; error?: string } => {
  // Check dates
  if (!checkIn || !checkOut) {
    return { valid: false, error: 'dates_required' };
  }

  if (checkOut <= checkIn) {
    return { valid: false, error: 'invalid_dates' };
  }

  // Check guests
  if (!guests || !validateGuests(guests)) {
    return { valid: false, error: 'invalid_guests' };
  }

  const guestCount = parseInt(guests, 10);
  if (guestCount < 1) {
    return { valid: false, error: 'guests_minimum' };
  }

  // Check name
  if (!name.trim()) {
    return { valid: false, error: 'name_required' };
  }

  if (!validateName(name)) {
    return { valid: false, error: 'invalid_name' };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: 'name_too_short' };
  }

  // Check email
  if (!email.trim()) {
    return { valid: false, error: 'email_required' };
  }

  if (!validateEmail(email)) {
    return { valid: false, error: 'invalid_email' };
  }

  // Check phone
  if (!phone) {
    return { valid: false, error: 'phone_required' };
  }

  if (!validatePhone(phone)) {
    return { valid: false, error: 'invalid_phone' };
  }

  if (phone.length < 7) {
    return { valid: false, error: 'phone_too_short' };
  }

  return { valid: true };
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (errorKey: string, language: 'th' | 'en' | 'zh'): string => {
  const messages: Record<string, Record<string, string>> = {
    dates_required: {
      th: 'กรุณาเลือกวันเช็คอินและวันเช็คเอาท์',
      en: 'Please select check-in and check-out dates',
      zh: '请选择入住和退房日期',
    },
    invalid_dates: {
      th: 'วันเช็คเอาท์ต้องมากกว่าวันเช็คอิน',
      en: 'Check-out date must be after check-in date',
      zh: '退房日期必须晚于入住日期',
    },
    invalid_guests: {
      th: 'จำนวนผู้เข้าพักต้องเป็นตัวเลข 1-99',
      en: 'Number of guests must be between 1-99',
      zh: '客人数量必须为 1-99 之间的数字',
    },
    guests_minimum: {
      th: 'จำนวนผู้เข้าพักต้องอย่างน้อย 1 คน',
      en: 'At least 1 guest is required',
      zh: '至少需要 1 位客人',
    },
    name_required: {
      th: 'กรุณากรอกชื่อ-นามสกุล',
      en: 'Please enter your name',
      zh: '请输入您的名字',
    },
    invalid_name: {
      th: 'ชื่อ-นามสกุล ต้องเป็นตัวอักษร (ไทย/อังกฤษ) เท่านั้น',
      en: 'Name must contain only letters and spaces',
      zh: '名字只能包含字母和空格',
    },
    name_too_short: {
      th: 'ชื่อ-นามสกุล ต้องมีอย่างน้อย 2 ตัวอักษร',
      en: 'Name must be at least 2 characters',
      zh: '名字至少需要 2 个字符',
    },
    email_required: {
      th: 'กรุณากรอกอีเมล',
      en: 'Please enter your email',
      zh: '请输入您的电子邮件',
    },
    invalid_email: {
      th: 'รูปแบบอีเมลไม่ถูกต้อง (เช่น test@email.com)',
      en: 'Invalid email format (e.g., test@email.com)',
      zh: '电子邮件格式不正确（如 test@email.com）',
    },
    phone_required: {
      th: 'กรุณากรอกเบอร์โทรศัพท์',
      en: 'Please enter your phone number',
      zh: '请输入您的电话号码',
    },
    invalid_phone: {
      th: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 7-10 หลัก',
      en: 'Phone number must be 7-10 digits',
      zh: '电话号码必须为 7-10 位数字',
    },
    phone_too_short: {
      th: 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 7 หลัก',
      en: 'Phone number must be at least 7 digits',
      zh: '电话号码至少需要 7 位',
    },
  };

  return messages[errorKey]?.[language] || 'Invalid input';
};
