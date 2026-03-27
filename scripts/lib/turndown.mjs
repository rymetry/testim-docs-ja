/**
 * Shared TurndownService singleton for HTML → Markdown conversion.
 * Configuration is centralized here to prevent divergence across consumers.
 */

import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export default turndown;
