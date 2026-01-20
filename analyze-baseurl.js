// Analyze BaseURL - See what's actually in it
(function() {
  console.clear();
  console.log('ANALYZING CAPTION BASE URL');
  console.log('='.repeat(80));
  
  const track = window.ytInitialPlayerResponse?.captions
    ?.playerCaptionsTracklistRenderer?.captionTracks
    ?.find(t => t.languageCode === 'en');
  
  if (!track) {
    console.error('No English track');
    return;
  }
  
  console.log('Track found:', track.name?.simpleText);
  console.log('BaseURL:', track.baseUrl);
  console.log('BaseURL length:', track.baseUrl?.length);
  console.log('');
  
  if (!track.baseUrl) {
    console.error('No baseURL!');
    return;
  }
  
  // Parse URL
  try {
    const url = new URL(track.baseUrl);
    console.log('URL Analysis:');
    console.log('  Hostname:', url.hostname);
    console.log('  Pathname:', url.pathname);
    console.log('  Search params count:', url.searchParams.size);
    console.log('');
    console.log('Parameters:');
    
    const params = {};
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
      if (value.length > 50) {
        console.log(`  ${key}: ${value.substring(0, 50)}... (${value.length} chars)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('IMPORTANT FINDINGS:');
    console.log('='.repeat(80));
    
    // Check for problematic parameters
    if (params.ip === '0.0.0.0') {
      console.log('⚠️  IP is 0.0.0.0 - This is the problem!');
      console.log('   This means YouTube intentionally gave us a fake/incomplete URL');
      console.log('');
    }
    
    if (!params.signature && !params.sig) {
      console.log('⚠️  No signature parameter - URL might be incomplete');
    }
    
    if (url.searchParams.size < 10) {
      console.log('⚠️  Very few parameters (', url.searchParams.size, ') - URL seems incomplete');
    }
    
    console.log('');
    console.log('This explains why direct download fails!');
    console.log('The baseURL from ytInitialPlayerResponse is intentionally incomplete.');
    console.log('');
    console.log('yt-dlp solves this by:');
    console.log('1. Using impersonate=True (browser impersonation)');
    console.log('2. Using cookies from the browser');
    console.log('3. Trying multiple player API clients');
    console.log('');
    console.log('Since we\'re IN the browser, we already have cookies.');
    console.log('But the baseURL itself is the problem.');
    
  } catch (e) {
    console.error('Failed to parse URL:', e);
  }
})();
