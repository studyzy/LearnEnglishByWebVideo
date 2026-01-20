// Working Subtitle Download
// Based on yt-dlp's successful approach
// Paste this into YouTube video page console

(async function() {
  console.clear();
  console.log('='.repeat(80));
  console.log('WORKING SUBTITLE DOWNLOAD (yt-dlp method)');
  console.log('='.repeat(80));
  
  // Get video ID
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  
  if (!videoId) {
    console.error('❌ Not on YouTube video page');
    return;
  }
  
  console.log('Video ID:', videoId);
  console.log('');
  
  // Get player response
  const playerResponse = window.ytInitialPlayerResponse;
  if (!playerResponse) {
    console.error('❌ No ytInitialPlayerResponse found');
    return;
  }
  
  // Get caption tracks
  const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  console.log(`Found ${tracks.length} caption tracks`);
  
  if (tracks.length === 0) {
    console.error('❌ No caption tracks available');
    return;
  }
  
  // List all tracks
  console.log('\nAvailable tracks:');
  tracks.forEach((t, i) => {
    console.log(`  [${i}] ${t.languageCode} - ${t.name?.simpleText || 'Unknown'} (${t.kind === 'asr' ? 'auto' : 'manual'})`);
  });
  
  // Find English track
  const enTrack = tracks.find(t => t.languageCode === 'en' && t.kind !== 'asr') ||
                  tracks.find(t => t.languageCode === 'en') ||
                  tracks.find(t => t.languageCode.startsWith('en'));
  
  if (!enTrack) {
    console.error('❌ No English track found');
    return;
  }
  
  console.log('\n✓ Selected English track:', enTrack.name?.simpleText);
  console.log('');
  
  // IMPORTANT: Parse the base URL correctly
  const baseUrl = enTrack.baseUrl;
  console.log('Original baseUrl length:', baseUrl.length);
  
  // According to yt-dlp, we need to:
  // 1. Keep the base URL as-is
  // 2. Add fmt parameter
  // 3. NOT remove signature/expire parameters (they're required!)
  
  const url = new URL(baseUrl);
  
  // Method from yt-dlp: Just add fmt parameter, keep everything else
  url.searchParams.set('fmt', 'json3');
  
  // yt-dlp also removes xosf to avoid undesirable text position data
  // But first let's try with it
  
  const finalUrl = url.toString();
  console.log('Final URL length:', finalUrl.length);
  console.log('Final URL preview:', finalUrl.substring(0, 200) + '...');
  console.log('');
  
  // Now fetch with proper headers
  console.log('Fetching subtitle data...');
  console.log('Using credentials: include (to send cookies)');
  console.log('');
  
  try {
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': window.location.href,
        'Origin': window.location.origin,
        'User-Agent': navigator.userAgent,
      },
      credentials: 'include', // CRITICAL: Include cookies
      cache: 'default',
      mode: 'cors',
    });
    
    console.log('Response received:');
    console.log('  Status:', response.status, response.statusText);
    console.log('  OK:', response.ok);
    console.log('  Content-Type:', response.headers.get('content-type'));
    console.log('  Content-Length:', response.headers.get('content-length'));
    console.log('');
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText.substring(0, 500));
      return;
    }
    
    // Read response
    const text = await response.text();
    console.log('✓ Response received');
    console.log('  Length:', text.length, 'bytes');
    console.log('');
    
    if (!text || text.trim().length === 0) {
      console.error('❌ EMPTY RESPONSE!');
      console.log('');
      console.log('The response is empty. Possible issues:');
      console.log('  1. The signature has expired (try refreshing the page)');
      console.log('  2. Cookie/authentication issue');
      console.log('  3. Rate limiting');
      console.log('');
      console.log('Try these solutions:');
      console.log('  1. Refresh the page (F5)');
      console.log('  2. Make sure you\'re logged into YouTube');
      console.log('  3. Try in an incognito window');
      return;
    }
    
    // Parse JSON
    console.log('Parsing JSON...');
    let data;
    try {
      data = JSON.parse(text);
      console.log('✓ Valid JSON');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      console.log('Response preview:', text.substring(0, 500));
      return;
    }
    
    // Extract segments
    if (!data.events) {
      console.error('❌ No events array in response');
      console.log('Response keys:', Object.keys(data));
      console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
      return;
    }
    
    console.log('✓ Found events array');
    console.log('  Total events:', data.events.length);
    console.log('');
    
    // Parse segments
    const segments = data.events
      .filter(e => e.segs && e.segs.length > 0)
      .map(e => ({
        start: (e.tStartMs || 0) / 1000,
        end: ((e.tStartMs || 0) + (e.dDurationMs || 0)) / 1000,
        text: e.segs.map(s => s.utf8 || '').join('').trim()
      }))
      .filter(s => s.text);
    
    console.log('='.repeat(80));
    console.log('✓✓✓ SUCCESS! ✓✓✓');
    console.log('='.repeat(80));
    console.log(`Extracted ${segments.length} subtitle segments`);
    console.log('');
    console.log('First 5 segments:');
    segments.slice(0, 5).forEach((s, i) => {
      console.log(`\n[${i}] ${s.start.toFixed(2)}s - ${s.end.toFixed(2)}s`);
      console.log(`    "${s.text}"`);
    });
    console.log('');
    console.log('='.repeat(80));
    console.log(`Total: ${segments.length} segments extracted successfully!`);
    console.log('='.repeat(80));
    
    // Store in window for inspection
    window.extractedSubtitles = segments;
    console.log('');
    console.log('💡 Subtitles saved to window.extractedSubtitles');
    console.log('   Access them with: window.extractedSubtitles');
    
    return segments;
    
  } catch (error) {
    console.error('❌ Error during fetch:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
  }
})();
