/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  token: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  token,
}: SignupEmailProps) => (
  <Html lang="th" dir="ltr">
    <Head />
    <Preview>รหัสยืนยันอีเมลสำหรับ {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>ยืนยันอีเมลของคุณ</Heading>
        <Text style={text}>
          ขอบคุณที่สมัครสมาชิก <strong>{siteName}</strong>!
        </Text>
        <Text style={text}>
          กรุณากรอกรหัส OTP 6 หลักด้านล่างเพื่อยืนยันอีเมล ({recipient}):
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={text}>
          รหัสนี้จะหมดอายุใน 60 นาที
        </Text>
        <Text style={footer}>
          หากคุณไม่ได้สมัครสมาชิก กรุณาเพิกเฉยอีเมลนี้
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Thai', Arial, sans-serif" }
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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: 'hsl(20, 15%, 15%)',
  textAlign: 'center' as const,
  letterSpacing: '8px',
  margin: '10px 0 30px',
  padding: '16px',
  backgroundColor: 'hsl(30, 18%, 91%)',
  borderRadius: '8px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
