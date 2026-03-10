/* Fix for Touch Target Sizing Issue */

/* Add to globals.css or tailwind config */
nav button {
  min-height: 44px; /* Apple HIG recommendation */
  min-width: 44px;
  padding: 12px 16px;
}

/* Ensure all interactive elements meet touch targets */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* For smaller buttons in tight spaces, ensure tap target area */
.small-button {
  height: 44px;
  width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
