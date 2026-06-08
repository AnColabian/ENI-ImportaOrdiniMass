sap.ui.define([], function () {
    "use strict";
    return {
        cellText: function (vValue, sProperty, oErrors) {
            if (oErrors && oErrors[sProperty]) {
                return oErrors[sProperty].text;
            }
            if (sProperty === "ServicePerformanceDate") {
                return this.formatDateDisplay(vValue);
            }
            return vValue === null || vValue === undefined ? "" : String(vValue);
        },
        cellState: function (sProperty, oErrors) {
            return oErrors && oErrors[sProperty] ? "Error" : "None";
        },
        cellIcon: function (sProperty, oErrors) {
            return oErrors && oErrors[sProperty] ? "sap-icon://error" : "";
        },
        formatDateDisplay: function (sValue) {
            if (!sValue) {
                return "";
            }
            const sDateValue = String(sValue).replace(/\D/g, "");
            if (!/^\d{8}$/.test(sDateValue)) {
                return String(sValue);
            }
            if (/^\d{4}/.test(sDateValue)) {
                return sDateValue.substring(6, 8) + "/" + sDateValue.substring(4, 6) + "/" + sDateValue.substring(0, 4);
            }
            return sDateValue.substring(0, 2) + "/" + sDateValue.substring(2, 4) + "/" + sDateValue.substring(4, 8);
        },
        positionResultDetailText: function (sLabel, vValue) {
            const sValue = vValue === null || vValue === undefined ? "" : String(vValue);
            return sLabel + ": " + sValue;
        }
    };
});