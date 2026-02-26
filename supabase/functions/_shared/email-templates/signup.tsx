/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
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
}: SignupEmailProps) => (
  <Html lang="th" dir="ltr">
    <Head />
    <Preview>ยืนยันอีเมลสำหรับ {siteName}</Preview>
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
          กรุณายืนยันอีเมลของคุณ (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) โดยกดปุ่มด้านล่าง:
        </Text>
        <Button style={button} href={confirmationUrl}>
          ยืนยันอีเมล
        </Button>
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
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(20, 15%, 15%)',
  color: 'hsl(30, 20%, 96%)',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
