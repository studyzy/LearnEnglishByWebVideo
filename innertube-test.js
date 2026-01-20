// InnerTube API Test - The REAL Solution
// This is what yt-dlp uses to get the full caption URLs
// Paste this into YouTube video console

(async function() {
  console.clear();
  console.log('='.repeat(80));
  console.log('YOUTUBE INNERTUBE API TEST');
  console.log('Based on yt-dlp implementation');
  console.log('='.repeat(80));
  
  // Get video ID
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) {
    console.error('❌ Not on YouTube video page');
    return;
  }
  
  console.log('Video ID:', videoId);
  console.log('');
  
  // Extract API configuration from page
  const ytcfg = window.ytcfg?.data_;
  
  if (!ytcfg) {
    console.warn('⚠️  No ytcfg found, using defaults');
  }
  
  // Get API key (usually public)
  const apiKey = ytcfg?.INNERTUBE_API_KEY || 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
  const clientVersion = ytcfg?.INNERTUBE_CLIENT_VERSION || '2.20240101.00.00';
  const clientName = ytcfg?.INNERTUBE_CLIENT_NAME || 'WEB';
  
  console.log('API Configuration:');
  console.log('  API Key:', apiKey.substring(0, 20) + '...');
  console.log('  Client Name:', clientName);
  console.log('  Client Version:', clientVersion);
  console.log('');
  
  // Build InnerTube request
  const request = {
    context: {
      client: {
        clientName: clientName,
        clientVersion: clientVersion,
        hl: 'en',
        gl: 'US',
        userAgent: navigator.userAgent,
      },
    },
    videoId: videoId,
  };
  
  const apiUrl = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}&prettyPrint=false`;
  
  console.log('Making InnerTube API request...');
  console.log('URL:', apiUrl);
  console.log('Request body:', JSON.stringify(request, null, 2).substring(0, 300) + '...');
  console.log('');
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Origin': 'https://www.youtube.com',
        'Referer': window.location.href,
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': clientVersion,
      },
      body: JSON.stringify(request),
      credentials: 'include',
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('❌ API request failed');
      const errorText = await response.text();
      console.error('Error:', errorText.substring(0, 500));
      return;
    }
    
    const playerResponse = await response.json();
    console.log('✓ Got player response');
    console.log('');
    
    // Extract caption tracks
    console.log('Extracting caption tracks...');
    const captions = playerResponse.captions?.playerCaptionsTracklistRenderer;
    
    if (!captions) {
      console.error('❌ No captions in player response');
      console.log('Available keys:', Object.keys(playerResponse));
      return;
    }
    
    const tracks = captions.captionTracks || [];
    console.log(`✓ Found ${tracks.length} caption tracks`);
    console.log('');
    
    // List all tracks
    tracks.forEach((track, i) => {
      console.log(`Track [${i}]:`, track.languageCode, '-', track.name?.simpleText);
      console.log('  BaseURL length:', track.baseUrl?.length || 0);
      if (i === 0 && track.baseUrl) {
        console.log('  BaseURL preview:', track.baseUrl.substring(0, 150) + '...');
      }
    });
    console.log('');
    
    // Find English track
    const enTrack = tracks.find(t => t.languageCode === 'en' && t.kind !== 'asr') ||
                    tracks.find(t => t.languageCode === 'en') ||
                    tracks.find(t => t.languageCode.startsWith('en'));
    
    if (!enTrack) {
      console.error('❌ No English track found');
      return;
    }
    
    console.log('='.repeat(80));
    console.log('SELECTED ENGLISH TRACK');
    console.log('='.repeat(80));
    console.log('Language:', enTrack.languageCode);
    console.log('Name:', enTrack.name?.simpleText);
    console.log('Kind:', enTrack.kind || 'standard');
    console.log('BaseURL length:', enTrack.baseUrl?.length || 0);
    console.log('');
    
    if (!enTrack.baseUrl || enTrack.baseUrl.length < 500) {
      console.error('❌ BaseURL is too short or missing!');
      console.log('Expected > 500 chars, got:', enTrack.baseUrl?.length || 0);
      console.log('This might be a restricted video or there\'s an API issue');
      return;
    }
    
    console.log('✓ BaseURL looks good (length:', enTrack.baseUrl.length, ')');
    console.log('');
    
    // Now download subtitle
    console.log('Downloading subtitle...');
    const subtitleUrl = enTrack.baseUrl + '&fmt=json3';
    
    const subtitleResponse = await fetch(subtitleUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Referer': window.location.href,
      },
      credentials: 'include',
    });
    
    console.log('Subtitle response status:', subtitleResponse.status);
    
    if (!subtitleResponse.ok) {
      console.error('❌ Subtitle download failed');
      return;
    }
    
    const subtitleText = await subtitleResponse.text();
    console.log('✓ Subtitle downloaded');
    console.log('  Response length:', subtitleText.length, 'bytes');
    console.log('');
    
    if (subtitleText.length === 0) {
      console.error('❌ Empty subtitle response');
      return;
    }
    
    // Parse subtitle
    const subtitleData = JSON.parse(subtitleText);
    
    if (!subtitleData.events) {
      console.error('❌ No events in subtitle data');
      return;
    }
    
    const segments = subtitleData.events
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
    console.log('InnerTube API method SUCCESSFUL!');
    console.log('This is the method we need to use in the extension.');
    console.log('='.repeat(80));
    
    // Store for inspection
    window.innertubeSubtitles = segments;
    window.innertubePlayerResponse = playerResponse;
    
    console.log('');
    console.log('💾 Data saved to:');
    console.log('   window.innertubeSubtitles - The extracted segments');
    console.log('   window.innertubePlayerResponse - The full player response');
    
    return segments;
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
})();
