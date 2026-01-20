// FINAL SOLUTION - Access YouTube player's internal caption data
// The player MUST have the captions loaded to display them!
(async function() {
  console.clear();
  console.log('='.repeat(80));
  console.log('FINAL SOLUTION: Accessing YouTube Player Internal Data');
  console.log('='.repeat(80));
  
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) return console.error('Not on video page');
  
  console.log('Video ID:', videoId);
  console.log('');
  
  // Method 1: Try to get captions from player object
  console.log('Method 1: Checking movie_player object...');
  const player = document.getElementById('movie_player');
  
  if (player) {
    console.log('✓ Found movie_player element');
    
    // Check if player has getPlayerResponse
    if (typeof player.getPlayerResponse === 'function') {
      try {
        const playerResponse = player.getPlayerResponse();
        console.log('✓ Got player response from player object');
        
        const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        console.log('Tracks from player:', tracks.length);
        
        if (tracks.length > 0) {
          const enTrack = tracks.find(t => t.languageCode === 'en');
          if (enTrack) {
            console.log('BaseURL length from player:', enTrack.baseUrl?.length);
            
            if (enTrack.baseUrl && enTrack.baseUrl.length > 500) {
              console.log('✓✓✓ Player has FULL baseURL!');
              
              // Try to download
              const url = enTrack.baseUrl + '&fmt=json3';
              const res = await fetch(url, { credentials: 'include' });
              const text = await res.text();
              
              if (text.length > 0) {
                const data = JSON.parse(text);
                const segments = data.events?.filter(e => e.segs?.length).length || 0;
                console.log('🎉 SUCCESS! Got', segments, 'segments from player baseURL');
                return { method: 'player.getPlayerResponse()', segments };
              }
            }
          }
        }
      } catch (e) {
        console.warn('Player method failed:', e.message);
      }
    }
  }
  
  // Method 2: Enable captions and intercept the request
  console.log('');
  console.log('Method 2: Intercepting caption load requests...');
  console.log('This requires enabling captions first.');
  console.log('');
  
  // Store original fetch
  const originalFetch = window.fetch;
  let capturedUrl = null;
  
  // Intercept fetch requests
  window.fetch = function(...args) {
    const url = args[0];
    
    // Check if this is a timedtext request
    if (typeof url === 'string' && url.includes('/api/timedtext')) {
      console.log('✓ Captured timedtext request!');
      console.log('URL length:', url.length);
      
      if (url.length > 500) {
        capturedUrl = url;
        console.log('✓✓✓ This URL looks complete!');
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('Fetch interceptor installed.');
  console.log('Now trying to enable captions programmatically...');
  
  // Try to enable captions
  if (player && typeof player.loadModule === 'function') {
    try {
      player.loadModule('captions');
      console.log('✓ Loaded captions module');
      
      // Wait a bit for captions to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (capturedUrl) {
        console.log('');
        console.log('='.repeat(80));
        console.log('🎉 CAPTURED WORKING URL!');
        console.log('='.repeat(80));
        console.log('URL:', capturedUrl.substring(0, 200) + '...');
        
        // Try to use it
        const res = await originalFetch(capturedUrl + '&fmt=json3', { credentials: 'include' });
        const text = await res.text();
        
        if (text.length > 0) {
          const data = JSON.parse(text);
          const segments = data.events?.filter(e => e.segs?.length).length || 0;
          console.log('✓ Got', segments, 'segments');
          
          // Restore fetch
          window.fetch = originalFetch;
          
          return { method: 'intercepted', url: capturedUrl, segments };
        }
      }
    } catch (e) {
      console.warn('Caption load failed:', e.message);
    }
  }
  
  // Restore fetch
  window.fetch = originalFetch;
  
  // Method 3: Manual - ask user to enable captions
  console.log('');
  console.log('='.repeat(80));
  console.log('Method 3: Manual Capture');
  console.log('='.repeat(80));
  console.log('');
  console.log('Please do the following:');
  console.log('1. Click the CC (captions) button on the video player');
  console.log('2. Select "English" if asked');
  console.log('3. Run this script again');
  console.log('');
  console.log('The interceptor will capture the working URL!');
  
})();
