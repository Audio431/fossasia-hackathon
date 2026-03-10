/**
 * Privacy Shadow - Content Script Entry (Project Root)
 * Plasmo discovers content scripts from project root, not srcDir.
 */

import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle"
};

// Load all monitoring modules
import "./extension/contents/form-monitor";
import "./extension/contents/dom-monitor";
import "./extension/contents/image-monitor";
import "./extension/contents/stranger-monitor";
import "./extension/contents/instagram-form-monitor";
