/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Section, Hr, Row, Column, Link, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Sullen Clothing"
const SITE_URL = "https://www.sullenclothing.com"
const LOGO_WHITE_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-boh-logo.png'

interface ReturnApprovedProps {
  orderName?: string
  items?: Array<{ title: string; variant?: string; resolution?: string }>
  reason?: string
  refundAmount?: string
  returnLabelUrl?: string | null
}

const ReturnApprovedEmail = ({ orderName, items, reason, refundAmount, returnLabelUrl }: ReturnApprovedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your return for order {orderName || 'your order'} has been approved</Preview>
    <Body style={main}>
      {/* ═══ COMPACT DARK HERO HEADER ═══ */}
      <Section style={heroSection}>
        <Container style={heroContainer}>
          <Row>
            <Column style={heroLogoCol}>
              <Img src={LOGO_WHITE_URL} alt="Sullen Art Collective" width="80" height="80" style={heroLogo} />
            </Column>
            <Column style={heroTextCol}>
              <Heading style={heroHeading}>RETURN APPROVED</Heading>
              <Text style={heroSubhead}>
                Order {orderName || 'N/A'} — we've got you covered.
              </Text>
            </Column>
          </Row>
        </Container>
      </Section>

      <Container style={container}>
        {/* ═══ ITEMS CARD ═══ */}
        {items && items.length > 0 && (
          <Section style={card}>
            <Text style={sectionLabel}>ITEMS BEING RETURNED</Text>
            {items.map((item, i) => (
              <Text key={i} style={itemText}>
                • {item.title}{item.variant ? ` (${item.variant})` : ''}
                {item.resolution ? ` — ${item.resolution.replace('_', ' ')}` : ''}
              </Text>
            ))}
          </Section>
        )}

        {refundAmount && (
          <Section style={card}>
            <Text style={sectionLabel}>REFUND AMOUNT</Text>
            <Text style={{ ...bodyText, fontSize: '20px', fontWeight: '700', color: '#d4940a' }}>${refundAmount}</Text>
          </Section>
        )}

        {reason && (
          <Section style={card}>
            <Text style={sectionLabel}>REASON</Text>
            <Text style={bodyText}>{reason}</Text>
          </Section>
        )}

        {/* ═══ RETURN LABEL CARD ═══ */}
        {returnLabelUrl && (
          <Section style={labelCard}>
            <Text style={labelLabel}>📦 YOUR PREPAID RETURN LABEL</Text>
            <Text style={labelBody}>
              Click the button below to download your prepaid return shipping label. Print it and attach it to your package.
            </Text>
            <Button href={returnLabelUrl} style={labelButton}>
              DOWNLOAD RETURN LABEL
            </Button>
          </Section>
        )}

        {/* ═══ INSTRUCTIONS CARD ═══ */}
        <Section style={darkCard}>
          <Text style={darkCardLabel}>RETURN INSTRUCTIONS</Text>
          {returnLabelUrl ? (
            <>
              <Text style={stepText}>
                <strong style={{ color: '#d4940a' }}>1.</strong> Download and print the return shipping label above.
              </Text>
              <Text style={stepText}>
                <strong style={{ color: '#d4940a' }}>2.</strong> Pack the item(s) securely in the original packaging if possible.
              </Text>
              <Text style={stepText}>
                <strong style={{ color: '#d4940a' }}>3.</strong> Attach the return shipping label to the outside of the package.
              </Text>
              <Text style={stepText}>
                <strong style={{ color: '#d4940a' }}>4.</strong> Drop off the package at any USPS location.
              </Text>
              <Text style={stepText}>
                <strong style={{ color: '#d4940a' }}>5.</strong> Once we receive and inspect the item(s), we'll process your exchange, store credit, or refund within 3–5 business days.
              </Text>
            </>
          ) : (
            <>
              <Text style={stepText}>
                <strong style={{ color: '#d4940a' }}>1.</strong> You'll receive a separate email from Shopify with your prepaid return shipping label. Check your inbox (and spam).
              </Text>
              <Text style={stepText}>
                <strong style={{ color: '#d4940a' }}>2.</strong> Pack the item(s) securely in the original packaging if possible.
              </Text>
              <Text style={stepText}>
                <strong style={{ color: '#d4940a' }}>3.</strong> Attach the return shipping label to the outside of the package.
              </Text>
              <Text style={stepText}>
                <strong style={{ color: '#d4940a' }}>4.</strong> Drop off the package at any USPS location.
              </Text>
              <Text style={stepText}>
                <strong style={{ color: '#d4940a' }}>5.</strong> Once we receive and inspect the item(s), we'll process your exchange, store credit, or refund within 3–5 business days.
              </Text>
            </>
          )}
        </Section>

        {/* ═══ FOOTER ═══ */}
        <Hr style={footerDivider} />
        <Text style={supportText}>
          Questions about your return? Hit us at{' '}
          <Link href="mailto:support@sullenclothing.com" style={supportLink}>support@sullenclothing.com</Link>{' '}
          or visit our <Link href={`${SITE_URL}/support`} style={supportLink}>Support page</Link>
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

export const template = {
  component: ReturnApprovedEmail,
  subject: (data: Record<string, any>) =>
    `Return Approved — Order ${data.orderName || ''}`.trim(),
  displayName: 'Return approved notification',
  previewData: {
    orderName: 'SUL494109',
    items: [
      { title: '5 Random Tees Standard', variant: 'ASSORTED / L', resolution: 'refund' },
    ],
    reason: 'Size was too small',
    refundAmount: '29.95',
    returnLabelUrl: 'https://example.com/label.pdf',
  },
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
const card = {
  backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px',
  margin: '24px 0 0', border: '1px solid #e8e8e8',
}
const labelCard = {
  backgroundColor: '#0d3d0d', borderRadius: '8px', padding: '24px 20px',
  margin: '24px 0', border: '1px solid #1a5e1a',
}
const labelLabel = {
  fontSize: '13px', fontFamily: "'Oswald', Arial, sans-serif", color: '#ffffff',
  letterSpacing: '0.15em', margin: '0 0 12px', textAlign: 'center' as const,
}
const labelBody = {
  fontSize: '14px', color: '#ccddcc', lineHeight: '1.6', margin: '0 0 20px',
  textAlign: 'center' as const,
}
const labelButton = {
  backgroundColor: '#d4940a', color: '#0d0d0d', fontFamily: "'Oswald', Arial, sans-serif",
  fontSize: '14px', fontWeight: '700' as const, letterSpacing: '0.15em',
  padding: '14px 32px', borderRadius: '4px', textDecoration: 'none',
  display: 'block' as const, textAlign: 'center' as const,
}
const darkCard = {
  backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '24px 20px',
  margin: '24px 0', border: '1px solid #2a2a2a',
}
const darkCardLabel = {
  fontSize: '11px', fontFamily: "'Oswald', Arial, sans-serif", color: '#888888',
  letterSpacing: '0.2em', margin: '0 0 16px', textAlign: 'left' as const,
}
const itemText = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 6px' }
const bodyText = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0' }
const stepText = { fontSize: '14px', color: '#cccccc', lineHeight: '1.6', margin: '0 0 12px' }
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
