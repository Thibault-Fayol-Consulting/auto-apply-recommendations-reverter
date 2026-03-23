/**
 * ==========================================================================
 * Auto-Apply Recommendations Monitor & Reporter — Google Ads Script
 * ==========================================================================
 * Detects changes auto-applied by Google on your account (via change_event)
 * and sends a detailed email report. Helps you stay in control of automated
 * optimisations Google applies without explicit approval.
 *
 * NOTE: Google Ads Scripts cannot programmatically revert auto-applied
 * changes. This script monitors and reports them so you can act manually.
 *
 * Author:  Thibault Fayol — Consultant SEA
 * Website: https://thibaultfayol.com
 * License: MIT — Thibault Fayol Consulting
 * ==========================================================================
 */

var CONFIG = {
  // --- General -----------------------------------------------------------
  TEST_MODE: true,              // true = log only, false = log + email
  EMAIL: 'contact@domain.com',  // Alert recipient

  // --- Detection ---------------------------------------------------------
  LOOKBACK_DAYS: 7              // How many days to look back
};

// =========================================================================
function main() {
  try {
    var tz = AdsApp.currentAccount().getTimeZone();
    var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
    var accountName = AdsApp.currentAccount().getName();

    Logger.log('=== Auto-Apply Recommendations Monitor ===');
    Logger.log('Account: ' + accountName);
    Logger.log('Date: ' + today);
    Logger.log('Lookback: ' + CONFIG.LOOKBACK_DAYS + ' days');

    // --- Query change_event for Google-internal changes ------------------
    var query =
      'SELECT change_event.change_date_time, ' +
      'change_event.change_resource_type, ' +
      'change_event.client_type, ' +
      'change_event.old_resource, ' +
      'change_event.new_resource, ' +
      'change_event.change_resource_name ' +
      'FROM change_event ' +
      'WHERE change_event.client_type = "GOOGLE_INTERNAL" ' +
      'AND segments.date DURING LAST_' + CONFIG.LOOKBACK_DAYS + '_DAYS';

    var rows = AdsApp.search(query);
    var changes = [];

    while (rows.hasNext()) {
      var row = rows.next();
      var evt = row.changeEvent;
      changes.push({
        dateTime: evt.changeDatetime || evt.changeDateTime || '',
        resourceType: evt.changeResourceType || '',
        clientType: evt.clientType || '',
        resourceName: evt.changeResourceName || '',
        oldResource: JSON.stringify(evt.oldResource || {}),
        newResource: JSON.stringify(evt.newResource || {})
      });
    }

    Logger.log('Found ' + changes.length + ' auto-applied change(s).');

    // --- Categorize by type ----------------------------------------------
    var byType = {};
    changes.forEach(function(c) {
      var t = c.resourceType;
      if (!byType[t]) byType[t] = [];
      byType[t].push(c);
    });

    var types = Object.keys(byType);
    for (var i = 0; i < types.length; i++) {
      Logger.log('  ' + types[i] + ': ' + byType[types[i]].length + ' change(s)');
    }

    if (changes.length === 0) {
      Logger.log('No auto-applied changes detected. Done.');
      return;
    }

    // --- Log details -----------------------------------------------------
    for (var j = 0; j < Math.min(changes.length, 50); j++) {
      var c = changes[j];
      Logger.log('[' + c.dateTime + '] ' + c.resourceType +
        ' — ' + c.resourceName);
    }

    // --- Send email report -----------------------------------------------
    if (!CONFIG.TEST_MODE) {
      sendReport_(accountName, today, changes, byType);
    } else {
      Logger.log('[TEST MODE] Email not sent.');
    }

    Logger.log('=== Done ===');

  } catch (e) {
    Logger.log('FATAL ERROR: ' + e.message);
    if (!CONFIG.TEST_MODE) {
      MailApp.sendEmail(
        CONFIG.EMAIL,
        'ERROR — Auto-Apply Monitor — ' + AdsApp.currentAccount().getName(),
        'Script failed with error:\n' + e.message + '\n\nStack:\n' + e.stack
      );
    }
  }
}

// =========================================================================
// Helpers
// =========================================================================

/**
 * Sends an HTML email report of auto-applied changes.
 */
function sendReport_(accountName, date, changes, byType) {
  // Summary section
  var types = Object.keys(byType);
  var summaryRows = types.map(function(t) {
    return '<tr><td>' + t + '</td><td><b>' + byType[t].length + '</b></td></tr>';
  }).join('\n');

  // Detail table (max 100 rows)
  var detailRows = changes.slice(0, 100).map(function(c) {
    return '<tr>' +
      '<td>' + c.dateTime + '</td>' +
      '<td>' + c.resourceType + '</td>' +
      '<td style="font-size:11px">' + c.resourceName + '</td>' +
      '<td style="font-size:11px;max-width:300px;overflow:hidden">' +
        c.oldResource.substring(0, 200) + '</td>' +
      '<td style="font-size:11px;max-width:300px;overflow:hidden">' +
        c.newResource.substring(0, 200) + '</td>' +
      '</tr>';
  }).join('\n');

  var html =
    '<h2>Auto-Apply Recommendations Monitor — Report</h2>' +
    '<p><b>Account:</b> ' + accountName + '<br>' +
    '<b>Date:</b> ' + date + '<br>' +
    '<b>Total changes detected:</b> ' + changes.length + '</p>' +
    '<h3>Summary by type</h3>' +
    '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse">' +
    '<tr style="background:#f2f2f2"><th>Resource Type</th><th>Count</th></tr>' +
    summaryRows + '</table>' +
    '<h3>Details (first 100)</h3>' +
    '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse">' +
    '<tr style="background:#f2f2f2">' +
    '<th>Date/Time</th><th>Type</th><th>Resource</th><th>Old</th><th>New</th></tr>' +
    detailRows + '</table>' +
    '<p style="color:#888;font-size:11px">Note: Google Ads Scripts cannot revert these changes automatically. ' +
    'Review and revert manually in Google Ads if needed.</p>';

  MailApp.sendEmail({
    to: CONFIG.EMAIL,
    subject: 'Auto-Apply Alert — ' + changes.length + ' changes — ' + accountName,
    htmlBody: html
  });
}
