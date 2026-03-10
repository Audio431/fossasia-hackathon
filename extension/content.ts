/**
 * Privacy Shadow - Main Content Script Entry
 * Plasmo entry point that loads all monitoring modules
 */

import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle"
};

// Import monitoring modules - initialization runs as side effects
import "./contents/form-monitor";
import "./contents/dom-monitor";
import "./contents/image-monitor";
