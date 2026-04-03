/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Sullen Clothing"
const LOGO_URL = 'https://smmeufktnfgefknaisrr.supabase.co/storage/v1/object/public/email-assets/sullen-badge-logo.png'

interface MetricCard {
  label: string
  value: string
  change?: string
}

interface WeeklyOpsReportProps {
  weekLabel?: string
  metrics?: MetricCard[]
  insights?: string[]
  topProducts?: Array<{ title: string; units: number; revenue: string }>
  rewardsSummary?: { newMembers: number; pointsEarned: number; redemptions: number }
  reviewsSummary?: { newReviews: number; avgRating: string; pendingCount: number }
}

const WeeklyOpsReportEmail = ({
  weekLabel = 'March 24 – March 30, 2026',
  metrics = [],
  insights = [],
  topProducts = [],
  rewardsSummary = { newMembers: 0, pointsEarned: 0, redemptions: 0 },
  reviewsSummary = { newReviews: 0, avgRating: '0', pendingCount: 0 },
}: WeeklyOpsReportProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Weekly Operations Report — {weekLabel}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={headerSection}>
          <img src={LOGO_URL} alt={SITE_NAME} width="60" height="60" style={{ margin: '0 auto', display: 'block' }} />
          <Heading style={h1}>Weekly Operations Report</Heading>
          <Text style={weekLabelStyle}>{weekLabel}</Text>
        </Section>

        <Hr style={divider} />

        {/* Key Metrics */}
        {metrics.length > 0 && (
          <Section>
            <Heading style={h2}>📊 Key Metrics</Heading>
            <Section>
              {metrics.map((m, i) => (
                <Section key={i} style={metricRow}>
                  <Row>
                    <Column style={{ width: '60%' }}>
                      <Text style={metricLabel}>{m.label}</Text>
                    </Column>
                    <Column style={{ width: '25%', textAlign: 'right' as const }}>
                      <Text style={metricValue}>{m.value}</Text>
                    </Column>
                    <Column style={{ width: '15%', textAlign: 'right' as const }}>
                      {m.change && <Text style={m.change.startsWith('-') ? metricChangeNeg : metricChangePos}>{m.change}</Text>}
                    </Column>
                  </Row>
                </Section>
              ))}
            </Section>
          </Section>
        )}

        <Hr style={divider} />

        {/* Top Products */}
        {topProducts.length > 0 && (
          <Section>
            <Heading style={h2}>🔥 Top Sellers This Week</Heading>
            {topProducts.map((p, i) => (
              <Section key={i} style={metricRow}>
                <Row>
                  <Column style={{ width: '55%' }}>
                    <Text style={productTitle}>{i + 1}. {p.title}</Text>
                  </Column>
                  <Column style={{ width: '20%', textAlign: 'right' as const }}>
                    <Text style={metricLabel}>{p.units} units</Text>
                  </Column>
                  <Column style={{ width: '25%', textAlign: 'right' as const }}>
                    <Text style={metricValue}>{p.revenue}</Text>
                  </Column>
                </Row>
              </Section>
            ))}
          </Section>
        )}

        <Hr style={divider} />

        {/* Loyalty & Reviews */}
        <Section>
          <Row>
            <Column style={{ width: '50%', verticalAlign: 'top' }}>
              <Heading style={h3}>💀 Skull Points</Heading>
              <Text style={metricLabel}>New Members: <strong>{rewardsSummary.newMembers}</strong></Text>
              <Text style={metricLabel}>Points Earned: <strong>{rewardsSummary.pointsEarned.toLocaleString()}</strong></Text>
              <Text style={metricLabel}>Redemptions: <strong>{rewardsSummary.redemptions}</strong></Text>
            </Column>
            <Column style={{ width: '50%', verticalAlign: 'top' }}>
              <Heading style={h3}>⭐ Reviews</Heading>
              <Text style={metricLabel}>New Reviews: <strong>{reviewsSummary.newReviews}</strong></Text>
              <Text style={metricLabel}>Avg Rating: <strong>{reviewsSummary.avgRating}</strong></Text>
              <Text style={metricLabel}>Pending: <strong>{reviewsSummary.pendingCount}</strong></Text>
            </Column>
          </Row>
        </Section>

        <Hr style={divider} />

        {/* AI Insights */}
        {insights.length > 0 && (
          <Section>
            <Heading style={h2}>🧠 Strategic Insights</Heading>
            {insights.map((insight, i) => (
              <Text key={i} style={insightText}>• {insight}</Text>
            ))}
          </Section>
        )}

        <Hr style={divider} />
        <Text style={footer}>This report was generated automatically for {SITE_NAME} operations.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WeeklyOpsReportEmail,
  subject: (data: Record<string, any>) => `Weekly Ops Report — ${data.weekLabel || 'This Week'}`,
  displayName: 'Weekly Operations Report',
  to: 'ryan@sullenclothing.com',
  previewData: {
    weekLabel: 'March 24 – March 30, 2026',
    metrics: [
      { label: 'Total Revenue', value: '$12,450', change: '+8%' },
      { label: 'Orders', value: '187', change: '+12%' },
      { label: 'AOV', value: '$66.58', change: '-3%' },
      { label: 'Sessions (GA4)', value: '8,420', change: '+5%' },
    ],
    topProducts: [
      { title: 'Debt Collector Bat', units: 42, revenue: '$627.90' },
      { title: '25 TO LIFE Premium', units: 31, revenue: '$775.00' },
      { title: 'Looking To Score Standard', units: 28, revenue: '$839.72' },
    ],
    rewardsSummary: { newMembers: 34, pointsEarned: 18500, redemptions: 12 },
    reviewsSummary: { newReviews: 15, avgRating: '4.7', pendingCount: 3 },
    insights: [
      'The Debt Collector Bat promo is driving strong add-on behavior — 68% of bat orders include at least one tee.',
      'Collector-tier members are spending 2.4x more than Apprentice on average. Consider targeted upsell for members near the threshold.',
      'Review volume is up 25% WoW since the post-purchase email flow launched. Most reviews are 4-5 stars.',
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '620px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '10px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#000000', margin: '15px 0 5px', textTransform: 'uppercase' as const, letterSpacing: '2px' }
const h2 = { fontSize: '16px', fontWeight: '700' as const, color: '#000000', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const h3 = { fontSize: '14px', fontWeight: '700' as const, color: '#000000', margin: '0 0 8px', textTransform: 'uppercase' as const }
const weekLabelStyle = { fontSize: '13px', color: '#888888', margin: '0 0 10px', textAlign: 'center' as const }
const divider = { borderColor: '#e5e5e5', margin: '20px 0' }
const metricRow = { padding: '4px 0' }
const metricLabel = { fontSize: '13px', color: '#555555', margin: '2px 0', lineHeight: '1.5' }
const metricValue = { fontSize: '14px', fontWeight: '700' as const, color: '#000000', margin: '2px 0' }
const metricChangePos = { fontSize: '12px', color: '#16a34a', margin: '2px 0', fontWeight: '600' as const }
const metricChangeNeg = { fontSize: '12px', color: '#dc2626', margin: '2px 0', fontWeight: '600' as const }
const productTitle = { fontSize: '13px', color: '#000000', margin: '2px 0', fontWeight: '500' as const }
const insightText = { fontSize: '13px', color: '#333333', lineHeight: '1.6', margin: '0 0 10px' }
const footer = { fontSize: '11px', color: '#999999', margin: '20px 0 0', textAlign: 'center' as const }
