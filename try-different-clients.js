// Try Different InnerTube Clients
// yt-dlp uses multiple clients: web, android, ios, tv_embedded, etc.
(async function() {
  console.clear();
  console.log('='.repeat(80));
  console.log('TRYING DIFFERENT INNERTUBE CLIENTS');
  console.log('='.repeat(80));
  
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) return console.error('Not on video page');
  
  console.log('Video ID:', videoId);
  console.log('');
  
  const ytcfg = window.ytcfg?.data_;
  const apiKey = ytcfg?.INNERTUBE_API_KEY || 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
  
  // Different client configurations (from yt-dlp)
  const clients = [
    {
      name: 'WEB',
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20240101.00.00',
          hl: 'en',
          gl: 'US',
        }
      }
    },
    {
      name: 'ANDROID',
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '19.09.37',
          androidSdkVersion: 30,
          hl: 'en',
          gl: 'US',
        }
      }
    },
    {
      name: 'IOS',
      context: {
        client: {
          clientName: 'IOS',
          clientVersion: '19.09.3',
          deviceMake: 'Apple',
          deviceModel: 'iPhone14,3',
          hl: 'en',
          gl: 'US',
        }
      }
    },
    {
      name: 'MWEB',
      context: {
        client: {
          clientName: 'MWEB',
          clientVersion: '2.20240101.00.00',
          hl: 'en',
          gl: 'US',
        }
      }
    },
    {
      name: 'TV_EMBEDDED',
      context: {
        client: {
          clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
          clientVersion: '2.0',
          hl: 'en',
          gl: 'US',
        }
      }
    },
  ];
  
  for (const client of clients) {
    console.log('='.repeat(80));
    console.log(`Testing client: ${client.name}`);
    console.log('-'.repeat(80));
    
    try {
      const request = {
        context: client.context,
        videoId: videoId,
      };
      
      const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.youtube.com',
          'Referer': window.location.href,
          'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify(request),
        credentials: 'include',
      });
      
      console.log('Status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Request failed');
        continue;
      }
      
      const playerResponse = await response.json();
      
      const hasCaptions = !!playerResponse.captions;
      const hasStreamingData = !!playerResponse.streamingData;
      
      console.log('Has captions:', hasCaptions);
      console.log('Has streamingData:', hasStreamingData);
      
      if (hasCaptions) {
        const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        console.log('Caption tracks:', tracks.length);
        
        if (tracks.length > 0) {
          const enTrack = tracks.find(t => t.languageCode === 'en');
          if (enTrack) {
            console.log('✓ Found English track!');
            console.log('  Name:', enTrack.name?.simpleText);
            console.log('  BaseURL length:', enTrack.baseUrl?.length || 0);
            
            if (enTrack.baseUrl && enTrack.baseUrl.length > 500) {
              console.log('');
              console.log('✓✓✓ THIS CLIENT WORKS! ✓✓✓');
              console.log('Client:', client.name);
              console.log('BaseURL length:', enTrack.baseUrl.length);
              
              // Try to download
              console.log('');
              console.log('Trying to download subtitle...');
              const subUrl = enTrack.baseUrl + '&fmt=json3';
              const subRes = await fetch(subUrl, { credentials: 'include' });
              const subText = await subRes.text();
              
              console.log('Subtitle response length:', subText.length);
              
              if (subText.length > 0) {
                const data = JSON.parse(subText);
                const segments = data.events
                  ?.filter(e => e.segs?.length)
                  .map(e => ({
                    start: (e.tStartMs || 0) / 1000,
                    text: e.segs.map(s => s.utf8).join('').trim()
                  }))
                  .filter(s => s.text) || [];
                
                console.log('');
                console.log('='.repeat(80));
                console.log('🎉 SUCCESS! 🎉');
                console.log('='.repeat(80));
                console.log('Client:', client.name);
                console.log('Segments:', segments.length);
                console.log('');
                console.log('First 3 segments:');
                segments.slice(0, 3).forEach(s => 
                  console.log(`  ${s.start.toFixed(2)}s: ${s.text}`)
                );
                
                window.workingClient = client.name;
                window.workingSegments = segments;
                
                console.log('');
                console.log('💾 Saved to window.workingClient and window.workingSegments');
                
                return { client: client.name, segments };
              }
            } else {
              console.log('⚠️  BaseURL too short:', enTrack.baseUrl?.length || 0);
            }
          }
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  
  console.log('='.repeat(80));
  console.log('Finished testing all clients');
  console.log('='.repeat(80));
})();
