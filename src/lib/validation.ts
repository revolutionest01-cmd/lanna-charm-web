import { z } from 'zod';

export const createAuthValidation = (language: 'th' | 'en' | 'zh') => {
  return {
    email: z
      .string()
      .trim()
      .email({
        message: language === 'th' ? 'รูปแบบอีเมลไม่ถูกต้อง' : language === 'zh' ? '电子邮件格式无效' : 'Invalid email address',
      })
      .max(255, {
        message:
          language === 'th'
            ? 'อีเมลต้องไม่เกิน 255 ตัวอักษร'
            : language === 'zh'
            ? '电子邮件不得超过255个字符'
            : 'Email must be less than 255 characters',
      }),
    password: z
      .string()
      .min(6, {
        message:
          language === 'th'
            ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
            : language === 'zh'
            ? '密码至少需要6个字符'
            : 'Password must be at least 6 characters',
      })
      .max(100, {
        message:
          language === 'th'
            ? 'รหัสผ่านต้องไม่เกิน 100 ตัวอักษร'
            : language === 'zh'
            ? '密码不得超过100个字符'
            : 'Password must be less than 100 characters',
      }),
    name: z
      .string()
      .trim()
      .min(1, {
        message: language === 'th' ? 'กรุณากรอกชื่อ' : language === 'zh' ? '请输入您的姓名' : 'Please enter your name',
      })
      .max(100, {
        message:
          language === 'th'
            ? 'ชื่อต้องไม่เกิน 100 ตัวอักษร'
            : language === 'zh'
            ? '姓名不得超过100个字符'
            : 'Name must be less than 100 characters',
      }),
  };
};

export const createTopicValidation = (language: 'th' | 'en' | 'zh') => {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, {
        message: language === 'th' ? 'กรุณากรอกหัวข้อ' : language === 'zh' ? '请输入标题' : 'Please enter a title',
      })
      .max(200, {
        message:
          language === 'th'
            ? 'หัวข้อต้องไม่เกิน 200 ตัวอักษร'
            : language === 'zh'
            ? '标题不得超过200个字符'
            : 'Title must be less than 200 characters',
      }),
    content: z
      .string()
      .trim()
      .min(1, {
        message: language === 'th' ? 'กรุณากรอกเนื้อหา' : language === 'zh' ? '请输入内容' : 'Please enter content',
      })
      .max(2000, {
        message:
          language === 'th'
            ? 'เนื้อหาต้องไม่เกิน 2000 ตัวอักษร'
            : language === 'zh'
            ? '内容不得超过2000个字符'
            : 'Content must be less than 2000 characters',
      }),
  });
};
