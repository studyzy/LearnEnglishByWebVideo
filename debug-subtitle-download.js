// Debug Subtitle Download
// Paste this into YouTube video page console to debug subtitle download
(async function() {
  console.clear();
  console.log('='.repeat(80));
  console.log('DEBUG SUBTITLE DOWNLOAD');
  console.log('='.repeat(80));
  
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
  
  // Find English track
  const enTrack = tracks.find(t => t.languageCode === 'en');
  if (!enTrack) {
    console.error('❌ No English track found');
    return;
  }
  
  console.log('English track:', enTrack.name?.simpleText);
  console.log('Base URL:', enTrack.baseUrl);
  console.log('');
  
  // Parse the base URL
  const baseUrl = new URL(enTrack.baseUrl);
  console.log('URL hostname:', baseUrl.hostname);
  console.log('URL pathname:', baseUrl.pathname);
  console.log('Original params:');
  for (const [key, value] of baseUrl.searchParams.entries()) {
    console.log(`  ${key} = ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
  }
  console.log('');
  
  // Try different download methods
  const methods = [
    {
      name: 'Method 1: fmt=json3, no other changes',
      setup: (url) => {
        url.searchParams.set('fmt', 'json3');
      }
    },
    {
      name: 'Method 2: fmt=json3 + remove signature params',
      setup: (url) => {
        url.searchParams.set('fmt', 'json3');
        url.searchParams.delete('signature');
        url.searchParams.delete('expire');
      }
    },
    {
      name: 'Method 3: fmt=json3 + keep all original params',
      setup: (url) => {
        url.searchParams.set('fmt', 'json3');
      }
    },
    {
      name: 'Method 4: fmt=srv3 (alternative format)',
      setup: (url) => {
        url.searchParams.set('fmt', 'srv3');
      }
    },
    {
      name: 'Method 5: fmt=vtt (WebVTT format)',
      setup: (url) => {
        url.searchParams.set('fmt', 'vtt');
      }
    }
  ];
  
  for (const method of methods) {
    console.log('='.repeat(80));
    console.log(`Testing: ${method.name}`);
    console.log('-'.repeat(80));
    
    try {
      const url = new URL(enTrack.baseUrl);
      method.setup(url);
      
      const finalUrl = url.toString();
      console.log('Final URL length:', finalUrl.length);
      console.log('Final URL:', finalUrl.substring(0, 150) + '...');
      console.log('');
      
      console.log('Making fetch request...');
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': window.location.href,
          'Origin': 'https://www.youtube.com',
        },
        credentials: 'include',
        cache: 'no-cache',
      });
      
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:');
      for (const [key, value] of response.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      console.log('');
      console.log('Content-Type:', contentType);
      console.log('Content-Length:', contentLength);
      
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText.substring(0, 200));
        continue;
      }
      
      const text = await response.text();
      console.log('Response length:', text.length, 'bytes');
      
      if (!text || text.trim().length === 0) {
        console.error('❌ Empty response');
        continue;
      }
      
      console.log('Response preview (first 500 chars):');
      console.log(text.substring(0, 500));
      console.log('');
      
      // Try to parse if JSON
      if (contentType?.includes('json') || method.name.includes('json3')) {
        try {
          const data = JSON.parse(text);
          console.log('✓ Valid JSON');
          console.log('JSON keys:', Object.keys(data));
          
          if (data.events) {
            const segments = data.events
              .filter(e => e.segs?.length > 0)
              .map(e => ({
                start: (e.tStartMs || 0) / 1000,
                text: e.segs.map(s => s.utf8 || '').join('').trim()
              }))
              .filter(s => s.text);
            
            console.log(`✓✓✓ SUCCESS! Parsed ${segments.length} segments`);
            console.log('First 3 segments:');
            segments.slice(0, 3).forEach((s, i) => {
              console.log(`  [${i}] ${s.start.toFixed(2)}s: "${s.text}"`);
            });
            
            console.log('');
            console.log('='.repeat(80));
            console.log('✓✓✓ THIS METHOD WORKS! ✓✓✓');
            console.log('='.repeat(80));
            
            return { method: method.name, segments, url: finalUrl };
          }
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError.message);
        }
      } else {
        console.log('✓ Non-JSON response (might be VTT or SRV3)');
        console.log('Response type:', contentType);
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error('Stack:', error.stack);
    }
    
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log('DEBUG COMPLETE');
  console.log('='.repeat(80));
})();
