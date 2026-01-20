// SIMPLEST TEST - Paste in YouTube video console
(async () => {
  const videoId = new URLSearchParams(location.search).get('v');
  if (!videoId) return console.error('Not on video page');
  
  const track = window.ytInitialPlayerResponse?.captions
    ?.playerCaptionsTracklistRenderer?.captionTracks
    ?.find(t => t.languageCode === 'en');
  
  if (!track) return console.error('No English track');
  
  console.log('Found English track:', track.name?.simpleText);
  console.log('BaseURL length:', track.baseUrl?.length || 0);
  
  if (!track.baseUrl || track.baseUrl.length === 0) {
    console.error('❌ BaseURL is empty or missing!');
    return;
  }
  
  const url = track.baseUrl + '&fmt=json3';
  console.log('Downloading from:', url.substring(0, 150) + '...');
  
  const res = await fetch(url, { credentials: 'include' });
  console.log('Status:', res.status);
  
  const text = await res.text();
  console.log('Response length:', text.length);
  
  if (text.length === 0) {
    console.error('❌ EMPTY RESPONSE');
    console.log('Possible fixes:');
    console.log('1. Press F5 to refresh page');
    console.log('2. Make sure you are logged into YouTube');
    console.log('3. Wait a few seconds and try again');
    return;
  }
  
  const data = JSON.parse(text);
  const count = data.events?.length || 0;
  console.log('✓ SUCCESS! Got', count, 'events');
  
  if (count > 0) {
    const segments = data.events
      .filter(e => e.segs?.length)
      .map(e => ({
        time: (e.tStartMs || 0) / 1000,
        text: e.segs.map(s => s.utf8).join('').trim()
      }))
      .filter(s => s.text);
    
    console.log('Parsed', segments.length, 'segments');
    console.log('First 3:');
    segments.slice(0, 3).forEach(s => 
      console.log(`  ${s.time}s: ${s.text}`)
    );
  }
})();
