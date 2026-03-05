/**
 * --------------------------------------------------------------------------
 * auto-apply-recommendations-reverter - Google Ads Script for SMBs
 * --------------------------------------------------------------------------
 * Author: Thibault Fayol - Consultant SEA PME
 * Website: https://thibaultfayol.com
 * License: MIT
 * --------------------------------------------------------------------------
 */
var CONFIG = { TEST_MODE: true };
function main() {
    Logger.log("Vérification de l'historique pour l'Auto-Apply...");
    var query = "SELECT change_event.change_resource_name, change_event.user_email FROM change_event WHERE change_event.user_email LIKE '%google%'";
    var results = AdsApp.search(query);
    var count = 0;
    while(results.hasNext()) { results.next(); count++; }
    Logger.log("Trouvé " + count + " modifications automatiques faites par Google.");
}
