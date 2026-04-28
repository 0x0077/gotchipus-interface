import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id, sender, signature, token_id, timestamp, token, nonce, user_agent, tx_hash,
      max_value_per_tx, max_value_per_session,
      enabled_options, daily_limit, single_tx_limit,
      whitelist_mode, target_whitelists, target_blacklists,
      risk_preference, slippage, tone, verbosity,
    } = body;

    if (!sender || !signature || token_id == null || !timestamp || !tx_hash || !token) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const ip_address =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '';
    const backendUrl = getBackendUrl();

    // Save session to database (called after on-chain tx is confirmed)
    const response = await fetch(`${backendUrl}/chain/session_create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user_id || '',
        sender,
        signature,
        token_id,
        timestamp,
        token,
        nonce: nonce || '',
        user_agent: user_agent || '',
        ip_address,
        is_active: true,
        tx_hash,
        // Session limits
        max_value_per_tx: max_value_per_tx ?? null,
        max_value_per_session: max_value_per_session ?? null,
        // SecurityPolicy
        enabled_options: enabled_options ?? null,
        daily_limit: daily_limit ?? null,
        single_tx_limit: single_tx_limit ?? null,
        whitelist_mode: whitelist_mode ?? null,
        target_whitelists: target_whitelists ?? null,
        target_blacklists: target_blacklists ?? null,
        // AI Behavior
        risk_preference: risk_preference ?? null,
        slippage: slippage ?? null,
        tone: tone ?? null,
        verbosity: verbosity ?? null,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Backend save failed';
      let backendError = null;
      try {
        backendError = await response.json();
        errorMessage = backendError.message || backendError.error || errorMessage;
      } catch (e) {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      return NextResponse.json(
        { code: 1, status: 'error', message: errorMessage, details: backendError },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.code === 0 && data.data === true) {
      return NextResponse.json({
        code: 0,
        status: 'success',
        data: true,
        message: 'Session saved successfully'
      });
    } else {
      return NextResponse.json(
        {
          code: 1,
          status: 'error',
          message: data.message || 'Failed to save session',
          data: false
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { code: 1, status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
