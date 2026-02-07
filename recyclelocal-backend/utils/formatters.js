/**
 * ============================================
 * Formatters Utility
 * ============================================
 * 
 * Functions to convert structured recycling data 
 * into various human-readable formats.
 * 
 * SUPPORTED FORMATS:
 * - Plain text (formatAsText)
 * - HTML (formatAsHtml) - TODO: add if needed
 * - Markdown (formatAsMarkdown) - TODO: add if needed
 * 
 * FRONTEND INTEGRATION:
 * The frontend can request different formats using the
 * ?format= query parameter on /api/recycling
 * 
 * ============================================
 */

/**
 * Format recycling rules as plain text
 * 
 * Creates a nicely formatted text output suitable for
 * terminal display, email, or text-based UIs.
 * 
 * @param {Object} rules - Structured recycling rules object
 * @param {string} rules.location - Location name
 * @param {Array} rules.accepted - Accepted materials
 * @param {Array} rules.not_accepted - Not accepted materials
 * @param {Array} rules.tips - Recycling tips
 * @param {Array} rules.sources - Source URLs
 * @returns {string} Formatted plain text
 * 
 * @example
 * const text = formatAsText(rules);
 * console.log(text);
 * // ♻️  RECYCLING GUIDE
 * // ──────────────────────────────────────────────────
 * // 📍 Location: Beverly Hills, CA
 * // ...
 */
function formatAsText(rules) {
  const lines = [];
  const divider = '─'.repeat(50);

  // ----------------------------------------------------------------
  // Header Section
  // ----------------------------------------------------------------
  lines.push('');
  lines.push('♻️  RECYCLING GUIDE');
  lines.push(divider);
  lines.push(`📍 Location: ${rules.location}`);
  lines.push('');

  // ----------------------------------------------------------------
  // Accepted Materials Section
  // ----------------------------------------------------------------
  lines.push('✅ ACCEPTED MATERIALS');
  lines.push(divider);
  
  if (rules.accepted && rules.accepted.length > 0) {
    for (const item of rules.accepted) {
      // Use double checkmark for high-confidence items
      const confidence = item.confidence === 'high' ? '✓✓' : '✓';
      let line = `  ${confidence} ${item.material}`;
      
      // Add notes if they contain useful info (not just default messages)
      if (item.notes && 
          item.notes !== 'Verify with source' && 
          item.notes !== 'Confirmed by multiple sources') {
        line += ` — ${item.notes}`;
      }
      lines.push(line);
    }
  } else {
    lines.push('  No specific materials found. Check sources below.');
  }
  lines.push('');

  // ----------------------------------------------------------------
  // Not Accepted Materials Section
  // ----------------------------------------------------------------
  lines.push('❌ NOT ACCEPTED');
  lines.push(divider);
  
  if (rules.not_accepted && rules.not_accepted.length > 0) {
    for (const item of rules.not_accepted) {
      let line = `  ✗ ${item.material}`;
      
      // Add notes if they contain useful info
      if (item.notes && item.notes !== 'Check local guidelines for disposal') {
        line += ` — ${item.notes}`;
      }
      lines.push(line);
    }
  } else {
    lines.push('  No specific restrictions found.');
  }
  lines.push('');

  // ----------------------------------------------------------------
  // Tips Section (only if we have tips)
  // ----------------------------------------------------------------
  if (rules.tips && rules.tips.length > 0) {
    lines.push('💡 TIPS');
    lines.push(divider);
    for (const tip of rules.tips) {
      lines.push(`  • ${tip}`);
    }
    lines.push('');
  }

  // ----------------------------------------------------------------
  // Sources Section
  // ----------------------------------------------------------------
  lines.push('📚 SOURCES');
  lines.push(divider);
  
  if (rules.sources && rules.sources.length > 0) {
    for (let i = 0; i < rules.sources.length; i++) {
      const source = rules.sources[i];
      lines.push(`  ${i + 1}. ${source.title}`);
      lines.push(`     ${source.url}`);
    }
  }
  lines.push('');

  // ----------------------------------------------------------------
  // Footer / Legend
  // ----------------------------------------------------------------
  lines.push(divider);
  lines.push('ℹ️  ✓✓ = Confirmed by multiple sources');
  lines.push('   ✓  = Found in one source — verify with official guidelines');
  lines.push('');

  return lines.join('\n');
}

/**
 * Format recycling rules as HTML
 * 
 * Creates styled HTML suitable for embedding in web pages.
 * Uses inline styles for portability (no external CSS needed).
 * 
 * @param {Object} rules - Structured recycling rules object
 * @returns {string} Formatted HTML
 */
function formatAsHtml(rules) {
  // Simple HTML formatting for web display
  let html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2e7d32;">♻️ Recycling Guide</h1>
      <p style="color: #666; font-size: 1.1em;">📍 <strong>${rules.location}</strong></p>
      
      <h2 style="color: #388e3c;">✅ Accepted Materials</h2>
      <ul style="list-style: none; padding: 0;">
  `;

  // Accepted materials
  if (rules.accepted && rules.accepted.length > 0) {
    for (const item of rules.accepted) {
      const icon = item.confidence === 'high' ? '✓✓' : '✓';
      const badge = item.confidence === 'high' 
        ? '<span style="background: #c8e6c9; color: #2e7d32; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; margin-left: 8px;">verified</span>'
        : '';
      html += `
        <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
          <span style="color: #4caf50; margin-right: 8px;">${icon}</span>
          <strong>${item.material}</strong>${badge}
          ${item.notes ? `<br><span style="color: #666; font-size: 0.9em; margin-left: 24px;">${item.notes}</span>` : ''}
        </li>
      `;
    }
  } else {
    html += '<li style="color: #666;">No specific materials found. Check sources below.</li>';
  }

  html += '</ul><h2 style="color: #d32f2f;">❌ Not Accepted</h2><ul style="list-style: none; padding: 0;">';

  // Not accepted materials
  if (rules.not_accepted && rules.not_accepted.length > 0) {
    for (const item of rules.not_accepted) {
      html += `
        <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
          <span style="color: #f44336; margin-right: 8px;">✗</span>
          <strong>${item.material}</strong>
          ${item.notes ? `<br><span style="color: #666; font-size: 0.9em; margin-left: 24px;">${item.notes}</span>` : ''}
        </li>
      `;
    }
  } else {
    html += '<li style="color: #666;">No specific restrictions found.</li>';
  }

  html += '</ul>';

  // Tips
  if (rules.tips && rules.tips.length > 0) {
    html += '<h2 style="color: #ff9800;">💡 Tips</h2><ul>';
    for (const tip of rules.tips) {
      html += `<li style="padding: 4px 0;">${tip}</li>`;
    }
    html += '</ul>';
  }

  // Sources
  html += '<h2 style="color: #1976d2;">📚 Sources</h2><ol style="padding-left: 20px;">';
  if (rules.sources && rules.sources.length > 0) {
    for (const source of rules.sources) {
      html += `
        <li style="padding: 4px 0;">
          <a href="${source.url}" target="_blank" style="color: #1976d2;">${source.title}</a>
        </li>
      `;
    }
  }
  html += '</ol>';

  // Footer
  html += `
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 0.85em;">
        ✓✓ = Confirmed by multiple sources<br>
        ✓ = Found in one source — verify with official guidelines
      </p>
    </div>
  `;

  return html;
}

/**
 * Format recycling rules as Markdown
 * 
 * Creates Markdown suitable for documentation, README files,
 * or apps that render Markdown (Notion, Slack, etc.)
 * 
 * @param {Object} rules - Structured recycling rules object
 * @returns {string} Formatted Markdown
 */
function formatAsMarkdown(rules) {
  let md = `# ♻️ Recycling Guide\n\n`;
  md += `**📍 Location:** ${rules.location}\n\n`;

  // Accepted
  md += `## ✅ Accepted Materials\n\n`;
  if (rules.accepted && rules.accepted.length > 0) {
    for (const item of rules.accepted) {
      const icon = item.confidence === 'high' ? '✓✓' : '✓';
      md += `- ${icon} **${item.material}**`;
      if (item.notes && item.notes !== 'Verify with source' && item.notes !== 'Confirmed by multiple sources') {
        md += ` — ${item.notes}`;
      }
      md += '\n';
    }
  } else {
    md += '_No specific materials found. Check sources below._\n';
  }
  md += '\n';

  // Not Accepted
  md += `## ❌ Not Accepted\n\n`;
  if (rules.not_accepted && rules.not_accepted.length > 0) {
    for (const item of rules.not_accepted) {
      md += `- ✗ **${item.material}**`;
      if (item.notes && item.notes !== 'Check local guidelines for disposal') {
        md += ` — ${item.notes}`;
      }
      md += '\n';
    }
  } else {
    md += '_No specific restrictions found._\n';
  }
  md += '\n';

  // Tips
  if (rules.tips && rules.tips.length > 0) {
    md += `## 💡 Tips\n\n`;
    for (const tip of rules.tips) {
      md += `- ${tip}\n`;
    }
    md += '\n';
  }

  // Sources
  md += `## 📚 Sources\n\n`;
  if (rules.sources && rules.sources.length > 0) {
    for (let i = 0; i < rules.sources.length; i++) {
      const source = rules.sources[i];
      md += `${i + 1}. [${source.title}](${source.url})\n`;
    }
  }
  md += '\n';

  // Legend
  md += `---\n\n`;
  md += `_✓✓ = Confirmed by multiple sources | ✓ = Verify with official guidelines_\n`;

  return md;
}

// ============================================
// Export all formatters
// ============================================
module.exports = {
  formatAsText,
  formatAsHtml,
  formatAsMarkdown
};
