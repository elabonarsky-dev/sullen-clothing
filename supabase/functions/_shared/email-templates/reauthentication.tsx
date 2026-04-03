/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-badge-logo.png'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Sullen Clothing verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt="Sullen Art Collective" width="80" height="80" style={logo} />
        </Section>
        <Heading style={h1}>VERIFY YOUR IDENTITY</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={divider} />
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Barlow', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '20px' }
const logo = { display: 'inline-block' as const }
const h1 = {
  fontFamily: "'Oswald', Arial, sans-serif",
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#0d0d0d',
  textAlign: 'center' as const,
  letterSpacing: '2px',
  margin: '0 0 20px',
  textTransform: 'uppercase' as const,
}
const text = {
  fontSize: '15px',
  color: '#3a3a3a',
  lineHeight: '1.6',
  margin: '0 0 18px',
}
const codeStyle = {
  fontFamily: "'Oswald', Courier, monospace",
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#0d0d0d',
  textAlign: 'center' as const,
  letterSpacing: '6px',
  margin: '10px 0 30px',
  backgroundColor: '#f5f5f5',
  padding: '16px',
  borderRadius: '4px',
}
const divider = { borderTop: '1px solid #e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '0', lineHeight: '1.5' }
