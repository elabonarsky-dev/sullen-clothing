/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Section, Hr, Row, Column, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Sullen Clothing"
const SITE_URL = "https://www.sullenclothing.com"
const LOGO_WHITE_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-boh-logo.png'

interface DeliveryConfirmationProps {
  customerName?: string
  orderName?: string
  deliveredAt?: string
  items?: Array<{ title: string; image?: string; variant?: string }>
}

const DeliveryConfirmationEmail = ({
  customerName,
  orderName,
  deliveredAt,
  items,
}: DeliveryConfirmationProps) => {
  const firstName = customerName?.split(' ')[0]
  const formattedDate = deliveredAt
    ? new Date(deliveredAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : undefined

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your order {orderName || ''} has been delivered!</Preview>
      <Body style={main}>
        {/* ═══ COMPACT DARK HERO HEADER ═══ */}
        <Section style={heroSection}>
          <Container style={heroContainer}>
            <Row>
              <Column style={heroLogoCol}>
                <Img src={LOGO_WHITE_URL} alt="Sullen Art Collective" width="80" height="80" style={heroLogo} />
              </Column>
              <Column style={heroTextCol}>
                <Heading style={heroHeading}>YOUR ORDER HAS ARRIVED</Heading>
                <Text style={heroSubhead}>
                  {firstName ? `${firstName}, your order just landed.` : "Your order just landed."}
                  {orderName ? ` — ${orderName}` : ''}
                </Text>
                {formattedDate && (
                  <Text style={heroDate}>Delivered {formattedDate}</Text>
                )}
              </Column>
            </Row>
          </Container>
        </Section>

        <Container style={container}>
          {/* ═══ LINE ITEMS ═══ */}
          {items && items.length > 0 && (
            <Section style={itemsWrapper}>
              <Text style={sectionLabel}>DELIVERED ITEMS</Text>
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
                        </Column>
                      </>
                    ) : (
                      <Column style={itemDetailColFull}>
                        <Text style={itemName}>{item.title}</Text>
                        {item.variant && <Text style={itemVariant}>{item.variant}</Text>}
                      </Column>
                    )}
                  </Row>
                </Section>
              ))}
            </Section>
          )}

          {/* ═══ REVIEW CTA ═══ */}
          <Section style={reviewCard}>
            <Text style={reviewEyebrow}>LOVE YOUR NEW GEAR?</Text>
            <Text style={reviewBody}>
              Drop a review and earn <strong style={{ color: '#d4940a' }}>50 Skull Points</strong> for
              each product you review.
            </Text>
            <Section style={ctaSection}>
              <Button style={ctaButton} href={`${SITE_URL}/account`}>
                LEAVE A REVIEW
              </Button>
            </Section>
          </Section>

          {/* ═══ SHOP MORE ═══ */}
          <Section style={ctaSection}>
            <Button style={ctaButtonSecondary} href={SITE_URL}>
              SHOP MORE
            </Button>
          </Section>

          <Text style={noteText}>
            Issue with your order?{' '}
            <Link href={`${SITE_URL}/support`} style={supportLink}>Contact support</Link>
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
  component: DeliveryConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Your order ${data.orderName || ''} has been delivered! ✅`,
  displayName: 'Delivery confirmation',
  previewData: {
    customerName: 'Jake',
    orderName: 'SUL-49420',
    deliveredAt: '2026-03-28T14:30:00Z',
    items: [
      { title: 'Daggers Tee', variant: 'BLACK / L', image: 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-badge-logo.png' },
      { title: 'Collective Snapback' },
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
const heroDate = {
  fontSize: '12px', color: '#666666', margin: '4px 0 0', textAlign: 'left' as const,
}

// ── Container ──
const container = { padding: '0 16px 30px', maxWidth: '560px', margin: '0 auto' }

// ── Section Labels ──
const sectionLabel = {
  fontSize: '11px', fontFamily: "'Oswald', Arial, sans-serif", color: '#999999',
  letterSpacing: '0.2em', margin: '24px 0 14px', textAlign: 'left' as const,
}

// ── Line Items ──
const itemsWrapper = { margin: '0 0 8px' }
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
  fontSize: '13px', color: '#999999', margin: '0',
  textTransform: 'uppercase' as const, letterSpacing: '0.04em',
}

// ── Review Card ──
const reviewCard = {
  backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '24px 20px',
  margin: '16px 0 24px', border: '1px solid #2a2a2a', textAlign: 'center' as const,
}
const reviewEyebrow = {
  fontSize: '11px', fontFamily: "'Oswald', Arial, sans-serif", color: '#888888',
  letterSpacing: '0.2em', margin: '0 0 8px', textAlign: 'center' as const,
}
const reviewBody = {
  fontSize: '14px', color: '#cccccc', lineHeight: '1.5', margin: '0 0 16px',
  textAlign: 'center' as const,
}

// ── CTA Buttons ──
const ctaSection = { textAlign: 'center' as const, margin: '4px 0 16px' }
const ctaButton = {
  backgroundColor: '#d4940a', color: '#0d0d0d', fontSize: '14px',
  fontFamily: "'Oswald', Arial, sans-serif", fontWeight: '700' as const,
  letterSpacing: '0.15em', borderRadius: '6px', padding: '16px 36px',
  textDecoration: 'none', display: 'inline-block' as const,
}
const ctaButtonSecondary = {
  backgroundColor: '#0d0d0d', color: '#ffffff', fontSize: '14px',
  fontFamily: "'Oswald', Arial, sans-serif", fontWeight: '600' as const,
  letterSpacing: '0.12em', borderRadius: '6px', padding: '14px 32px',
  textDecoration: 'none', display: 'inline-block' as const,
  border: '1px solid #333333',
}

// ── Footer ──
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
