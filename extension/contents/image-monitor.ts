/**
 * Image Upload Monitoring Content Script
 * Detects image uploads and checks for EXIF GPS data
 */

import type { PlasmoCSConfig } from "plasmo";
import EXIF from 'exif-js';
import { showPrivacyAlert } from '../utils/alert-overlay';

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle"
};

console.log('Privacy Shadow: Image monitor active');

interface ImageMetadata {
  hasGPS: boolean;
  hasCameraInfo: boolean;
  hasDateTime: boolean;
  latitude?: number;
  longitude?: number;
  cameraMake?: string;
  cameraModel?: string;
  dateTaken?: string;
}

/**
 * Check image file for EXIF data
 */
async function checkImageEXIF(file: File): Promise<ImageMetadata> {
  return new Promise((resolve) => {
    const metadata: ImageMetadata = {
      hasGPS: false,
      hasCameraInfo: false,
      hasDateTime: false,
    };

    // Check if it's actually an image
    if (!file.type.startsWith('image/')) {
      resolve(metadata);
      return;
    }

    // Create an image element to load the file
    const img = new Image();

    img.onload = function() {
      try {
        // Get EXIF data
        EXIF.getData(img as any, function(this: any) {
          // Check for GPS data
          const lat = EXIF.getTag(this, 'GPSLatitude');
          const lon = EXIF.getTag(this, 'GPSLongitude');
          const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
          const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');

          if (lat && lon) {
            metadata.hasGPS = true;

            // Convert GPS coordinates to decimal
            if (latRef && lonRef) {
              metadata.latitude = convertDMSToDD(lat, latRef);
              metadata.longitude = convertDMSToDD(lon, lonRef);
            }
          }

          // Check for camera info
          const make = EXIF.getTag(this, 'Make');
          const model = EXIF.getTag(this, 'Model');

          if (make || model) {
            metadata.hasCameraInfo = true;
            metadata.cameraMake = make;
            metadata.cameraModel = model;
          }

          // Check for date/time
          const dateTime = EXIF.getTag(this, 'DateTime');
          const dateTimeOriginal = EXIF.getTag(this, 'DateTimeOriginal');

          if (dateTime || dateTimeOriginal) {
            metadata.hasDateTime = true;
            metadata.dateTaken = dateTimeOriginal || dateTime;
          }

          resolve(metadata);
        });
      } catch (error) {
        console.error('Privacy Shadow: Error reading EXIF data', error);
        resolve(metadata);
      }
    };

    img.onerror = function() {
      console.error('Privacy Shadow: Error loading image');
      resolve(metadata);
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 */
function convertDMSToDD(dms: number[], ref: string): number {
  const degrees = dms[0];
  const minutes = dms[1];
  const seconds = dms[2];

  let dd = degrees + minutes / 60 + seconds / 3600;

  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }

  return dd;
}

/**
 * Get human-readable location from coordinates
 */
function getLocationDescription(lat: number, lon: number): string {
  // For MVP, just return coordinates
  // In production, would use reverse geocoding API
  return `${lat.toFixed(6)}°, ${lon.toFixed(6)}°`;
}

/**
 * Calculate risk score for image metadata
 */
function calculateImageRisk(metadata: ImageMetadata): number {
  let score = 0;

  if (metadata.hasGPS) {
    score += 40; // GPS is high risk
  }

  if (metadata.hasCameraInfo) {
    score += 10;
  }

  if (metadata.hasDateTime) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Handle file input change
 */
async function handleFileInput(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  // Check each file
  for (const file of Array.from(target.files)) {
    if (file.type.startsWith('image/')) {
      console.log('Privacy Shadow: Checking image for EXIF data', file.name);

      const metadata = await checkImageEXIF(file);

      // If has GPS or other sensitive data, alert user
      if (metadata.hasGPS || metadata.hasCameraInfo || metadata.hasDateTime) {
        const riskScore = calculateImageRisk(metadata);

        console.log('Privacy Shadow: Image metadata detected', { file: file.name, metadata, riskScore });

        // Send to background service worker
        try {
          const response = await chrome.runtime.sendMessage({
            type: 'IMAGE_UPLOAD',
            data: {
              fileName: file.name,
              fileSize: file.size,
              metadata,
              riskScore,
            }
          });

          // If high risk, show warning
          if (response && response.block) {
            showImageWarning(response.risk, metadata);
          }
        } catch (error) {
          console.error('Privacy Shadow: Error in image monitoring', error);
        }
      }
    }
  }
}

/**
 * Show warning about image metadata
 */
function showImageWarning(_risk: any, metadata: ImageMetadata): void {
  const reasons = ['Photo contains GPS location data'];
  if (metadata.hasCameraInfo) reasons.push('Camera make/model information');
  if (metadata.hasDateTime) reasons.push('Date and time photo was taken');
  if (metadata.latitude && metadata.longitude) {
    reasons.push(`Location: ${getLocationDescription(metadata.latitude, metadata.longitude)}`);
  }

  showPrivacyAlert({
    risk: { level: 'high', score: 60, reasons },
    onContinue: () => console.log('Privacy Shadow: User chose to keep image metadata'),
    onCancel: () => console.log('Privacy Shadow: User chose to remove EXIF data'),
  });
}

/**
 * Monitor for file inputs
 */
function initializeImageMonitoring(): void {
  console.log('Privacy Shadow: Initializing image monitoring');

  // Monitor existing file inputs
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach((input) => {
    input.addEventListener('change', handleFileInput);
  });

  // Monitor for dynamically added file inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;

          if (element.tagName === 'INPUT' && element.getAttribute('type') === 'file') {
            console.log('Privacy Shadow: New file input detected');
            element.addEventListener('change', handleFileInput);
          }

          const fileInputs = element.querySelectorAll('input[type="file"]');
          fileInputs.forEach((input) => {
            input.addEventListener('change', handleFileInput);
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also monitor drag and drop
  document.addEventListener('drop', async (event) => {
    const files = event.dataTransfer?.files;
    if (files) {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          const metadata = await checkImageEXIF(file);
          if (metadata.hasGPS || metadata.hasCameraInfo || metadata.hasDateTime) {
            const riskScore = calculateImageRisk(metadata);

            try {
              const response = await chrome.runtime.sendMessage({
                type: 'IMAGE_UPLOAD',
                data: {
                  fileName: file.name,
                  fileSize: file.size,
                  metadata,
                  riskScore,
                }
              });

              if (response && response.block) {
                showImageWarning(response.risk, metadata);
              }
            } catch (error) {
              console.error('Privacy Shadow: Error in drag-drop monitoring', error);
            }
          }
        }
      }
    }
  });

  console.log('Privacy Shadow: Image monitoring active');
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeImageMonitoring);
} else {
  initializeImageMonitoring();
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_IMAGES') {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    sendResponse({ imageInputCount: fileInputs.length });
  }

  return true;
});
