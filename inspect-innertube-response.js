// Inspect InnerTube Response
(async function() {
  console.clear();
  console.log('INSPECTING INNERTUBE RESPONSE');
  
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) return console.error('Not on video page');
  
  const ytcfg = window.ytcfg?.data_;
  const apiKey = ytcfg?.INNERTUBE_API_KEY || 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
  const clientVersion = ytcfg?.INNERTUBE_CLIENT_VERSION || '2.20240101.00.00';
  
  const request = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: clientVersion,
        hl: 'en',
        gl: 'US',
      },
    },
    videoId: videoId,
  };
  
  console.log('Calling InnerTube API...');
  
  const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://www.youtube.com',
      'Referer': window.location.href,
    },
    body: JSON.stringify(request),
    credentials: 'include',
  });
  
  const playerResponse = await response.json();
  
  console.log('Response keys:', Object.keys(playerResponse));
  console.log('');
  console.log('Has captions?', !!playerResponse.captions);
  console.log('Has videoDetails?', !!playerResponse.videoDetails);
  console.log('Has streamingData?', !!playerResponse.streamingData);
  console.log('');
  
  if (playerResponse.captions) {
    console.log('Captions structure:', JSON.stringify(playerResponse.captions, null, 2).substring(0, 1000));
  } else {
    console.log('NO CAPTIONS in InnerTube response!');
    console.log('');
    console.log('Full response (first 2000 chars):');
    console.log(JSON.stringify(playerResponse, null, 2).substring(0, 2000));
  }
  
  console.log('');
  console.log('Now comparing with window.ytInitialPlayerResponse...');
  
  const pageResponse = window.ytInitialPlayerResponse;
  if (pageResponse) {
    console.log('Page response has captions?', !!pageResponse.captions);
    
    if (pageResponse.captions) {
      const tracks = pageResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      console.log('Page response has', tracks.length, 'tracks');
      
      if (tracks.length > 0) {
        console.log('First track baseURL length:', tracks[0].baseUrl?.length);
        console.log('');
        console.log('CONCLUSION: We need to use the page ytInitialPlayerResponse');
        console.log('BUT the baseURL is incomplete (331 chars, ip=0.0.0.0)');
        console.log('');
        console.log('Let me try different InnerTube clients...');
      }
    }
  }
  
  window.innertubeResponse = playerResponse;
  window.pageResponse = pageResponse;
  
  console.log('');
  console.log('Saved to window.innertubeResponse and window.pageResponse');
})();
