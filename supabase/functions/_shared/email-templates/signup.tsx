/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  token,
}: SignupEmailProps) => (
  <Html lang="th" dir="ltr">
    <Head />
    <Preview>รหัสยืนยันตัวตนสำหรับ {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>ยืนยันอีเมลของคุณ</Heading>
        <Text style={text}>
          ขอบคุณที่สมัครสมาชิก{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          กรุณาใช้รหัส OTP 6 หลักด้านล่างเพื่อยืนยันอีเมลของคุณ (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ):
        </Text>
        <Text style={codeStyle}>{token || '------'}</Text>
        <Text style={expireText}>
          รหัสนี้จะหมดอายุภายในไม่กี่นาที
        </Text>
        <Text style={footer}>
          หากคุณไม่ได้สมัครสมาชิก สามารถเพิกเฉยอีเมลนี้ได้
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Sarabun', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(20, 15%, 15%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(20, 10%, 40%)',
  lineHeight: '1.5',
  margin: '0 0 20px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: 'hsl(20, 15%, 15%)',
  textAlign: 'center' as const,
  letterSpacing: '8px',
  margin: '10px 0 20px',
  padding: '16px 0',
  backgroundColor: 'hsl(30, 18%, 91%)',
  borderRadius: '8px',
}
const expireText = {
  fontSize: '13px',
  color: 'hsl(20, 10%, 40%)',
  textAlign: 'center' as const,
  margin: '0 0 25px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
