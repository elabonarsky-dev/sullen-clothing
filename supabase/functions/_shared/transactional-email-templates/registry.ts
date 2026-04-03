/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as returnApproved } from './return-approved.tsx'
import { template as backInStockConfirmation } from './back-in-stock-confirmation.tsx'
import { template as backInStockNotification } from './back-in-stock-notification.tsx'
import { template as welcome } from './welcome.tsx'
import { template as reviewRequest } from './review-request.tsx'
import { template as vaultTierUpgrade } from './vault-tier-upgrade.tsx'
import { template as surveyFollowup } from './survey-followup.tsx'
import { template as uptimeAlert } from './uptime-alert.tsx'
import { template as orderConfirmation } from './order-confirmation.tsx'
import { template as shippingConfirmation } from './shipping-confirmation.tsx'
import { template as deliveryConfirmation } from './delivery-confirmation.tsx'
import { template as orderCancelled } from './order-cancelled.tsx'
import { template as weeklyOpsReport } from './weekly-ops-report.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'return-approved': returnApproved,
  'back-in-stock-confirmation': backInStockConfirmation,
  'back-in-stock-notification': backInStockNotification,
  'welcome': welcome,
  'review-request': reviewRequest,
  'vault-tier-upgrade': vaultTierUpgrade,
  'survey-followup': surveyFollowup,
  'uptime-alert': uptimeAlert,
  'order-confirmation': orderConfirmation,
  'shipping-confirmation': shippingConfirmation,
  'delivery-confirmation': deliveryConfirmation,
  'order-cancelled': orderCancelled,
  'weekly-ops-report': weeklyOpsReport,
}
