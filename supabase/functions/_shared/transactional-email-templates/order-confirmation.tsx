/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Section, Hr, Row, Column, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Sullen Clothing"
const SITE_URL = "https://www.sullenclothing.com"
const LOGO_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-badge-logo.png'
const LOGO_WHITE_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-boh-logo.png'

interface LineItem {
  title: string
  quantity: number
  price: string
  image?: string
  variant?: string
  compareAtPrice?: string
}

interface OrderConfirmationProps {
  customerName?: string
  orderName?: string
  orderDate?: string
  lineItems?: LineItem[]
  subtotal?: string
  shipping?: string
  shippingCost?: string
  tax?: string
  discountAmount?: string
  total?: string
  totalPrice?: string
  currency?: string
  shippingAddress?: {
    name?: string
    address1?: string
    address2?: string
    city?: string
    province?: string
    zip?: string
    country?: string
  }
  orderNote?: string
  skullPointsEarned?: number
  trackingUrl?: string
}

const OrderConfirmationEmail = ({
  customerName,
  orderName,
  orderDate,
  lineItems,
  subtotal,
  shipping,
  shippingCost,
  tax,
  discountAmount,
  total,
  totalPrice,
  currency = 'USD',
  shippingAddress,
  orderNote,
  skullPointsEarned,
  trackingUrl,
}: OrderConfirmationProps) => {
  const currencySymbol = currency === 'USD' ? '$' : currency
  const resolvedShipping = shipping || shippingCost
  const resolvedTotal = total || totalPrice
  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : undefined
  const firstName = customerName?.split(' ')[0]

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {orderName ? `Order ${orderName} confirmed` : 'Order confirmed'} — welcome to the collective
      </Preview>
      <Body style={main}>
        {/* ═══ COMPACT DARK HERO HEADER ═══ */}
        <Section style={heroSection}>
          <Container style={heroContainer}>
            <Row>
              <Column style={heroLogoCol}>
                <Img src={LOGO_WHITE_URL} alt="Sullen Art Collective" width="80" height="80" style={heroLogo} />
              </Column>
              <Column style={heroTextCol}>
                <Heading style={heroHeading}>ORDER CONFIRMED</Heading>
                <Text style={heroSubhead}>
                  {firstName ? `${firstName}, you're locked in.` : "You're locked in."}
                  {orderName ? ` — ${orderName}` : ''}
                </Text>
                {formattedDate && (
                  <Text style={heroDate}>{formattedDate}</Text>
                )}
              </Column>
            </Row>
          </Container>
        </Section>

        <Container style={container}>
          {/* ═══ LINE ITEMS ═══ */}
          {lineItems && lineItems.length > 0 && (
            <Section style={itemsWrapper}>
              <Text style={sectionLabel}>YOUR ORDER</Text>
              {lineItems.map((item, i) => (
                <Section key={i} style={itemCard}>
                  <Row>
                    {item.image ? (
                      <>
                        <Column style={itemImageCol}>
                          <Img
                            src={item.image}
                            alt={item.title}
                            width="120"
                            height="120"
                            style={itemImg}
                          />
                        </Column>
                        <Column style={itemDetailCol}>
                          <Text style={itemName}>{item.title}</Text>
                          {item.variant && (
                            <Text style={itemVariant}>{item.variant}</Text>
                          )}
                          <Text style={itemQtyPrice}>
                            {'× '}{item.quantity}
                            <span style={itemPriceSep as any}>&nbsp;&nbsp;·&nbsp;&nbsp;</span>
                            {currencySymbol}{item.price}
                          </Text>
                        </Column>
                      </>
                    ) : (
                      <Column style={itemDetailColFull}>
                        <Text style={itemName}>{item.title}</Text>
                        {item.variant && (
                          <Text style={itemVariant}>{item.variant}</Text>
                        )}
                        <Text style={itemQtyPrice}>
                          {'× '}{item.quantity}
                          <span style={itemPriceSep as any}>&nbsp;&nbsp;·&nbsp;&nbsp;</span>
                          {currencySymbol}{item.price}
                        </Text>
                      </Column>
                    )}
                  </Row>
                </Section>
              ))}
            </Section>
          )}

          {/* ═══ ORDER SUMMARY ═══ */}
          <Section style={summaryCard}>
            <Text style={sectionLabel}>ORDER SUMMARY</Text>
            {subtotal && (
              <Row style={summaryRow}>
                <Column style={summaryLabel}>Subtotal</Column>
                <Column style={summaryValue}>{currencySymbol}{subtotal}</Column>
              </Row>
            )}
            {discountAmount && parseFloat(discountAmount) > 0 && (
              <Row style={summaryRow}>
                <Column style={summaryLabel}>Discount</Column>
                <Column style={summaryValueGold}>−{currencySymbol}{discountAmount}</Column>
              </Row>
            )}
            {resolvedShipping && (
              <Row style={summaryRow}>
                <Column style={summaryLabel}>Shipping</Column>
                <Column style={parseFloat(resolvedShipping) === 0 ? summaryValueGold : summaryValue}>
                  {parseFloat(resolvedShipping) === 0 ? 'FREE' : `${currencySymbol}${resolvedShipping}`}
                </Column>
              </Row>
            )}
            {tax && parseFloat(tax) > 0 && (
              <Row style={summaryRow}>
                <Column style={summaryLabel}>Tax</Column>
                <Column style={summaryValue}>{currencySymbol}{tax}</Column>
              </Row>
            )}
            <Hr style={summaryDivider} />
            {resolvedTotal && (
              <Row style={summaryRow}>
                <Column style={summaryTotalLabel}>Total</Column>
                <Column style={summaryTotalValue}>{currencySymbol}{resolvedTotal}</Column>
              </Row>
            )}
          </Section>

          {/* ═══ SHIPPING + ORDER NOTE ═══ */}
          <Row>
            {shippingAddress && (
              <Column style={infoCol}>
                <Text style={infoLabel}>SHIPPING TO</Text>
                <Text style={infoText}>
                  {shippingAddress.name && <>{shippingAddress.name}<br /></>}
                  {shippingAddress.address1 && <>{shippingAddress.address1}<br /></>}
                  {shippingAddress.address2 && <>{shippingAddress.address2}<br /></>}
                  {[shippingAddress.city, shippingAddress.province, shippingAddress.zip]
                    .filter(Boolean).join(', ')}
                </Text>
              </Column>
            )}
            {orderNote && (
              <Column style={infoCol}>
                <Text style={infoLabel}>ORDER NOTE</Text>
                <Text style={infoText}>{orderNote}</Text>
              </Column>
            )}
          </Row>

          {/* ═══ TRACK CTA ═══ */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={
              trackingUrl || (orderName
                ? `${SITE_URL}/track?order=${encodeURIComponent(orderName)}`
                : `${SITE_URL}/track`)
            }>
              TRACK YOUR ORDER
            </Button>
          </Section>

          {/* ═══ SKULL POINTS EARNED ═══ */}
          {typeof skullPointsEarned === 'number' && skullPointsEarned > 0 && (
            <Section style={pointsCard}>
              <Text style={pointsEyebrow}>SKULL POINTS EARNED</Text>
              <Text style={pointsAmount}>+{skullPointsEarned.toLocaleString()}</Text>
              <Text style={pointsSubtext}>
                Points hit your account instantly. Redeem for discounts anytime.
              </Text>
            </Section>
          )}

          {/* ═══ SUPPORT FOOTER ═══ */}
          <Hr style={footerDivider} />
          <Text style={supportText}>
            Questions? Hit us at{' '}
            <Link href="mailto:questions@sullenclothing.com" style={supportLink}>
              questions@sullenclothing.com
            </Link>{' '}
            or call <Link href="tel:+15622961894" style={supportLink}>562-296-1894</Link>
          </Text>

          {/* ═══ BRAND FOOTER ═══ */}
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
  component: OrderConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Order ${data.orderName || ''} confirmed 🤘`,
  displayName: 'Order confirmation',
  previewData: {
    customerName: 'Rich Anderson',
    orderName: 'SUL-49420',
    orderDate: '2026-03-28T10:00:00Z',
    lineItems: [
      { title: 'Love X Hate "1 Ton"', variant: 'WHITE / 3X', quantity: 1, price: '36.95', image: 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-badge-logo.png' },
      { title: 'Yellowstone Flannel Jacket', variant: 'OLIVE / 3X', quantity: 1, price: '49.00' },
      { title: 'Secrete Angel "1 Ton"', variant: 'WHITE / 3X', quantity: 1, price: '36.95', image: 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-badge-logo.png' },
    ],
    subtotal: '137.85',
    shippingCost: '0',
    discountAmount: '14.95',
    totalPrice: '122.90',
    currency: 'USD',
    shippingAddress: {
      name: 'Rich Anderson',
      address1: '4584 Killian Rd',
      city: 'North Tonawanda',
      province: 'NY',
      zip: '14120-9701',
    },
    orderNote: 'Please gift wrap my order, thanks :)',
    skullPointsEarned: 246,
    trackingUrl: 'https://www.sullenclothing.com/track?order=SUL-49420&email=rich@example.com',
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

// ── Skull Points Card ──
const pointsCard = {
  backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '24px 20px',
  margin: '24px 0 24px', textAlign: 'center' as const,
  border: '1px solid #2a2a2a',
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

// ── Section Labels ──
const sectionLabel = {
  fontSize: '11px', fontFamily: "'Oswald', Arial, sans-serif", color: '#999999',
  letterSpacing: '0.2em', margin: '0 0 14px', textAlign: 'left' as const,
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
  fontSize: '13px', color: '#999999', margin: '0 0 6px',
  textTransform: 'uppercase' as const, letterSpacing: '0.04em',
}
const itemQtyPrice = { fontSize: '14px', color: '#444444', margin: '0' }
const itemPriceSep = { color: '#cccccc' }

// ── Order Summary ──
const summaryCard = {
  backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px',
  margin: '0 0 24px', border: '1px solid #e8e8e8',
}
const summaryRow = { margin: '0' }
const summaryLabel = { fontSize: '14px', color: '#777777', textAlign: 'left' as const, padding: '4px 0' }
const summaryValue = { fontSize: '14px', color: '#333333', textAlign: 'right' as const, padding: '4px 0' }
const summaryValueGold = { fontSize: '14px', color: '#d4940a', textAlign: 'right' as const, padding: '4px 0', fontWeight: '600' as const }
const summaryDivider = { borderColor: '#eeeeee', margin: '10px 0' }
const summaryTotalLabel = {
  fontSize: '16px', color: '#0d0d0d', textAlign: 'left' as const, padding: '4px 0',
  fontWeight: '700' as const, fontFamily: "'Oswald', Arial, sans-serif", letterSpacing: '0.05em',
}
const summaryTotalValue = {
  fontSize: '16px', color: '#0d0d0d', textAlign: 'right' as const, padding: '4px 0',
  fontWeight: '700' as const, fontFamily: "'Oswald', Arial, sans-serif",
}

// ── Info Columns ──
const infoCol = { verticalAlign: 'top' as const, padding: '0 8px 20px 0', width: '50%' as const }
const infoLabel = {
  fontSize: '11px', fontFamily: "'Oswald', Arial, sans-serif", color: '#999999',
  letterSpacing: '0.15em', margin: '0 0 6px',
}
const infoText = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0' }

// ── CTA Button ──
const ctaSection = { textAlign: 'center' as const, margin: '4px 0 28px' }
const ctaButton = {
  backgroundColor: '#d4940a', color: '#0d0d0d', fontSize: '14px',
  fontFamily: "'Oswald', Arial, sans-serif", fontWeight: '700' as const,
  letterSpacing: '0.15em', borderRadius: '6px', padding: '16px 36px',
  textDecoration: 'none', display: 'inline-block' as const,
}

// ── Footer ──
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
