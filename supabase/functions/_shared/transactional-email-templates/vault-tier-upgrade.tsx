/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Section, Hr, Row, Column, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = "https://www.sullenclothing.com"
const LOGO_WHITE_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-boh-logo.png'

interface VaultTierUpgradeProps {
  name?: string
  newTier?: string
  perks?: string[]
  pointsMultiplier?: string
  freeShippingMin?: string
  earlyAccessHours?: number
  nextTier?: string
  nextTierSpend?: string
}

const TIER_DISPLAY: Record<string, { label: string; emoji: string; color: string }> = {
  collector: { label: 'Collector', emoji: '🔥', color: '#d4940a' },
  mentor: { label: 'Mentor', emoji: '⚡', color: '#d4940a' },
  master: { label: 'Master', emoji: '💀', color: '#d4940a' },
}

const VaultTierUpgradeEmail = ({ name, newTier, perks, pointsMultiplier, freeShippingMin, earlyAccessHours, nextTier, nextTierSpend }: VaultTierUpgradeProps) => {
  const firstName = name?.split(' ')[0]
  const tier = TIER_DISPLAY[newTier || ''] || { label: newTier || 'New Tier', emoji: '🎉', color: '#d4940a' }

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You've reached {tier.label} status in The Vault {tier.emoji}</Preview>
      <Body style={main}>
        <Section style={heroSection}>
          <Container style={heroContainer}>
            <Row>
              <Column style={heroLogoCol}>
                <Img src={LOGO_WHITE_URL} alt="Sullen Art Collective" width="80" height="80" style={heroLogo} />
              </Column>
              <Column style={heroTextCol}>
                <Heading style={heroHeading}>TIER UNLOCKED {tier.emoji}</Heading>
                <Text style={heroSubhead}>
                  {firstName ? `${firstName}, you've` : "You've"} leveled up to <strong style={{ color: '#d4940a' }}>{tier.label}</strong>.
                </Text>
              </Column>
            </Row>
          </Container>
        </Section>

        <Container style={container}>
          {/* ═══ TIER STATS CARD ═══ */}
          <Section style={statsCard}>
            <Text style={statsHeading}>YOUR {tier.label.toUpperCase()} BENEFITS</Text>
            <Hr style={statsDivider} />
            <Row>
              <Column style={statCol}>
                <Text style={statValue}>{pointsMultiplier || '1.5x'}</Text>
                <Text style={statLabel}>Points Multiplier</Text>
              </Column>
              <Column style={statCol}>
                <Text style={statValue}>{freeShippingMin ? `$${freeShippingMin}` : 'FREE'}</Text>
                <Text style={statLabel}>{freeShippingMin ? 'Free Ship Min' : 'Free Shipping'}</Text>
              </Column>
              <Column style={statCol}>
                <Text style={statValue}>{earlyAccessHours ? `${earlyAccessHours}hr` : '—'}</Text>
                <Text style={statLabel}>Early Access</Text>
              </Column>
            </Row>
          </Section>

          {/* ═══ PERKS LIST ═══ */}
          {perks && perks.length > 0 && (
            <Section style={card}>
              <Text style={sectionLabel}>YOUR NEW PERKS</Text>
              {perks.map((perk, i) => (
                <Text key={i} style={perkItem}>✦ {perk}</Text>
              ))}
            </Section>
          )}

          {/* ═══ NEXT TIER TEASER ═══ */}
          {nextTier && nextTierSpend && (
            <Section style={nextTierCard}>
              <Text style={nextTierText}>
                Next up: <strong style={{ color: '#d4940a' }}>{nextTier}</strong> — spend {nextTierSpend} more to unlock the next level.
              </Text>
            </Section>
          )}

          <Text style={bodyText}>
            Keep stacking Skull Points and unlocking exclusive rewards. The Vault gets better the deeper you go.
          </Text>

          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${SITE_URL}/vault`}>
              EXPLORE THE VAULT
            </Button>
          </Section>

          <Hr style={footerDivider} />
          <Text style={supportText}>
            Questions? Hit us at{' '}
            <Link href="mailto:questions@sullenclothing.com" style={supportLink}>questions@sullenclothing.com</Link>
            {' '}or call{' '}
            <Link href="tel:5622961894" style={supportLink}>562-296-1894</Link>
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
  component: VaultTierUpgradeEmail,
  subject: (data: Record<string, any>) => {
    const tier = TIER_DISPLAY[data.newTier || ''] || { label: 'a new tier', emoji: '🎉' }
    return `You've reached ${tier.label} status ${tier.emoji}`
  },
  displayName: 'Vault tier upgrade',
  previewData: {
    name: 'Jake',
    newTier: 'collector',
    pointsMultiplier: '1.5x',
    freeShippingMin: '100',
    earlyAccessHours: 12,
    perks: ['1.5x Skull Points on every purchase', 'Access to The Vault exclusives', 'Free shipping on orders over $100', 'Early access to new drops (12hr head start)'],
    nextTier: 'Mentor',
    nextTierSpend: '$550',
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
const statsCard = {
  backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '24px 20px',
  margin: '24px 0', border: '1px solid #2a2a2a', textAlign: 'center' as const,
}
const statsHeading = {
  fontSize: '12px', fontFamily: "'Oswald', Arial, sans-serif", color: '#d4940a',
  letterSpacing: '0.2em', margin: '0 0 12px', textAlign: 'center' as const,
}
const statsDivider = { borderColor: '#2a2a2a', margin: '0 0 16px' }
const statCol = { width: '33%' as const, textAlign: 'center' as const, verticalAlign: 'top' as const, padding: '0 4px' }
const statValue = {
  fontSize: '24px', fontWeight: '700' as const, fontFamily: "'Oswald', Arial, sans-serif",
  color: '#d4940a', margin: '0 0 2px', textAlign: 'center' as const,
}
const statLabel = {
  fontSize: '10px', color: '#777777', letterSpacing: '0.1em', margin: '0',
  textTransform: 'uppercase' as const, textAlign: 'center' as const,
}
const nextTierCard = {
  backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px 20px',
  margin: '0 0 20px', border: '1px dashed #d4940a', textAlign: 'center' as const,
}
const nextTierText = { fontSize: '13px', color: '#666666', margin: '0', lineHeight: '1.5', textAlign: 'center' as const }
const card = {
  backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px',
  margin: '0 0 20px', border: '1px solid #e8e8e8',
}
const perkItem = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 8px' }
const bodyText = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 24px', padding: '0 4px' }
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
