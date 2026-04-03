/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Section, Hr, Row, Column, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = "https://www.sullenclothing.com"
const LOGO_WHITE_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-boh-logo.png'

interface BackInStockConfirmationProps {
  productTitle?: string
  variantTitle?: string
  productHandle?: string
  productImage?: string
}

const BackInStockConfirmationEmail = ({ productTitle, variantTitle, productHandle, productImage }: BackInStockConfirmationProps) => {
  const productUrl = productHandle ? `${SITE_URL}/products/${productHandle}` : SITE_URL

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>We'll let you know when {productTitle || 'this item'} is back</Preview>
      <Body style={main}>
        <Section style={heroSection}>
          <Container style={heroContainer}>
            <Row>
              <Column style={heroLogoCol}>
                <Img src={LOGO_WHITE_URL} alt="Sullen Art Collective" width="80" height="80" style={heroLogo} />
              </Column>
              <Column style={heroTextCol}>
                <Heading style={heroHeading}>YOU'RE ON THE LIST</Heading>
                <Text style={heroSubhead}>
                  We'll notify you when it drops back.
                </Text>
              </Column>
            </Row>
          </Container>
        </Section>

        <Container style={container}>
          <Section style={card}>
            {productImage && (
              <a href={productUrl} style={{ textDecoration: 'none' }}>
                <Img src={productImage} alt={productTitle || 'Product'} width="260" style={productImg} />
              </a>
            )}
            <Text style={itemName}>
              {productTitle || 'This item'}
              {variantTitle ? ` — ${variantTitle}` : ''}
            </Text>
            <Text style={bodyText}>
              We've received your request. We'll send you an email the moment it's available again — no need to keep checking back.
            </Text>
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
  component: BackInStockConfirmationEmail,
  subject: "You're on the list — we'll notify you when it's back",
  displayName: 'Back in stock sign-up confirmation',
  previewData: { productTitle: 'Daggers Tee', variantTitle: 'Large / Black', productHandle: 'daggers-tee', productImage: 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-badge-logo.png' },
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
const card = {
  backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px',
  margin: '24px 0', border: '1px solid #e8e8e8', textAlign: 'center' as const,
}
const productImg = { display: 'inline-block' as const, borderRadius: '6px', maxWidth: '100%', marginBottom: '16px' }
const itemName = {
  fontSize: '16px', fontWeight: '600' as const, color: '#1a1a1a',
  margin: '0 0 8px', lineHeight: '1.3',
}
const bodyText = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0' }
const footerDivider = { borderColor: '#e0e0e0', margin: '0 0 20px' }
const supportText = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0 0 24px', textAlign: 'center' as const }
const supportLink = { color: '#d4940a', textDecoration: 'none' }
const brandFooter = { textAlign: 'center' as const, margin: '0 0 8px' }
const brandLink = { fontSize: '13px', color: '#0d0d0d', fontWeight: '600' as const, textDecoration: 'none', fontFamily: "'Oswald', Arial, sans-serif", letterSpacing: '0.05em' }
const brandAddress = { fontSize: '11px', color: '#aaaaaa', margin: '6px 0 0', lineHeight: '1.4' }
