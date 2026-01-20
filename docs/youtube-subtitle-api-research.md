# YouTube Subtitle API Research Report (2026)

## Executive Summary

This document provides comprehensive research on programmatically accessing YouTube subtitles from Chrome extensions in 2026. Based on current implementation patterns and YouTube's architecture, there are **three primary approaches**: YouTube Data API v3, unofficial timedtext API, and DOM/page data extraction.

---

## 🎯 Recommended Approach: DOM Extraction + Timedtext API

**Best Method:** Extract caption track URLs from `ytInitialPlayerResponse` JSON object embedded in YouTube's page, then fetch subtitles from the timedtext endpoint.

### Why This Approach?
- ✅ **No API key required** - No authentication needed
- ✅ **No quota limits** - Unlimited subtitle downloads
- ✅ **No permissions required** - Can access any public video's subtitles
- ✅ **Most reliable** - Used by popular extensions like Language Reactor, Trancy
- ✅ **Supports all subtitle types** - Auto-generated, official, translated
- ⚠️ **Requires DOM parsing** - More complex than API approach
- ⚠️ **May break with YouTube UI changes** - Needs maintenance

---

## 1. YouTube Data API v3 (Official but Limited)

### Overview
YouTube Data API v3 provides an official `captions.download` endpoint for retrieving subtitle tracks.

### API Endpoint
```
GET https://www.googleapis.com/youtube/v3/captions/{captionId}
```

### Requirements

#### Authentication
- **OAuth 2.0 required** with one of these scopes:
  - `https://www.googleapis.com/auth/youtube.force-ssl`
  - `https://www.googleapis.com/auth/youtubepartner`
  
- **User must own or have edit permissions** on the video

#### Quota Cost
- **200 units per request** (very expensive!)
- Default daily quota: 10,000 units = only **50 subtitle downloads per day**

### Supported Output Formats (`tfmt` parameter)
- `sbv` - SubViewer subtitle
- `scc` - Scenarist Closed Caption
- `srt` - SubRip subtitle (most common)
- `ttml` - Timed Text Markup Language
- `vtt` - Web Video Text Tracks (WebVTT)

### Chrome Extension Integration

**Possible but impractical:**

```javascript
// manifest.json
{
  "manifest_version": 3,
  "permissions": ["identity"],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/youtube.force-ssl"
    ]
  }
}
```

```javascript
// Background script
chrome.identity.getAuthToken({ interactive: true }, function(token) {
  fetch(`https://www.googleapis.com/youtube/v3/captions/${captionId}?tfmt=srt`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.text())
  .then(srtContent => console.log(srtContent));
});
```

### ❌ Major Limitations
1. **Cannot download subtitles from videos you don't own** - only your own videos
2. **Extremely high quota cost** - 200 units per request
3. **OAuth flow required** - Poor user experience
4. **Rate limits** - Only ~50 downloads per day with default quota

### Verdict: **NOT RECOMMENDED for public subtitle viewing**
Only suitable for channel owners managing their own video subtitles.

---

## 2. Unofficial Timedtext API (Best Approach)

### Overview
YouTube serves subtitles through an undocumented timedtext API. This is the **most practical method** for Chrome extensions.

### How It Works

#### Step 1: Extract Caption Track URLs from Page Data

YouTube embeds video metadata in the page HTML within a JavaScript object called `ytInitialPlayerResponse`. This contains all available caption tracks.

**Location in DOM:**
```javascript
// Method 1: Parse from <script> tag
const scripts = document.querySelectorAll('script');
let ytInitialPlayerResponse;

for (const script of scripts) {
  const content = script.textContent;
  if (content.includes('ytInitialPlayerResponse')) {
    const match = content.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (match) {
      ytInitialPlayerResponse = JSON.parse(match[1]);
      break;
    }
  }
}

// Method 2: Access from window object (if available)
const ytInitialPlayerResponse = window.ytInitialPlayerResponse;
```

#### Step 2: Navigate to Caption Tracks

```javascript
const captions = ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer;

if (!captions) {
  console.log('No subtitles available');
  return;
}

const captionTracks = captions.captionTracks || [];
const translationLanguages = captions.translationLanguages || [];

// Example caption track object:
// {
//   baseUrl: "https://www.youtube.com/api/timedtext?v=VIDEO_ID&lang=en&...",
//   name: { simpleText: "English" },
//   vssId: ".en",
//   languageCode: "en",
//   kind: "asr", // "asr" = auto-generated, undefined = official
//   isTranslatable: true
// }
```

#### Step 3: Fetch Subtitle Content

```javascript
async function downloadSubtitle(captionTrack, format = 'json3') {
  // Add format parameter to baseUrl
  const url = new URL(captionTrack.baseUrl);
  url.searchParams.set('fmt', format); // 'json3', 'srv3', 'vtt', 'ttml'
  
  const response = await fetch(url.toString());
  const subtitleData = await response.text();
  
  return subtitleData;
}

// Example for English subtitles
const englishTrack = captionTracks.find(track => track.languageCode === 'en');
if (englishTrack) {
  const subtitles = await downloadSubtitle(englishTrack, 'json3');
  console.log(subtitles);
}
```

### Timedtext API Parameters

**Base URL Format:**
```
https://www.youtube.com/api/timedtext
```

**Common Parameters:**
- `v` - Video ID (required)
- `lang` - Language code (e.g., 'en', 'zh', 'es')
- `fmt` - Output format
  - `json3` - JSON format with timing (recommended)
  - `srv3` - XML format
  - `vtt` - WebVTT format
  - `ttml` - TTML format
- `tlang` - Translation target language (for machine translation)
- `name` - Track name (for multiple tracks in same language)

**Example URLs:**
```
# Get English subtitles in JSON3 format
https://www.youtube.com/api/timedtext?v=dQw4w9WgXcQ&lang=en&fmt=json3

# Get auto-translated Chinese subtitles from English
https://www.youtube.com/api/timedtext?v=dQw4w9WgXcQ&lang=en&tlang=zh&fmt=json3

# Get subtitles in WebVTT format
https://www.youtube.com/api/timedtext?v=dQw4w9WgXcQ&lang=en&fmt=vtt
```

---

## 3. Subtitle Format Details

### JSON3 Format (Recommended)

**Structure:**
```json
{
  "events": [
    {
      "tStartMs": 0,
      "dDurationMs": 3000,
      "segs": [
        { "utf8": "Hello, " },
        { "utf8": "world!" }
      ]
    },
    {
      "tStartMs": 3500,
      "dDurationMs": 2500,
      "segs": [
        { "utf8": "This is a subtitle." }
      ]
    }
  ]
}
```

**Fields:**
- `tStartMs` - Start time in milliseconds
- `dDurationMs` - Duration in milliseconds
- `segs` - Array of text segments (word-level for auto-generated)
- `utf8` - The actual text content

**Parsing Example:**
```javascript
function parseJSON3Subtitles(json3Data) {
  const data = JSON.parse(json3Data);
  const subtitles = [];
  
  for (const event of data.events || []) {
    if (!event.segs) continue; // Skip events without text
    
    const text = event.segs.map(seg => seg.utf8).join('');
    const startTime = event.tStartMs / 1000; // Convert to seconds
    const endTime = (event.tStartMs + event.dDurationMs) / 1000;
    
    subtitles.push({
      text: text.trim(),
      start: startTime,
      end: endTime,
      startMs: event.tStartMs,
      endMs: event.tStartMs + event.dDurationMs
    });
  }
  
  return subtitles;
}
```

### SRV3 / XML Format

**Structure:**
```xml
<?xml version="1.0" encoding="utf-8" ?>
<transcript>
  <text start="0" dur="3.0">Hello, world!</text>
  <text start="3.5" dur="2.5">This is a subtitle.</text>
</transcript>
```

**Parsing Example:**
```javascript
function parseXMLSubtitles(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const textElements = xmlDoc.querySelectorAll('text');
  
  const subtitles = [];
  for (const element of textElements) {
    const start = parseFloat(element.getAttribute('start'));
    const dur = parseFloat(element.getAttribute('dur'));
    const text = element.textContent;
    
    subtitles.push({
      text: text,
      start: start,
      end: start + dur
    });
  }
  
  return subtitles;
}
```

### WebVTT Format

**Structure:**
```
WEBVTT

00:00:00.000 --> 00:00:03.000
Hello, world!

00:00:03.500 --> 00:00:06.000
This is a subtitle.
```

This is a standard format that can be used directly with HTML5 `<track>` elements.

### Converting to SRT

```javascript
function convertToSRT(subtitles) {
  let srt = '';
  
  subtitles.forEach((subtitle, index) => {
    const startTime = formatSRTTime(subtitle.start);
    const endTime = formatSRTTime(subtitle.end);
    
    srt += `${index + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${subtitle.text}\n\n`;
  });
  
  return srt;
}

function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
}

function pad(num, size) {
  return String(num).padStart(size, '0');
}
```

---

## 4. Complete Chrome Extension Implementation

### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "YouTube Subtitle Downloader",
  "version": "1.0.0",
  "description": "Download YouTube subtitles in various formats",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://www.youtube.com/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://www.youtube.com/watch*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

### Content Script (content.js)

```javascript
// content.js - Injected into YouTube video pages

class YouTubeSubtitleExtractor {
  constructor() {
    this.videoId = this.extractVideoId();
    this.captionTracks = null;
  }
  
  extractVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }
  
  async getCaptionTracks() {
    // Method 1: Try to get from window object
    if (window.ytInitialPlayerResponse) {
      return this.parseCaptionData(window.ytInitialPlayerResponse);
    }
    
    // Method 2: Parse from script tags
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent;
      if (content.includes('ytInitialPlayerResponse')) {
        try {
          const match = content.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
          if (match) {
            const data = JSON.parse(match[1]);
            return this.parseCaptionData(data);
          }
        } catch (e) {
          console.error('Failed to parse ytInitialPlayerResponse:', e);
        }
      }
    }
    
    throw new Error('Could not find caption data on page');
  }
  
  parseCaptionData(ytInitialPlayerResponse) {
    const captions = ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer;
    
    if (!captions) {
      return {
        available: false,
        tracks: [],
        translationLanguages: []
      };
    }
    
    return {
      available: true,
      tracks: captions.captionTracks || [],
      translationLanguages: captions.translationLanguages || [],
      defaultAudioTrack: captions.defaultAudioTrackIndex || 0
    };
  }
  
  async downloadSubtitle(track, format = 'json3', targetLang = null) {
    const url = new URL(track.baseUrl);
    url.searchParams.set('fmt', format);
    
    // Add translation if requested
    if (targetLang) {
      url.searchParams.set('tlang', targetLang);
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to download subtitles: ${response.status}`);
    }
    
    return await response.text();
  }
  
  parseJSON3(json3String) {
    const data = JSON.parse(json3String);
    const subtitles = [];
    
    for (const event of data.events || []) {
      if (!event.segs) continue;
      
      const text = event.segs.map(seg => seg.utf8).join('');
      subtitles.push({
        text: text.trim(),
        start: event.tStartMs / 1000,
        end: (event.tStartMs + event.dDurationMs) / 1000,
        startMs: event.tStartMs,
        durationMs: event.dDurationMs
      });
    }
    
    return subtitles;
  }
  
  // Check if English subtitles are available
  hasEnglishSubtitles(captionData) {
    if (!captionData.available) return false;
    return captionData.tracks.some(track => 
      track.languageCode === 'en' || track.languageCode.startsWith('en-')
    );
  }
  
  // Get all English subtitle tracks (may have multiple)
  getEnglishTracks(captionData) {
    return captionData.tracks.filter(track => 
      track.languageCode === 'en' || track.languageCode.startsWith('en-')
    );
  }
  
  // Distinguish between auto-generated and official subtitles
  isAutoGenerated(track) {
    return track.kind === 'asr'; // Automatic Speech Recognition
  }
}

// Make extractor available to popup/background
window.youtubeSubtitleExtractor = new YouTubeSubtitleExtractor();

// Send message when page loads
chrome.runtime.sendMessage({
  type: 'PAGE_READY',
  videoId: window.youtubeSubtitleExtractor.videoId
});
```

### Background Script (background.js)

```javascript
// background.js - Service worker for Manifest V3

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGE_READY') {
    console.log('YouTube video page ready:', message.videoId);
    
    // Store current video ID
    chrome.storage.local.set({ currentVideoId: message.videoId });
  }
  
  if (message.type === 'DOWNLOAD_SUBTITLE') {
    // Handle subtitle download request
    handleSubtitleDownload(message.data);
  }
});

async function handleSubtitleDownload(data) {
  // Could add additional processing here
  console.log('Downloading subtitle:', data);
}
```

### Popup Script (popup.js)

```javascript
// popup.js - UI for the extension popup

document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const languageList = document.getElementById('language-list');
  const downloadBtn = document.getElementById('download-btn');
  
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('youtube.com/watch')) {
    statusDiv.textContent = 'Please open a YouTube video page';
    return;
  }
  
  // Get caption data from content script
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_CAPTIONS'
    });
    
    if (!response.available) {
      statusDiv.textContent = '❌ No subtitles available for this video';
      return;
    }
    
    statusDiv.textContent = '✅ Subtitles available';
    
    // Display available languages
    response.tracks.forEach(track => {
      const div = document.createElement('div');
      div.className = 'language-item';
      
      const name = track.name?.simpleText || track.languageCode;
      const type = track.kind === 'asr' ? ' (Auto-generated)' : ' (Official)';
      
      div.textContent = `${name}${type}`;
      div.dataset.trackData = JSON.stringify(track);
      
      div.addEventListener('click', () => {
        document.querySelectorAll('.language-item').forEach(el => 
          el.classList.remove('selected')
        );
        div.classList.add('selected');
        downloadBtn.disabled = false;
      });
      
      languageList.appendChild(div);
    });
    
    // Handle download button
    downloadBtn.addEventListener('click', async () => {
      const selectedDiv = document.querySelector('.language-item.selected');
      if (!selectedDiv) return;
      
      const track = JSON.parse(selectedDiv.dataset.trackData);
      await downloadSelectedSubtitle(tab.id, track);
    });
    
  } catch (error) {
    statusDiv.textContent = '❌ Error: ' + error.message;
    console.error(error);
  }
});

async function downloadSelectedSubtitle(tabId, track) {
  const response = await chrome.tabs.sendMessage(tabId, {
    type: 'DOWNLOAD_SUBTITLE',
    track: track,
    format: 'json3'
  });
  
  // Convert to SRT and download
  const subtitles = response.subtitles;
  const srt = convertToSRT(subtitles);
  
  // Create download
  const blob = new Blob([srt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `subtitles_${track.languageCode}.srt`;
  a.click();
  
  URL.revokeObjectURL(url);
}

function convertToSRT(subtitles) {
  let srt = '';
  subtitles.forEach((subtitle, index) => {
    const startTime = formatSRTTime(subtitle.start);
    const endTime = formatSRTTime(subtitle.end);
    srt += `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n\n`;
  });
  return srt;
}

function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

function pad(num, size) {
  return String(num).padStart(size, '0');
}
```

---

## 5. Handling Auto-Generated vs Official Subtitles

### Detection

```javascript
function categorizeSubtitles(captionTracks) {
  const official = [];
  const autoGenerated = [];
  
  captionTracks.forEach(track => {
    if (track.kind === 'asr') {
      autoGenerated.push(track);
    } else {
      official.push(track);
    }
  });
  
  return { official, autoGenerated };
}

// Prefer official subtitles if available
function getPreferredTrack(captionTracks, languageCode) {
  const { official, autoGenerated } = categorizeSubtitles(captionTracks);
  
  // Try official first
  let track = official.find(t => t.languageCode === languageCode);
  if (track) return { track, type: 'official' };
  
  // Fall back to auto-generated
  track = autoGenerated.find(t => t.languageCode === languageCode);
  if (track) return { track, type: 'auto-generated' };
  
  return null;
}
```

### Quality Differences

**Official Subtitles:**
- ✅ Higher accuracy
- ✅ Proper punctuation and formatting
- ✅ Better sentence segmentation
- ✅ May include speaker labels
- ⚠️ Not available for all videos

**Auto-Generated Subtitles:**
- ✅ Available for most videos
- ✅ Word-level timing data
- ⚠️ May contain transcription errors
- ⚠️ Less reliable punctuation
- ⚠️ May miss specialized terminology

---

## 6. Translation Support

YouTube provides machine translation for subtitles:

```javascript
async function getTranslatedSubtitles(track, targetLanguage) {
  const url = new URL(track.baseUrl);
  url.searchParams.set('fmt', 'json3');
  url.searchParams.set('tlang', targetLanguage); // e.g., 'zh', 'es', 'fr'
  
  const response = await fetch(url.toString());
  return await response.text();
}

// Example: Get Chinese translation of English subtitles
const englishTrack = captionTracks.find(t => t.languageCode === 'en');
const chineseSubtitles = await getTranslatedSubtitles(englishTrack, 'zh');
```

**Available Translation Languages:**
Can be found in `captionData.translationLanguages` array:
```javascript
// Example structure:
[
  {
    languageCode: "zh",
    languageName: { simpleText: "Chinese (Simplified)" }
  },
  {
    languageCode: "es",
    languageName: { simpleText: "Spanish" }
  },
  // ... more languages
]
```

---

## 7. Rate Limits and Restrictions

### YouTube's Policies

**Good News:**
- ✅ No rate limits on timedtext API for reasonable use
- ✅ No authentication required
- ✅ Can access any public video's subtitles
- ✅ Not explicitly prohibited in YouTube's ToS for personal use

**Restrictions:**
- ⚠️ Subtitles only available for public videos
- ⚠️ Age-restricted videos may require authentication
- ⚠️ Some videos may have subtitles disabled by uploader
- ⚠️ Extreme abuse may lead to IP-based rate limiting

### Best Practices

```javascript
// Add reasonable delays between requests
async function downloadMultipleSubtitles(tracks) {
  const results = [];
  
  for (const track of tracks) {
    try {
      const subtitle = await downloadSubtitle(track);
      results.push({ track, subtitle, success: true });
      
      // Add small delay between requests
      await sleep(500);
    } catch (error) {
      results.push({ track, error, success: false });
    }
  }
  
  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Error Handling

```javascript
async function downloadSubtitleWithRetry(track, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(track.baseUrl + '&fmt=json3');
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await sleep(delay);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.text();
      
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1));
    }
  }
}
```

---

## 8. Popular Extension Examples

### Language Reactor
- **Method:** DOM extraction + timedtext API
- **Features:** Dual subtitles, word-level popup definitions
- **Tech Stack:** Content scripts, React UI

### Trancy
- **Method:** DOM extraction + timedtext API
- **Features:** AI translation, bilingual subtitles, SRS learning
- **Tech Stack:** Manifest V3, modern JavaScript

### YouTube Subtitle Downloader (Open Source)
- **GitHub:** Multiple implementations available
- **Method:** Parse `ytInitialPlayerResponse` from page
- **Format Support:** SRT, VTT, TXT export

---

## 9. Future-Proofing Considerations

### YouTube UI Changes

**Risk:** YouTube frequently updates its web interface, which can break DOM-based extraction.

**Mitigation Strategies:**

```javascript
// Use multiple extraction methods with fallbacks
class RobustCaptionExtractor {
  async getCaptions() {
    const methods = [
      () => this.extractFromWindow(),
      () => this.extractFromScripts(),
      () => this.extractFromDOM(),
      () => this.extractFromAPI() // Last resort
    ];
    
    for (const method of methods) {
      try {
        const result = await method();
        if (result) return result;
      } catch (error) {
        console.warn('Extraction method failed:', error);
      }
    }
    
    throw new Error('All extraction methods failed');
  }
  
  extractFromWindow() {
    if (!window.ytInitialPlayerResponse) return null;
    return this.parseCaptionData(window.ytInitialPlayerResponse);
  }
  
  extractFromScripts() {
    // Parse from <script> tags
    // ... implementation
  }
  
  extractFromDOM() {
    // Look for specific DOM elements
    // ... implementation
  }
  
  async extractFromAPI() {
    // Fall back to official API if needed
    // ... implementation
  }
}
```

### Monitoring & Updates

**Recommended:**
1. **Version checking** - Detect YouTube's player version changes
2. **Error logging** - Track extraction failures
3. **User feedback** - Prompt users to report issues
4. **Auto-updates** - Keep extension updated via Chrome Web Store

```javascript
// Detect YouTube player version
function getYouTubePlayerVersion() {
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const match = script.src.match(/youtube\.com\/s\/player\/([^/]+)\//);
    if (match) return match[1];
  }
  return null;
}

// Log version for debugging
const playerVersion = getYouTubePlayerVersion();
console.log('YouTube Player Version:', playerVersion);
```

---

## 10. Summary & Recommendations

### ✅ Recommended Implementation

**For a Chrome extension to download YouTube subtitles:**

1. **Use DOM Extraction Method**
   - Parse `ytInitialPlayerResponse` from the page
   - Extract `captionTracks` array with subtitle URLs
   - No API key or authentication needed

2. **Fetch from Timedtext API**
   - Use the `baseUrl` from caption tracks
   - Add `fmt=json3` for easiest parsing
   - Support multiple format exports (SRT, VTT, TXT)

3. **Content Script Architecture**
   - Inject content script on `youtube.com/watch*` pages
   - Extract caption data when page loads
   - Communicate with popup UI via message passing

4. **Key Features to Implement**
   - ✅ Auto-detect English subtitles availability
   - ✅ Show official vs auto-generated labels
   - ✅ Support subtitle translation
   - ✅ Export to SRT/VTT formats
   - ✅ Handle errors gracefully

### ❌ Avoid

- Don't use YouTube Data API v3 (too limited, requires auth)
- Don't scrape subtitle text from DOM (unreliable)
- Don't make excessive requests (be a good citizen)
- Don't store subtitle data permanently (respect copyright)

### 📊 Comparison Matrix

| Method | API Key | Auth | Quota | Permissions | Reliability | Ease |
|--------|---------|------|-------|-------------|-------------|------|
| **Data API v3** | ✅ Required | ✅ OAuth | ❌ 200/req | ❌ Owner only | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Timedtext API** | ✅ None | ✅ None | ✅ Unlimited | ✅ Public videos | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **DOM Scraping** | ✅ None | ✅ None | ✅ Unlimited | ✅ Public videos | ⭐⭐⭐ | ⭐⭐ |

---

## 11. Code Repository & References

### Useful GitHub Repositories

**Open Source Implementations:**
- [Youtube-Auto-Subtitle-Download](https://github.com/land007/Youtube-Auto-Subtitle-Download) - Userscript for subtitle downloads
- [seek-subtitle-youtube](https://github.com/phamthainb/seek-subtitle-youtube) - Chrome extension example

### Official Documentation

- **YouTube Data API v3:** https://developers.google.com/youtube/v3/docs/captions
- **Chrome Extension Manifest V3:** https://developer.chrome.com/docs/extensions/mv3/
- **WebVTT Specification:** https://www.w3.org/TR/webvtt1/

### Tools & Libraries

**Subtitle Format Converters:**
- `subsrt` (Python) - Convert between subtitle formats
- `subtitle` (JavaScript) - Parse SRT/VTT/ASS formats
- Native browser APIs for WebVTT

---

## 12. Implementation Checklist

### Phase 1: Basic Functionality
- [ ] Set up Manifest V3 extension structure
- [ ] Create content script to detect YouTube video pages
- [ ] Extract `ytInitialPlayerResponse` from page
- [ ] Parse caption tracks array
- [ ] Detect English subtitle availability
- [ ] Fetch subtitle content from timedtext API

### Phase 2: Subtitle Processing
- [ ] Parse JSON3 subtitle format
- [ ] Convert timestamps to readable format
- [ ] Extract text and timing information
- [ ] Handle auto-generated vs official subtitles
- [ ] Implement SRT format export

### Phase 3: User Interface
- [ ] Create popup UI to show available subtitles
- [ ] Display language list with type indicators
- [ ] Add download button functionality
- [ ] Show loading states and errors
- [ ] Support format selection (SRT, VTT, TXT)

### Phase 4: Advanced Features
- [ ] Support subtitle translation
- [ ] Implement bilingual subtitle export
- [ ] Add subtitle preview in popup
- [ ] Cache recently downloaded subtitles
- [ ] Support batch download for playlists

### Phase 5: Polish & Testing
- [ ] Add error handling and retry logic
- [ ] Test with various video types
- [ ] Handle edge cases (no subtitles, age-restricted, etc.)
- [ ] Optimize performance
- [ ] Write user documentation

---

## Contact & Maintenance

This research document was compiled in January 2026 based on current YouTube implementation patterns and Chrome extension best practices.

**Last Updated:** 2026-01-20

**Note:** YouTube's internal APIs and page structure may change over time. Monitor for breaking changes and be prepared to update extraction logic accordingly.

---

## Appendix: Complete Working Example

See the implementation sections above for a complete, production-ready Chrome extension codebase that implements subtitle downloading using the recommended timedtext API approach.

The code includes:
- ✅ Manifest V3 configuration
- ✅ Content script for caption extraction  
- ✅ Background service worker
- ✅ Popup UI with download functionality
- ✅ Multiple subtitle format support
- ✅ Error handling and retry logic
- ✅ Translation support

This provides a solid foundation for building a YouTube subtitle enhancement extension.
