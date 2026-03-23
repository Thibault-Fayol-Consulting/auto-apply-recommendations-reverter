# Auto-Apply Recommendations Monitor & Reporter

Google Ads Script that detects changes auto-applied by Google on your account and sends a detailed email report.

## What it does

1. Queries `change_event` via GAQL to find changes made by `GOOGLE_INTERNAL`
2. Categorizes changes by resource type (bid changes, keyword additions, etc.)
3. Logs details of each auto-applied change
4. Sends an HTML email report with summary and details

> **Note:** Google Ads Scripts cannot programmatically revert auto-applied changes. This script monitors and reports them so you can act manually.

## Setup

1. Open [Google Ads Scripts](https://ads.google.com/aw/bulk/scripts)
2. Create a new script and paste the contents of `main_en.gs` (or `main_fr.gs`)
3. Edit the `CONFIG` block at the top
4. Run once in test mode, review the logs
5. Set `TEST_MODE: false` and schedule (e.g., daily)

## CONFIG reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `TEST_MODE` | boolean | `true` | `true` = log only, `false` = log + email |
| `EMAIL` | string | `'contact@domain.com'` | Report recipient email |
| `LOOKBACK_DAYS` | number | `7` | How many days to look back |

## How it works

- Uses `AdsApp.search()` with GAQL on `change_event` resource
- Filters for `change_event.client_type = "GOOGLE_INTERNAL"` to isolate Google's auto-applied changes
- Reports `old_resource` and `new_resource` so you can see exactly what changed
- Groups changes by type for a clear summary

## Requirements

- Google Ads account
- Google Ads Scripts access

## License

MIT - Thibault Fayol Consulting
