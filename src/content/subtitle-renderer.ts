/**
 * Subtitle Renderer
 * 
 * Renders enhanced subtitles with translations as an overlay on YouTube videos.
 * Handles subtitle display, positioning, styling, and synchronization with
 * video playback.
 * 
 * @module content/subtitle-renderer
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import type { SubtitleSegment, UserProfile } from '../types/index';

/**
 * CSS class prefix for subtitle overlay elements
 */
const CLASS_PREFIX = 'yse'; // YouTube Subtitle Enhancer

/**
 * Subtitle overlay container element
 */
let overlayContainer: HTMLDivElement | null = null;

/**
 * Current subtitle element being displayed
 */
let currentSubtitleElement: HTMLDivElement | null = null;

/**
 * All subtitle segments for the current video
 */
let subtitleSegments: SubtitleSegment[] = [];

/**
 * Current subtitle index
 */
let currentSubtitleIndex = -1;

/**
 * Video element reference
 */
let videoElement: HTMLVideoElement | null = null;

/**
 * Animation frame ID for sync loop
 */
let syncAnimationFrameId: number | null = null;

/**
 * User profile for rendering preferences
 */
let userProfile: UserProfile | null = null;

/**
 * Creates the subtitle overlay container
 * 
 * The overlay is positioned absolutely on top of the video player
 * and contains the enhanced subtitle display.
 * 
 * @returns The created overlay container element
 * 
 * @example
 * ```typescript
 * const overlay = createSubtitleOverlay();
 * document.body.appendChild(overlay);
 * ```
 */
export function createSubtitleOverlay(): HTMLDivElement {
  console.log('Creating subtitle overlay...');
  
  // Remove existing overlay if present
  if (overlayContainer) {
    overlayContainer.remove();
  }
  
  // Create container
  const container = document.createElement('div');
  container.id = `${CLASS_PREFIX}-overlay-container`;
  container.className = `${CLASS_PREFIX}-overlay`;
  
  // Apply base styles
  Object.assign(container.style, {
    position: 'absolute',
    left: '0',
    right: '0',
    bottom: '60px', // Above YouTube's native controls
    pointerEvents: 'none',
    zIndex: '9999',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 20px 20px 20px',
    fontFamily: 'YouTube Sans, Roboto, Arial, sans-serif',
  });
  
  overlayContainer = container;
  
  console.log('Subtitle overlay created');
  return container;
}

/**
 * Injects the overlay into the YouTube player
 * 
 * Finds the video player container and appends the overlay as a sibling.
 * 
 * @returns True if injection succeeded, false otherwise
 * 
 * @example
 * ```typescript
 * const overlay = createSubtitleOverlay();
 * const success = injectOverlayIntoPlayer(overlay);
 * ```
 */
export function injectOverlayIntoPlayer(overlay: HTMLDivElement): boolean {
  try {
    // Find the video player container
    const playerContainer = document.querySelector('#movie_player') || 
                           document.querySelector('.html5-video-player');
    
    if (!playerContainer) {
      console.error('Player container not found');
      return false;
    }
    
    // Append overlay to player container
    playerContainer.appendChild(overlay);
    
    console.log('Overlay injected into player');
    return true;
  } catch (error) {
    console.error('Failed to inject overlay:', error);
    return false;
  }
}

/**
 * Creates a subtitle element for display
 * 
 * @param segment - The subtitle segment to display
 * @param profile - User profile for styling preferences
 * @returns The created subtitle element
 */
function createSubtitleElement(segment: SubtitleSegment, profile: UserProfile): HTMLDivElement {
  const element = document.createElement('div');
  element.className = `${CLASS_PREFIX}-subtitle`;
  
  // Apply styling based on user preferences
  const fontSize = profile.subtitleFontSize || 16;
  
  Object.assign(element.style, {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: `${fontSize}px`,
    lineHeight: '1.6',
    maxWidth: '80%',
    textAlign: 'center',
    pointerEvents: 'auto',
    cursor: 'default',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    transition: 'opacity 0.2s ease-in-out',
  });
  
  // Set content based on display mode
  if (segment.enhancedHTML && segment.enhancedHTML.trim().length > 0) {
    // Use enhanced HTML with translations
    element.innerHTML = segment.enhancedHTML;
  } else {
    // Fallback to original text
    element.textContent = segment.originalText;
  }
  
  return element;
}

/**
 * Renders a subtitle segment to the overlay
 * 
 * @param segment - The subtitle segment to render
 * 
 * @example
 * ```typescript
 * renderSubtitle(segments[0]);
 * ```
 */
export function renderSubtitle(segment: SubtitleSegment): void {
  console.log('Rendering subtitle segment:', segment.originalText);
  if (!overlayContainer || !userProfile) {
    console.warn('Overlay container or user profile not initialized');
    return;
  }
  
  // Remove current subtitle if exists
  if (currentSubtitleElement) {
    currentSubtitleElement.remove();
    currentSubtitleElement = null;
  }
  
  // Create new subtitle element
  const subtitleElement = createSubtitleElement(segment, userProfile);
  
  // Append to overlay
  overlayContainer.appendChild(subtitleElement);
  currentSubtitleElement = subtitleElement;
  
  // Fade in animation
  subtitleElement.style.opacity = '0';
  requestAnimationFrame(() => {
    subtitleElement.style.opacity = '1';
  });
}

/**
 * Clears the current subtitle from display
 * 
 * @example
 * ```typescript
 * clearSubtitle();
 * ```
 */
export function clearSubtitle(): void {
  if (currentSubtitleElement) {
    // Fade out animation
    currentSubtitleElement.style.opacity = '0';
    
    setTimeout(() => {
      if (currentSubtitleElement) {
        currentSubtitleElement.remove();
        currentSubtitleElement = null;
      }
    }, 200); // Match transition duration
  }
}

/**
 * Finds the subtitle segment for a given time
 * 
 * Uses binary search for efficient lookup in large subtitle arrays.
 * 
 * @param currentTime - Video playback time in seconds
 * @returns Index of the subtitle segment or -1 if none found
 */
function findSubtitleIndex(currentTime: number): number {
  if (!subtitleSegments || subtitleSegments.length === 0) {
    return -1;
  }
  
  // Binary search for efficiency
  let left = 0;
  let right = subtitleSegments.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const segment = subtitleSegments[mid];
    
    if (!segment) {
      return -1;
    }
    
    if (currentTime >= segment.startTime && currentTime <= segment.endTime) {
      return mid;
    } else if (currentTime < segment.startTime) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  
  return -1;
}

/**
 * Synchronizes subtitle display with video playback
 * 
 * This function is called on every animation frame to ensure
 * subtitles are displayed at the correct time.
 */
function syncSubtitleWithVideo(): void {
  if (!videoElement || !subtitleSegments || subtitleSegments.length === 0) {
    return;
  }
  
  const currentTime = videoElement.currentTime;
  const newIndex = findSubtitleIndex(currentTime);
  
  // Update subtitle if changed
  if (newIndex !== currentSubtitleIndex) {
    currentSubtitleIndex = newIndex;
    
    if (newIndex >= 0 && subtitleSegments[newIndex]) {
      renderSubtitle(subtitleSegments[newIndex]);
    } else {
      clearSubtitle();
    }
  }
  
  // Continue sync loop
  syncAnimationFrameId = requestAnimationFrame(syncSubtitleWithVideo);
}

/**
 * Starts subtitle synchronization with video playback
 * 
 * @param video - The video element to sync with
 * @param segments - Array of subtitle segments
 * @param profile - User profile for rendering preferences
 * 
 * @example
 * ```typescript
 * startSubtitleSync(videoElement, subtitleSegments, userProfile);
 * ```
 */
export function startSubtitleSync(
  video: HTMLVideoElement,
  segments: SubtitleSegment[],
  profile: UserProfile
): void {
  console.log('Starting subtitle synchronization...');
  
  // Stop existing sync if running
  stopSubtitleSync();
  
  // Update state
  videoElement = video;
  subtitleSegments = segments;
  userProfile = profile;
  currentSubtitleIndex = -1;
  
  // Start sync loop
  syncAnimationFrameId = requestAnimationFrame(syncSubtitleWithVideo);
  
  console.log(`Subtitle sync started with ${segments.length} segments`);
}

/**
 * Stops subtitle synchronization
 * 
 * @example
 * ```typescript
 * stopSubtitleSync();
 * ```
 */
export function stopSubtitleSync(): void {
  console.log('Stopping subtitle synchronization...');
  
  // Cancel animation frame
  if (syncAnimationFrameId !== null) {
    cancelAnimationFrame(syncAnimationFrameId);
    syncAnimationFrameId = null;
  }
  
  // Clear current subtitle
  clearSubtitle();
  
  // Reset state
  videoElement = null;
  subtitleSegments = [];
  currentSubtitleIndex = -1;
  
  console.log('Subtitle sync stopped');
}

/**
 * Updates user profile for rendering
 * 
 * This should be called when user preferences change to update
 * subtitle styling and display options.
 * 
 * @param profile - Updated user profile
 * 
 * @example
 * ```typescript
 * updateUserProfile(newProfile);
 * ```
 */
export function updateUserProfile(profile: UserProfile): void {
  userProfile = profile;
  
  // Re-render current subtitle if visible
  if (currentSubtitleIndex >= 0) {
    const segment = subtitleSegments[currentSubtitleIndex];
    if (segment) {
      renderSubtitle(segment);
    }
  }
  
  console.log('User profile updated for subtitle renderer');
}

/**
 * Removes the subtitle overlay from the page
 * 
 * This should be called when navigating away from a video or
 * when the extension is disabled.
 * 
 * @example
 * ```typescript
 * removeSubtitleOverlay();
 * ```
 */
export function removeSubtitleOverlay(): void {
  console.log('Removing subtitle overlay...');
  
  // Stop sync
  stopSubtitleSync();
  
  // Remove overlay
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
  
  console.log('Subtitle overlay removed');
}

/**
 * Gets the current subtitle overlay container
 * 
 * @returns Overlay container or null if not created
 */
export function getOverlayContainer(): HTMLDivElement | null {
  return overlayContainer;
}

/**
 * Checks if subtitle sync is currently running
 * 
 * @returns True if sync is running, false otherwise
 */
export function isSyncRunning(): boolean {
  return syncAnimationFrameId !== null;
}

/**
 * Seeks to a specific subtitle by index
 * 
 * This can be used to implement subtitle navigation features.
 * 
 * @param index - Index of the subtitle to seek to
 * 
 * @example
 * ```typescript
 * seekToSubtitle(5); // Jump to 6th subtitle
 * ```
 */
export function seekToSubtitle(index: number): void {
  if (!videoElement || !subtitleSegments || index < 0 || index >= subtitleSegments.length) {
    console.warn('Invalid seek request');
    return;
  }
  
  const segment = subtitleSegments[index];
  if (!segment) {
    console.warn('Subtitle segment not found');
    return;
  }
  
  videoElement.currentTime = segment.startTime;
  
  console.log(`Seeked to subtitle ${index} at ${segment.startTime}s`);
}

/**
 * Gets the current subtitle index
 * 
 * @returns Current subtitle index or -1 if none active
 */
export function getCurrentSubtitleIndex(): number {
  return currentSubtitleIndex;
}

/**
 * Gets total number of subtitle segments
 * 
 * @returns Number of segments
 */
export function getSubtitleCount(): number {
  return subtitleSegments.length;
}
