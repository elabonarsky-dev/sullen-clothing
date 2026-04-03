/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Section, Hr, Row, Column, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = "https://www.sullenclothing.com"
const LOGO_WHITE_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-boh-logo.png'

interface UptimeAlertProps {
  site_url?: string
  status_code?: number | null
  error_message?: string
  checked_at?: string
}

const UptimeAlertEmail = ({ site_url, status_code, error_message, checked_at }: UptimeAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>⚠️ SITE DOWN — sullenclothing.com is unreachable</Preview>
    <Body style={main}>
      <Section style={heroSection}>
        <Container style={heroContainer}>
          <Row>
            <Column style={heroLogoCol}>
              <Img src={LOGO_WHITE_URL} alt="Sullen Art Collective" width="80" height="80" style={heroLogo} />
            </Column>
            <Column style={heroTextCol}>
              <Heading style={heroHeadingRed}>⚠️ SITE DOWN ALERT</Heading>
              <Text style={heroSubhead}>
                sullenclothing.com is currently unreachable.
              </Text>
            </Column>
          </Row>
        </Container>
      </Section>

      <Container style={container}>
        <Section style={detailsCard}>
          <Text style={sectionLabel}>INCIDENT DETAILS</Text>
          <Row style={detailRow}>
            <Column style={detailLabel}>Status</Column>
            <Column style={detailValueRed}>{status_code ? `HTTP ${status_code}` : 'No response'}</Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>Error</Column>
            <Column style={detailValue}>{error_message || 'Unknown'}</Column>
          </Row>
          <Row style={detailRow}>
            <Column style={detailLabel}>Checked at</Column>
            <Column style={detailValue}>
              {checked_at ? new Date(checked_at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) : 'N/A'} PT
            </Column>
          </Row>
        </Section>

        <Text style={bodyText}>
          Please check the site and dashboard immediately. This alert will not repeat for 30 minutes.
        </Text>

        <Hr style={footerDivider} />
        <Section style={brandFooter}>
          <Text style={brandAddress}>Sullen Uptime Monitor</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: UptimeAlertEmail,
  subject: '⚠️ SITE DOWN — sullenclothing.com',
  displayName: 'Uptime Alert',
  previewData: {
    site_url: 'https://sullenclothing.com',
    status_code: 503,
    error_message: 'Service Unavailable',
    checked_at: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#f4f4f4', fontFamily: "'Barlow', 'Helvetica Neue', Arial, sans-serif" }
const heroSection = { backgroundColor: '#0d0d0d', padding: '0', width: '100%' as const }
const heroContainer = { padding: '24px 30px', maxWidth: '560px', margin: '0 auto' }
const heroLogoCol = { width: '80px', verticalAlign: 'middle' as const }
const heroLogo = { display: 'block' as const }
const heroTextCol = { verticalAlign: 'middle' as const, paddingLeft: '20px' }
const heroHeadingRed = {
  fontSize: '24px', fontWeight: '700' as const, fontFamily: "'Oswald', Arial, sans-serif",
  color: '#cc0000', letterSpacing: '0.2em', margin: '0 0 4px', textAlign: 'left' as const,
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
const detailsCard = {
  backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px',
  margin: '24px 0', border: '1px solid #e8e8e8',
}
const detailRow = { margin: '0' }
const detailLabel = { fontSize: '13px', color: '#777777', textAlign: 'left' as const, padding: '4px 0', fontFamily: "'Oswald', Arial, sans-serif", letterSpacing: '0.08em' }
const detailValue = { fontSize: '14px', color: '#333333', textAlign: 'right' as const, padding: '4px 0' }
const detailValueRed = { fontSize: '14px', color: '#cc0000', textAlign: 'right' as const, padding: '4px 0', fontWeight: '600' as const }
const bodyText = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 24px', padding: '0 4px' }
const footerDivider = { borderColor: '#e0e0e0', margin: '0 0 20px' }
const brandFooter = { textAlign: 'center' as const, margin: '0 0 8px' }
const brandAddress = { fontSize: '11px', color: '#aaaaaa', margin: '6px 0 0', lineHeight: '1.4' }
