/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Section, Hr, Row, Column, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Sullen Clothing"
const SITE_URL = "https://www.sullenclothing.com"
const LOGO_WHITE_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-boh-logo.png'

interface ShippingConfirmationProps {
  customerName?: string
  orderName?: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
  items?: Array<{ title: string; quantity?: number; image?: string; variant?: string }>
}

const ShippingConfirmationEmail = ({
  customerName,
  orderName,
  carrier,
  trackingNumber,
  trackingUrl,
  items,
}: ShippingConfirmationProps) => {
  const firstName = customerName?.split(' ')[0]
  const brandedTrackingUrl = orderName
    ? `${SITE_URL}/track?order=${encodeURIComponent(orderName)}`
    : `${SITE_URL}/track`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your order {orderName || ''} has shipped!</Preview>
      <Body style={main}>
        {/* ═══ COMPACT DARK HERO HEADER ═══ */}
        <Section style={heroSection}>
          <Container style={heroContainer}>
            <Row>
              <Column style={heroLogoCol}>
                <Img src={LOGO_WHITE_URL} alt="Sullen Art Collective" width="80" height="80" style={heroLogo} />
              </Column>
              <Column style={heroTextCol}>
                <Heading style={heroHeading}>YOUR ORDER HAS SHIPPED</Heading>
                <Text style={heroSubhead}>
                  {firstName ? `${firstName}, your order is on the way.` : "Your order is on the way."}
                  {orderName ? ` — ${orderName}` : ''}
                </Text>
              </Column>
            </Row>
          </Container>
        </Section>

        <Container style={container}>
          {/* ═══ TRACKING INFO CARD ═══ */}
          {(carrier || trackingNumber) && (
            <Section style={trackingCard}>
              <Text style={sectionLabel}>TRACKING DETAILS</Text>
              {carrier && (
                <Row style={trackingRow}>
                  <Column style={trackingLabel}>Carrier</Column>
                  <Column style={trackingValue}>{carrier}</Column>
                </Row>
              )}
              {trackingNumber && (
                <Row style={trackingRow}>
                  <Column style={trackingLabel}>Tracking #</Column>
                  <Column style={trackingValueGold}>{trackingNumber}</Column>
                </Row>
              )}
            </Section>
          )}

          {/* ═══ LINE ITEMS ═══ */}
          {items && items.length > 0 && (
            <Section style={itemsWrapper}>
              <Text style={sectionLabel}>ITEMS SHIPPED</Text>
              {items.map((item, i) => (
                <Section key={i} style={itemCard}>
                  <Row>
                    {item.image ? (
                      <>
                        <Column style={itemImageCol}>
                          <Img src={item.image} alt={item.title} width="120" height="120" style={itemImg} />
                        </Column>
                        <Column style={itemDetailCol}>
                          <Text style={itemName}>{item.title}</Text>
                          {item.variant && <Text style={itemVariant}>{item.variant}</Text>}
                          {item.quantity && item.quantity > 1 && (
                            <Text style={itemQty}>× {item.quantity}</Text>
                          )}
                        </Column>
                      </>
                    ) : (
                      <Column style={itemDetailColFull}>
                        <Text style={itemName}>{item.title}</Text>
                        {item.variant && <Text style={itemVariant}>{item.variant}</Text>}
                        {item.quantity && item.quantity > 1 && (
                          <Text style={itemQty}>× {item.quantity}</Text>
                        )}
                      </Column>
                    )}
                  </Row>
                </Section>
              ))}
            </Section>
          )}

          {/* ═══ TRACK CTA ═══ */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={trackingUrl || brandedTrackingUrl}>
              TRACK YOUR PACKAGE
            </Button>
          </Section>

          <Text style={noteText}>
            Tracking may take up to 24 hours to update after shipping.
          </Text>

          {/* ═══ SUPPORT FOOTER ═══ */}
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
  component: ShippingConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Your order ${data.orderName || ''} has shipped! 📦`,
  displayName: 'Shipping confirmation',
  previewData: {
    customerName: 'Jake',
    orderName: 'SUL-49420',
    carrier: 'UPS',
    trackingNumber: '1Z999AA10123456784',
    trackingUrl: 'https://www.sullenclothing.com/track?order=SUL-49420',
    items: [
      { title: 'Daggers Tee - Black', variant: 'BLACK / L', quantity: 1, image: 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-badge-logo.png' },
      { title: 'Collective Snapback', quantity: 1 },
    ],
  },
} satisfies TemplateEntry

// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════

const main = { backgroundColor: '#f4f4f4', fontFamily: "'Barlow', 'Helvetica Neue', Arial, sans-serif" }

// ── Hero ──
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

// ── Container ──
const container = { padding: '0 16px 30px', maxWidth: '560px', margin: '0 auto' }

// ── Section Labels ──
const sectionLabel = {
  fontSize: '11px', fontFamily: "'Oswald', Arial, sans-serif", color: '#999999',
  letterSpacing: '0.2em', margin: '0 0 14px', textAlign: 'left' as const,
}

// ── Tracking Card ──
const trackingCard = {
  backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '20px',
  margin: '24px 0', border: '1px solid #2a2a2a',
}
const trackingRow = { margin: '0' }
const trackingLabel = {
  fontSize: '13px', color: '#777777', textAlign: 'left' as const, padding: '4px 0',
  fontFamily: "'Oswald', Arial, sans-serif", letterSpacing: '0.08em',
}
const trackingValue = { fontSize: '14px', color: '#cccccc', textAlign: 'right' as const, padding: '4px 0' }
const trackingValueGold = {
  fontSize: '14px', color: '#d4940a', textAlign: 'right' as const, padding: '4px 0',
  fontWeight: '600' as const, letterSpacing: '0.02em',
}

// ── Line Items ──
const itemsWrapper = { margin: '0 0 24px' }
const itemCard = {
  backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px',
  margin: '0 0 8px', border: '1px solid #e8e8e8',
}
const itemImageCol = { width: '120px', verticalAlign: 'top' as const }
const itemImg = { borderRadius: '6px', objectFit: 'cover' as const, display: 'block' as const }
const itemDetailCol = { verticalAlign: 'top' as const, paddingLeft: '16px' }
const itemDetailColFull = { verticalAlign: 'top' as const }
const itemName = {
  fontSize: '15px', fontWeight: '600' as const, color: '#1a1a1a',
  margin: '0 0 3px', lineHeight: '1.3',
}
const itemVariant = {
  fontSize: '13px', color: '#999999', margin: '0 0 4px',
  textTransform: 'uppercase' as const, letterSpacing: '0.04em',
}
const itemQty = { fontSize: '14px', color: '#444444', margin: '0' }

// ── CTA Button ──
const ctaSection = { textAlign: 'center' as const, margin: '4px 0 16px' }
const ctaButton = {
  backgroundColor: '#d4940a', color: '#0d0d0d', fontSize: '14px',
  fontFamily: "'Oswald', Arial, sans-serif", fontWeight: '700' as const,
  letterSpacing: '0.15em', borderRadius: '6px', padding: '16px 36px',
  textDecoration: 'none', display: 'inline-block' as const,
}

// ── Note + Footer ──
const noteText = {
  fontSize: '13px', color: '#888888', lineHeight: '1.4', margin: '0 0 24px',
  textAlign: 'center' as const,
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
