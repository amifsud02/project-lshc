'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { trackEvent } from '@/lib/analytics/gtag'

/**
 * Sends Core Web Vitals (LCP, INP, CLS, plus FCP and TTFB) to GA4 as events named after the
 * metric, so real-visitor page speed can be reported per page in GA4 Explorations.
 */
export default function WebVitals() {
  useReportWebVitals((metric) => {
    trackEvent(metric.name, {
      // CLS is a small decimal; scale it so GA's integer `value` keeps its precision.
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      metric_navigation_type: metric.navigationType,
      non_interaction: true,
    })
  })
  return null
}
