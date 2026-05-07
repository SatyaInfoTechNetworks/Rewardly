import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 1. Dynamic Parameters
  const userId = searchParams.get('userId') || '1981634693';
  const forwarded = request.headers.get('x-forwarded-for');
  let ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
  
  // Force a valid public IP for local development if loopback detected
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.')) {
    ip = '106.77.166.201'; // User's confirmed working IP
  }

  const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

  // 2. CPX Credentials
  const APP_ID = "32901";
  const APP_SECURE_HASH = "Pt4XTKEkCDmS0nNumbUQC0tCS3qx48qx";
  
  // 3. Generate Secure Hash (md5(userId-secret))
  const hashInput = `${userId}-${APP_SECURE_HASH}`;
  const secureHash = crypto.createHash('md5').update(hashInput).digest('hex');
  
  // 4. Construct CPX Request URL
  const cpxUrl = new URL('https://live-api.cpx-research.com/api/get-surveys.php');
  cpxUrl.searchParams.append('app_id', APP_ID);
  cpxUrl.searchParams.append('email', '');
  cpxUrl.searchParams.append('ext_user_id', userId);
  cpxUrl.searchParams.append('subid_1', '');
  cpxUrl.searchParams.append('subid_2', '');
  cpxUrl.searchParams.append('output_method', 'api');
  cpxUrl.searchParams.append('ip_user', ip);
  cpxUrl.searchParams.append('user_agent', userAgent);
  cpxUrl.searchParams.append('limit', '12');
  cpxUrl.searchParams.append('secure_hash', secureHash);

  try {
    const response = await fetch(cpxUrl.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      console.error('CPX Raw Response Error:', text);
      return NextResponse.json({ status: 'error', message: text }, { status: 400 });
    }
  } catch (error) {
    console.error('CPX Proxy Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch surveys' }, { status: 500 });
  }
}
