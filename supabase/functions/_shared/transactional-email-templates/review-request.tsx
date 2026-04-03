/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Section, Hr, Row, Column, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Sullen Clothing"
const SITE_URL = "https://www.sullenclothing.com"
const LOGO_WHITE_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-boh-logo.png'

const STAR_FILLED = '★'

interface ReviewRequestProps {
  customerName?: string
  orderName?: string
  token?: string
  items?: Array<{ title: string; handle?: string; image?: string }>
}

const StarRatingRow = ({ reviewUrl }: { reviewUrl: string }) => (
  <Section style={starsRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Link key={star} href={`${reviewUrl}&rating=${star}`} style={starLink}>
        {STAR_FILLED}
      </Link>
    ))}
  </Section>
)

const ReviewRequestEmail = ({ customerName, orderName, token, items }: ReviewRequestProps) => {
  const firstName = customerName?.split(' ')[0]
  const baseReviewUrl = token
    ? `${SITE_URL}/write-review/${token}`
    : `${SITE_URL}/write-review`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>How was your order? Leave a review and earn Skull Points</Preview>
      <Body style={main}>
        <Section style={heroSection}>
          <Container style={heroContainer}>
            <Row>
              <Column style={heroLogoCol}>
                <Img src={LOGO_WHITE_URL} alt="Sullen Art Collective" width="80" height="80" style={heroLogo} />
              </Column>
              <Column style={heroTextCol}>
                <Heading style={heroHeading}>HOW WAS YOUR ORDER?</Heading>
                <Text style={heroSubhead}>
                  {firstName ? `${firstName}, we'd love to hear your thoughts` : "We'd love to hear your thoughts"}
                  {orderName ? ` on ${orderName}` : ''}.
                </Text>
              </Column>
            </Row>
          </Container>
        </Section>

        <Container style={container}>
          {/* ═══ ITEMS ═══ */}
          {items && items.length > 0 && (
            <Section style={itemsWrapper}>
              <Text style={sectionLabel}>YOUR ITEMS</Text>
              {items.map((item, i) => (
                <Section key={i} style={itemCard}>
                  <Row>
                    {item.image ? (
                      <>
                        <Column style={itemImageCol}>
                          <Img src={item.image} alt={item.title} width="60" height="60" style={itemImg} />
                        </Column>
                        <Column style={itemDetailCol}>
                          <Text style={itemName}>{item.title}</Text>
                        </Column>
                      </>
                    ) : (
                      <Column>
                        <Text style={itemName}>{item.title}</Text>
                      </Column>
                    )}
                  </Row>
                </Section>
              ))}
            </Section>
          )}

          {/* ═══ STAR RATING ═══ */}
          <Section style={rateCard}>
            <Text style={rateLabel}>TAP A STAR TO GET STARTED</Text>
            <StarRatingRow reviewUrl={`${baseReviewUrl}?from=email`} />
            <Text style={rateSubtext}>
              Earn <strong style={{ color: '#d4940a' }}>50 Skull Points</strong> for each review.
              Your feedback helps fellow collectors.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${baseReviewUrl}?from=email`}>
              WRITE A REVIEW
            </Button>
          </Section>

          <Hr style={footerDivider} />
          <Text style={supportText}>
            Questions? Hit us at{' '}
            <Link href="mailto:questions@sullenclothing.com" style={supportLink}>questions@sullenclothing.com</Link>
          </Text>
          <Section style={brandFooter}>
            <Link href={SITE_URL} style={brandLink}>www.sullenclothing.com</Link>
            <Text style={brandAddress}>Sullen Art Co. · 1779 Apollo Court · Seal Beach, CA 90740</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ReviewRequestEmail,
  subject: (data: Record<string, any>) =>
    `How was your order${data.orderName ? ` ${data.orderName}` : ''}? Leave a review & earn points`,
  displayName: 'Review request',
  previewData: {
    customerName: 'Jake',
    orderName: 'SUL-49410',
    token: 'abc123',
    items: [
      { title: 'Daggers Tee - Black / L', image: 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-badge-logo.png' },
      { title: 'Collective Snapback' },
    ],
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
  letterSpacing: '0.2em', margin: '24px 0 14px', textAlign: 'left' as const,
}
const itemsWrapper = { margin: '0 0 8px' }
const itemCard = {
  backgroundColor: '#ffffff', borderRadius: '8px', padding: '14px 16px',
  margin: '0 0 8px', border: '1px solid #e8e8e8',
}
const itemImageCol = { width: '60px', verticalAlign: 'middle' as const }
const itemImg = { borderRadius: '6px', display: 'block' as const }
const itemDetailCol = { verticalAlign: 'middle' as const, paddingLeft: '14px' }
const itemName = { fontSize: '15px', fontWeight: '600' as const, color: '#1a1a1a', margin: '0', lineHeight: '1.3' }
const rateCard = {
  backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '24px 20px',
  margin: '16px 0 24px', border: '1px solid #2a2a2a', textAlign: 'center' as const,
}
const rateLabel = {
  fontSize: '11px', fontFamily: "'Oswald', Arial, sans-serif", color: '#888888',
  letterSpacing: '0.2em', margin: '0 0 12px', textAlign: 'center' as const,
}
const starsRow = { textAlign: 'center' as const, margin: '0 0 16px' }
const starLink = {
  fontSize: '32px', color: '#d4940a', textDecoration: 'none', padding: '0 4px',
  display: 'inline' as const,
}
const rateSubtext = { fontSize: '13px', color: '#cccccc', lineHeight: '1.5', margin: '0', textAlign: 'center' as const }
const ctaSection = { textAlign: 'center' as const, margin: '0 0 28px' }
const ctaButton = {
  backgroundColor: '#d4940a', color: '#0d0d0d', fontSize: '14px',
  fontFamily: "'Oswald', Arial, sans-serif", fontWeight: '700' as const,
  letterSpacing: '0.15em', borderRadius: '6px', padding: '16px 36px',
  textDecoration: 'none', display: 'inline-block' as const,
}
const footerDivider = { borderColor: '#e0e0e0', margin: '0 0 20px' }
const supportText = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0 0 24px', textAlign: 'center' as const }
const supportLink = { color: '#d4940a', textDecoration: 'none' }
const brandFooter = { textAlign: 'center' as const, margin: '0 0 8px' }
const brandLink = { fontSize: '13px', color: '#0d0d0d', fontWeight: '600' as const, textDecoration: 'none', fontFamily: "'Oswald', Arial, sans-serif", letterSpacing: '0.05em' }
const brandAddress = { fontSize: '11px', color: '#aaaaaa', margin: '6px 0 0', lineHeight: '1.4' }
