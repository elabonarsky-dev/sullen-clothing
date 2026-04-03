import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://sullenclothing.com'
const CHECK_TIMEOUT_MS = 15000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let statusCode: number | null = null
  let responseTimeMs: number | null = null
  let isUp = false
  let errorMessage: string | null = null

  try {
    const start = Date.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)

    const res = await fetch(SITE_URL, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'SullenUptimeBot/1.0' },
    })

    clearTimeout(timeout)
    responseTimeMs = Date.now() - start
    statusCode = res.status
    isUp = res.status >= 200 && res.status < 400
  } catch (err: any) {
    errorMessage = err.name === 'AbortError' ? 'Timeout after 15s' : err.message
    isUp = false
  }

  // Log the check
  await supabase.from('uptime_checks').insert({
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    is_up: isUp,
    error_message: errorMessage,
  })

  // If site is down, check if we already sent an alert recently (last 30 min)
  let alertSent = false
  if (!isUp) {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: recentAlerts } = await supabase
      .from('uptime_checks')
      .select('id')
      .eq('alert_sent', true)
      .gte('checked_at', thirtyMinAgo)
      .limit(1)

    if (!recentAlerts || recentAlerts.length === 0) {
      // Send alert email
      const alertEmails = Deno.env.get('UPTIME_ALERT_EMAILS') || ''
      const recipients = alertEmails.split(',').map((e: string) => e.trim()).filter(Boolean)

      for (const email of recipients) {
        try {
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              to: email,
              template: 'uptime-alert',
              data: {
                site_url: SITE_URL,
                status_code: statusCode,
                error_message: errorMessage || `HTTP ${statusCode}`,
                checked_at: new Date().toISOString(),
              },
            },
          })
        } catch (e) {
          console.error(`Failed to send alert to ${email}:`, e)
        }
      }

      // Mark this check as having sent an alert
      if (recipients.length > 0) {
        alertSent = true
        // Update the most recent check
        const { data: lastCheck } = await supabase
          .from('uptime_checks')
          .select('id')
          .order('checked_at', { ascending: false })
          .limit(1)
          .single()

        if (lastCheck) {
          await supabase
            .from('uptime_checks')
            .update({ alert_sent: true })
            .eq('id', lastCheck.id)
        }
      }
    }
  }

  return new Response(
    JSON.stringify({
      is_up: isUp,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      error_message: errorMessage,
      alert_sent: alertSent,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
