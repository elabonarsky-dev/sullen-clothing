/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to the Sullen Family — Confirm your email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt="Sullen Art Collective" width="80" height="80" style={logo} />
        </Section>
        <Heading style={h1}>WELCOME TO THE FAMILY</Heading>
        <Text style={text}>
          You're one step away from joining the Sullen Art Collective.
        </Text>
        <Text style={text}>
          Confirm your email address to unlock Skull Points, early access to drops,
          and exclusive Vault rewards.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            VERIFY EMAIL
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          If you didn't create an account with Sullen Clothing, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  backgroundColor: '#0d0d0d',
  color: '#d4a017',
  fontFamily: "'Oswald', Arial, sans-serif",
  fontSize: '14px',
  fontWeight: '600' as const,
  letterSpacing: '1.5px',
  borderRadius: '4px',
  padding: '14px 32px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
}
const divider = { borderTop: '1px solid #e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#8c8c8c', margin: '0', lineHeight: '1.5' }
