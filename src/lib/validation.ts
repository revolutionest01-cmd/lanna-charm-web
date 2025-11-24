import { z } from 'zod';

export const createAuthValidation = (language: 'th' | 'en') => {
  return {
    email: z
      .string()
      .trim()
      .email({
        message: language === 'th' ? 'รูปแบบอีเมลไม่ถูกต้อง' : 'Invalid email address',
      })
      .max(255, {
        message:
          language === 'th'
            ? 'อีเมลต้องไม่เกิน 255 ตัวอักษร'
            : 'Email must be less than 255 characters',
      }),
    password: z
      .string()
      .min(6, {
        message:
          language === 'th'
            ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
            : 'Password must be at least 6 characters',
      })
      .max(100, {
        message:
          language === 'th'
            ? 'รหัสผ่านต้องไม่เกิน 100 ตัวอักษร'
            : 'Password must be less than 100 characters',
      }),
    name: z
      .string()
      .trim()
      .min(1, {
        message: language === 'th' ? 'กรุณากรอกชื่อ' : 'Please enter your name',
      })
      .max(100, {
        message:
          language === 'th'
            ? 'ชื่อต้องไม่เกิน 100 ตัวอักษร'
            : 'Name must be less than 100 characters',
      }),
  };
};

export const createTopicValidation = (language: 'th' | 'en') => {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, {
        message: language === 'th' ? 'กรุณากรอกหัวข้อ' : 'Please enter a title',
      })
      .max(200, {
        message:
          language === 'th'
            ? 'หัวข้อต้องไม่เกิน 200 ตัวอักษร'
            : 'Title must be less than 200 characters',
      }),
    content: z
      .string()
      .trim()
      .min(1, {
        message: language === 'th' ? 'กรุณากรอกเนื้อหา' : 'Please enter content',
      })
      .max(2000, {
        message:
          language === 'th'
            ? 'เนื้อหาต้องไม่เกิน 2000 ตัวอักษร'
            : 'Content must be less than 2000 characters',
      }),
  });
};
