// Inspect Caption Tracks
// Paste this into YouTube video page console
(function() {
  console.clear();
  console.log('='.repeat(80));
  console.log('INSPECT CAPTION TRACKS');
  console.log('='.repeat(80));
  
  const playerResponse = window.ytInitialPlayerResponse;
  
  if (!playerResponse) {
    console.error('❌ No ytInitialPlayerResponse found');
    return;
  }
  
  const captions = playerResponse.captions;
  if (!captions) {
    console.error('❌ No captions in player response');
    console.log('Available keys:', Object.keys(playerResponse));
    return;
  }
  
  const renderer = captions.playerCaptionsTracklistRenderer;
  if (!renderer) {
    console.error('❌ No playerCaptionsTracklistRenderer');
    console.log('Captions keys:', Object.keys(captions));
    return;
  }
  
  const tracks = renderer.captionTracks || [];
  console.log(`Found ${tracks.length} caption tracks\n`);
  
  tracks.forEach((track, index) => {
    console.log(`Track ${index}: ${track.languageCode}`);
    console.log('  Name:', track.name?.simpleText || track.name?.runs?.[0]?.text);
    console.log('  Kind:', track.kind || 'standard');
    console.log('  Is auto-generated:', track.kind === 'asr');
    
    if (track.baseUrl) {
      const url = new URL(track.baseUrl);
      console.log('  Base URL host:', url.hostname);
      console.log('  Base URL path:', url.pathname);
      console.log('  URL parameters:');
      
      const importantParams = ['v', 'lang', 'name', 'kind', 'fmt', 'signature', 'expire'];
      importantParams.forEach(param => {
        const value = url.searchParams.get(param);
        if (value) {
          if (param === 'signature') {
            console.log(`    ${param}: ${value.substring(0, 20)}...`);
          } else {
            console.log(`    ${param}: ${value}`);
          }
        }
      });
      
      console.log('  Full URL length:', track.baseUrl.length);
      console.log('  Full URL:', track.baseUrl.substring(0, 200) + '...\n');
    } else {
      console.log('  ❌ No baseUrl!\n');
    }
  });
  
  // Find English track and try to download
  const enTrack = tracks.find(t => t.languageCode === 'en');
  if (enTrack) {
    console.log('='.repeat(80));
    console.log('ENGLISH TRACK SELECTED');
    console.log('='.repeat(80));
    console.log('Language:', enTrack.languageCode);
    console.log('Name:', enTrack.name?.simpleText);
    console.log('Auto-generated:', enTrack.kind === 'asr');
    console.log('');
    
    // Check if baseUrl has required parameters
    const url = new URL(enTrack.baseUrl);
    const hasV = url.searchParams.has('v');
    const hasLang = url.searchParams.has('lang');
    const hasSignature = url.searchParams.has('signature');
    
    console.log('URL Validation:');
    console.log('  Has "v" param:', hasV, hasV ? `(${url.searchParams.get('v')})` : '');
    console.log('  Has "lang" param:', hasLang, hasLang ? `(${url.searchParams.get('lang')})` : '');
    console.log('  Has "signature" param:', hasSignature);
    console.log('');
    
    // Try a simple fetch
    console.log('Trying to fetch subtitle...');
    
    const testUrl = new URL(enTrack.baseUrl);
    testUrl.searchParams.set('fmt', 'json3');
    
    fetch(testUrl.toString(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': '*/*',
        'Referer': window.location.href,
      }
    })
    .then(response => {
      console.log('Response status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));
      console.log('Content-Length:', response.headers.get('content-length'));
      return response.text();
    })
    .then(text => {
      console.log('Response length:', text.length);
      if (text.length === 0) {
        console.error('❌ EMPTY RESPONSE!');
        console.log('');
        console.log('This is the problem. The URL returns empty content.');
        console.log('Possible causes:');
        console.log('  1. Signature expired');
        console.log('  2. Missing required parameters');
        console.log('  3. Wrong format parameter');
        console.log('  4. Region restriction');
      } else {
        console.log('✓ Got response!');
        console.log('Preview:', text.substring(0, 300));
        
        try {
          const data = JSON.parse(text);
          console.log('✓ Valid JSON');
          console.log('Has events:', !!data.events);
          if (data.events) {
            console.log('Events count:', data.events.length);
          }
        } catch (e) {
          console.log('Not JSON or parse failed');
        }
      }
    })
    .catch(error => {
      console.error('❌ Fetch failed:', error);
    });
  }
  
  console.log('\n' + '='.repeat(80));
})();
