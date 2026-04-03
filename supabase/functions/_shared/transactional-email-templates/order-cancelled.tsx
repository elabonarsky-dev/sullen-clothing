/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Section, Hr, Row, Column, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = "https://www.sullenclothing.com"
const LOGO_WHITE_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-boh-logo.png'

interface OrderCancelledProps {
  customerName?: string
  orderName?: string
  cancelledAt?: string
  cancelReason?: string
  refundAmount?: string
  items?: Array<{ title: string; quantity?: number; image?: string; variant?: string }>
}

const OrderCancelledEmail = ({
  customerName,
  orderName,
  cancelledAt,
  cancelReason,
  refundAmount,
  items,
}: OrderCancelledProps) => {
  const firstName = customerName?.split(' ')[0]
  const formattedDate = cancelledAt
    ? new Date(cancelledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : undefined

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{orderName ? `Order ${orderName} canceled` : 'Your order has been canceled'}</Preview>
      <Body style={main}>
        <Section style={heroSection}>
          <Container style={heroContainer}>
            <Row>
              <Column style={heroLogoCol}>
                <Img src={LOGO_WHITE_URL} alt="Sullen Art Collective" width="80" height="80" style={heroLogo} />
              </Column>
              <Column style={heroTextCol}>
                <Heading style={heroHeading}>ORDER CANCELED</Heading>
                <Text style={heroSubhead}>
                  {firstName ? `${firstName}, this order was canceled.` : 'This order was canceled.'}
                  {orderName ? ` — ${orderName}` : ''}
                </Text>
                {formattedDate && <Text style={heroDate}>Canceled {formattedDate}</Text>}
              </Column>
            </Row>
          </Container>
        </Section>

        <Container style={container}>
          <Section style={noticeCard}>
            <Text style={noticeText}>
              If your payment was captured, your refund will be processed back to your original payment method.
              {refundAmount ? ` Estimated refund: $${refundAmount}.` : ''}
            </Text>
            {cancelReason && <Text style={reasonText}>Reason: {cancelReason.replace(/_/g, ' ')}</Text>}
          </Section>

          {items && items.length > 0 && (
            <Section style={itemsWrapper}>
              <Text style={sectionLabel}>CANCELED ITEMS</Text>
              {items.map((item, i) => (
                <Section key={i} style={itemCard}>
                  <Row>
                    {item.image ? (
                      <>
                        <Column style={itemImageCol}>
                          <Img src={item.image} alt={item.title} width="80" height="80" style={itemImg} />
                        </Column>
                        <Column style={itemDetailCol}>
                          <Text style={itemName}>{item.title}</Text>
                          {item.variant && <Text style={itemMeta}>{item.variant}</Text>}
                          <Text style={itemMeta}>Qty: {item.quantity || 1}</Text>
                        </Column>
                      </>
                    ) : (
                      <Column>
                        <Text style={itemName}>{item.title}</Text>
                        {item.variant && <Text style={itemMeta}>{item.variant}</Text>}
                        <Text style={itemMeta}>Qty: {item.quantity || 1}</Text>
                      </Column>
                    )}
                  </Row>
                </Section>
              ))}
            </Section>
          )}

          <Text style={supportText}>
            Need help? Contact us at{' '}
            <Link href="mailto:questions@sullenclothing.com" style={supportLink}>questions@sullenclothing.com</Link>{' '}
            or visit <Link href={`${SITE_URL}/support`} style={supportLink}>Support</Link>.
          </Text>

          <Hr style={footerDivider} />
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
  component: OrderCancelledEmail,
  subject: (data: Record<string, any>) =>
    `Update: ${data.orderName ? `Order ${data.orderName}` : 'Your order'} has been canceled`,
  displayName: 'Order cancelled',
  previewData: {
    customerName: 'Ryan',
    orderName: 'SUL494960',
    cancelledAt: '2026-03-29T05:00:00Z',
    cancelReason: 'customer',
    refundAmount: '59.95',
    items: [
      { title: 'Beneath Lanyard', quantity: 1 },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Barlow', 'Helvetica Neue', Arial, sans-serif" }
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
  fontSize: '14px', color: '#cccccc', margin: '0', textAlign: 'left' as const, lineHeight: '1.4',
}
const heroDate = { fontSize: '12px', color: '#888888', margin: '4px 0 0', textAlign: 'left' as const }
const container = { padding: '20px 16px 30px', maxWidth: '560px', margin: '0 auto' }
const noticeCard = {
  backgroundColor: '#f7f7f7', borderRadius: '8px', padding: '16px', margin: '0 0 16px', border: '1px solid #e8e8e8',
}
const noticeText = { fontSize: '14px', color: '#222222', lineHeight: '1.5', margin: '0 0 8px' }
const reasonText = {
  fontSize: '12px', color: '#666666', margin: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em',
}
const itemsWrapper = { margin: '0 0 16px' }
const sectionLabel = {
  fontSize: '11px', fontFamily: "'Oswald', Arial, sans-serif", color: '#999999',
  letterSpacing: '0.2em', margin: '0 0 10px', textAlign: 'left' as const,
}
const itemCard = {
  backgroundColor: '#ffffff', borderRadius: '8px', padding: '12px', margin: '0 0 8px', border: '1px solid #e8e8e8',
}
const itemImageCol = { width: '80px', verticalAlign: 'middle' as const }
const itemImg = { borderRadius: '6px', display: 'block' as const }
const itemDetailCol = { verticalAlign: 'middle' as const, paddingLeft: '12px' }
const itemName = { fontSize: '14px', color: '#1a1a1a', fontWeight: '600' as const, margin: '0 0 3px' }
const itemMeta = { fontSize: '12px', color: '#666666', margin: '0 0 2px' }
const supportText = { fontSize: '13px', color: '#555555', lineHeight: '1.5', margin: '12px 0 20px', textAlign: 'center' as const }
const supportLink = { color: '#d4940a', textDecoration: 'none' }
const footerDivider = { borderColor: '#e0e0e0', margin: '0 0 16px' }
const brandFooter = { textAlign: 'center' as const, margin: '0 0 8px' }
const brandLink = {
  fontSize: '13px', color: '#0d0d0d', fontWeight: '600' as const, textDecoration: 'none', fontFamily: "'Oswald', Arial, sans-serif", letterSpacing: '0.05em',
}
const brandAddress = { fontSize: '11px', color: '#aaaaaa', margin: '6px 0 0', lineHeight: '1.4' }
