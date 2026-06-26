sap.ui.define([], function () {
    "use strict";
    var oFormatter = {
        cellText: function (vValue, sProperty, oErrors) {
            if (oErrors && oErrors[sProperty]) {
                return oErrors[sProperty].text;
            }
            if (sProperty === "ServicePerformanceDate") {
                return oFormatter.formatDateDisplay(vValue);
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
        formatDataOra: function (sData, sOra) {
            const sD = String(sData || "").replace(/\D/g, "");
            const sO = String(sOra || "").replace(/\D/g, "");
            let sResult = "";
            if (/^\d{8}$/.test(sD)) {
                sResult = sD.substring(6, 8) + "." + sD.substring(4, 6) + "." + sD.substring(0, 4);
            }
            if (/^\d{6}$/.test(sO)) {
                sResult += (sResult ? " " : "") + sO.substring(0, 2) + ":" + sO.substring(2, 4) + ":" + sO.substring(4, 6);
            }
            return sResult;
        },
        statoState: function (sStato) {
            const s = String(sStato || "").trim().toLowerCase();
            if (s === "completato") {
                return "Success";
            }
            if (s === "in errore") {
                return "Error";
            }
            if (s === "in elaborazione") {
                return "Warning";
            }
            return "None";
        },
        statoHighlight: function (sStato) {
            const s = String(sStato || "").trim().toLowerCase();
            if (s === "completato") {
                return "Success";
            }
            if (s === "in errore") {
                return "Error";
            }
            if (s === "in elaborazione") {
                return "Warning";
            }
            return "None";
        },
        statoIcon: function (sStato) {
            const s = String(sStato || "").trim().toLowerCase();
            if (s === "completato") {
                return "sap-icon://accept";
            }
            if (s === "in errore") {
                return "sap-icon://error";
            }
            if (s === "in elaborazione") {
                return "sap-icon://warning";
            }
            return "sap-icon://information";
        },
        statoStateDetail: function (sStato) {
            const s = String(sStato || "").trim().toLowerCase();
            if (s === "ok") {
                return "Success";
            }
            if (s === "ko") {
                return "Error";
            }
            return "None";
        },
        statoHighlightDetail: function (sStato) {
            const s = String(sStato || "").trim().toLowerCase();
            if (s === "ok") {
                return "Success";
            }
            if (s === "ko") {
                return "Error";
            }
            return "None";
        },
        statoIconDetail: function (sStato) {
            const s = String(sStato || "").trim().toLowerCase();
            if (s === "ok") {
                return "sap-icon://accept";
            }
            if (s === "ko") {
                return "sap-icon://error";
            }
            return "sap-icon://lateness";
        },
        statoTextDetail: function (sStato) {
            const s = String(sStato || "").trim();
            if (s) {
                return s;
            }
            return "In elaborazione";
        },
        positionResultDetailText: function (sLabel, vValue) {
            const sValue = vValue === null || vValue === undefined ? "" : String(vValue);
            return sLabel + ": " + sValue;
        }
    };
    return oFormatter;
});