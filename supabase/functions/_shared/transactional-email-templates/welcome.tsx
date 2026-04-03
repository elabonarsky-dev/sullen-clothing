/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Section, Hr, Row, Column, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Sullen Clothing"
const SITE_URL = "https://www.sullenclothing.com"
const LOGO_WHITE_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-boh-logo.png'

interface WelcomeProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeProps) => {
  const firstName = name?.split(' ')[0]
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to the Sullen Family</Preview>
      <Body style={main}>
        {/* ═══ COMPACT DARK HERO HEADER ═══ */}
        <Section style={heroSection}>
          <Container style={heroContainer}>
            <Row>
              <Column style={heroLogoCol}>
                <Img src={LOGO_WHITE_URL} alt="Sullen Art Collective" width="80" height="80" style={heroLogo} />
              </Column>
              <Column style={heroTextCol}>
                <Heading style={heroHeading}>WELCOME TO THE FAMILY</Heading>
                <Text style={heroSubhead}>
                  {firstName ? `${firstName}, you're officially one of us.` : "You're officially one of us."}
                </Text>
              </Column>
            </Row>
          </Container>
        </Section>

        <Container style={container}>
          {/* ═══ PERKS CARD ═══ */}
          <Section style={perksCard}>
            <Text style={sectionLabel}>WHAT YOU UNLOCK</Text>
            <Text style={perkItem}>✦ Earn <strong style={{ color: '#d4940a' }}>Skull Points</strong> on every purchase</Text>
            <Text style={perkItem}>✦ Early access to exclusive drops</Text>
            <Text style={perkItem}>✦ Unlock The Vault as you level up</Text>
          </Section>

          {/* ═══ BONUS POINTS CARD ═══ */}
          <Section style={pointsCard}>
            <Text style={pointsEyebrow}>SIGNUP BONUS</Text>
            <Text style={pointsAmount}>+50</Text>
            <Text style={pointsSubtext}>Skull Points added to your account instantly</Text>
          </Section>

          {/* ═══ SHOP CTA ═══ */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={SITE_URL}>
              START SHOPPING
            </Button>
          </Section>

          {/* ═══ FOOTER ═══ */}
          <Hr style={footerDivider} />
          <Text style={supportText}>
            Questions? Hit us at{' '}
            <Link href="mailto:questions@sullenclothing.com" style={supportLink}>
              questions@sullenclothing.com
            </Link>{' '}
            or call <Link href="tel:+15622961894" style={supportLink}>562-296-1894</Link>
          </Text>
          <Section style={brandFooter}>
            <Link href={SITE_URL} style={brandLink}>www.sullenclothing.com</Link>
            <Text style={brandAddress}>
              Sullen Art Co. · 1779 Apollo Court · Seal Beach, CA 90740
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to the Sullen Family 🤘',
  displayName: 'Welcome email',
  previewData: { name: 'Jake' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f4f4f4', fontFamily: "'Barlow', 'Helvetica Neue', Arial, sans-serif" }
const heroSection = { backgroundColor: '#0d0d0d', padding: '0', width: '100%' as const }
const heroContainer = { padding: '24px 30px', maxWidth: '560px', margin: '0 auto' }
const heroLogoCol = { width: '80px', verticalAlign: 'middle' as const }
const heroLogo = { display: 'block' as const }
const heroTextCol = { verticalAlign: 'middle' as const, paddingLeft: '20px' }
const heroHeading = {
  fontSize: '24px', fontWeight: '700' as const, fontFamily: "'Oswald', Arial, sans-serif",
  color: '#d4940a', letterSpacing: '0.2em', margin: '0 0 4px', textAlign: 'left' as const,
}
const heroSubhead = {
  fontSize: '14px', color: '#cccccc', fontFamily: "'Barlow', Arial, sans-serif",
  margin: '0', textAlign: 'left' as const, letterSpacing: '0.02em', lineHeight: '1.4',
}
const container = { padding: '0 16px 30px', maxWidth: '560px', margin: '0 auto' }
const sectionLabel = {
  fontSize: '11px', fontFamily: "'Oswald', Arial, sans-serif", color: '#999999',
  letterSpacing: '0.2em', margin: '0 0 14px', textAlign: 'left' as const,
}
const perksCard = {
  backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px',
  margin: '24px 0 16px', border: '1px solid #e8e8e8',
}
const perkItem = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 8px' }
const pointsCard = {
  backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '24px 20px',
  margin: '0 0 24px', textAlign: 'center' as const, border: '1px solid #2a2a2a',
}
const pointsEyebrow = {
  fontSize: '11px', fontFamily: "'Oswald', Arial, sans-serif", color: '#888888',
  letterSpacing: '0.2em', margin: '0 0 4px', textAlign: 'center' as const,
}
const pointsAmount = {
  fontSize: '40px', fontWeight: '700' as const, fontFamily: "'Oswald', Arial, sans-serif",
  color: '#d4940a', margin: '0 0 8px', textAlign: 'center' as const, letterSpacing: '0.05em',
}
const pointsSubtext = {
  fontSize: '13px', color: '#777777', margin: '0', textAlign: 'center' as const, lineHeight: '1.4',
}
const ctaSection = { textAlign: 'center' as const, margin: '4px 0 28px' }
const ctaButton = {
  backgroundColor: '#d4940a', color: '#0d0d0d', fontSize: '14px',
  fontFamily: "'Oswald', Arial, sans-serif", fontWeight: '700' as const,
  letterSpacing: '0.15em', borderRadius: '6px', padding: '16px 36px',
  textDecoration: 'none', display: 'inline-block' as const,
}
const footerDivider = { borderColor: '#e0e0e0', margin: '0 0 20px' }
const supportText = {
  fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0 0 24px',
  textAlign: 'center' as const,
}
const supportLink = { color: '#d4940a', textDecoration: 'none' }
const brandFooter = { textAlign: 'center' as const, margin: '0 0 8px' }
const brandLink = {
  fontSize: '13px', color: '#0d0d0d', fontWeight: '600' as const,
  textDecoration: 'none', fontFamily: "'Oswald', Arial, sans-serif",
  letterSpacing: '0.05em',
}
const brandAddress = { fontSize: '11px', color: '#aaaaaa', margin: '6px 0 0', lineHeight: '1.4' }
