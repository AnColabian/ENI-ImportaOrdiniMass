sap.ui.define([
    "importaordinivendita/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "importaordinivendita/model/formatter",
    "sap/ui/thirdparty/jquery"
], function (BaseController, JSONModel, MessageBox, formatter, jQuery) {
    "use strict";
    return BaseController.extend("importaordinivendita.controller.Imports", {
        formatter: formatter,
        onInit() {
            this.getView().setModel(new JSONModel({
                filters: {
                    status: ""
                },
                rows: [],
                visibleRows: [],
                fileNameItems: [],
                statusItems: [
                    { key: "", text: "Tutti" },
                    { key: "Caricato", text: "Caricato" },
                    { key: "In Elaborazione", text: "In Elaborazione" },
                    { key: "Completato", text: "Completato" },
                    { key: "In Errore", text: "In Errore" }
                ],
                count: 0,
                busy: false
            }), "history");
            this.getOwnerComponent().getRouter().getRoute("RouteImports").attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched() {
            this._loadStoricoFile();
        },
        _loadStoricoFile() {
            const oModel = this.getView().getModel("history");
            oModel.setProperty("/busy", true);
            jQuery.ajax({
                url: "/sap/opu/odata/sap/ZODATA_IMPORTA_ODV_SRV/StoricoFileSet",
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function (oData) {
                    const aResults = oData && oData.d && oData.d.results ? oData.d.results : [];
                    const aRows = aResults.map(function (oEntry) {
                        return {
                            FileId: oEntry.FileId || "",
                            FileName: oEntry.FileName || "",
                            Data: oEntry.Data || "",
                            Ora: oEntry.Ora || "",
                            DataOraDisplay: formatter.formatDataOra(oEntry.Data, oEntry.Ora),
                            Stato: String(oEntry.Stato || "").trim(),
                            ImportAuthor: oEntry.ImportAuthor || ""
                        };
                    });
                    const aFileNameItems = aRows.reduce(function (aAcc, oRow) {
                        if (oRow.FileName && !aAcc.find(function (o) { return o.key === oRow.FileName; })) {
                            aAcc.push({ key: oRow.FileName, text: oRow.FileName });
                        }
                        return aAcc;
                    }, []);
                    oModel.setProperty("/rows", aRows);
                    oModel.setProperty("/visibleRows", aRows.slice());
                    oModel.setProperty("/count", aRows.length);
                    oModel.setProperty("/fileNameItems", aFileNameItems);
                    oModel.setProperty("/busy", false);
                    this._resetFilters();
                }.bind(this),
                error: function (oXHR) {
                    oModel.setProperty("/busy", false);
                    let sMessage = "Errore durante il caricamento dello storico.";
                    try {
                        const oResponse = JSON.parse(oXHR.responseText);
                        if (oResponse && oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                            sMessage = oResponse.error.message.value;
                        }
                    } catch (e) { }
                    MessageBox.error(sMessage);
                }.bind(this)
            });
        },
        _resetFilters() {
            const oModel = this.getView().getModel("history");
            oModel.setProperty("/filters/status", "");
            const oDRP = this.byId("importsPeriodoPicker");
            if (oDRP) {
                oDRP.setValue("");
            }
            const oMCB = this.byId("importsFileNameMultiCombo");
            if (oMCB) {
                oMCB.setSelectedKeys([]);
            }
        },
        onHistorySearch() {
            this._applyHistoryFilters();
        },
        onHistoryReset() {
            const oModel = this.getView().getModel("history");
            this._resetFilters();
            oModel.setProperty("/visibleRows", oModel.getProperty("/rows").slice());
            oModel.setProperty("/count", oModel.getProperty("/rows").length);
        },
        _applyHistoryFilters() {
            const oModel = this.getView().getModel("history");
            const sStatus = String(oModel.getProperty("/filters/status") || "").trim();
            const oDRP = this.byId("importsPeriodoPicker");
            const oMCB = this.byId("importsFileNameMultiCombo");
            const oDateFrom = oDRP ? oDRP.getDateValue() : null;
            const oDateTo = oDRP ? oDRP.getSecondDateValue() : null;
            const aSelectedKeys = oMCB ? oMCB.getSelectedKeys() : [];
            const aRows = oModel.getProperty("/rows") || [];
            const aVisibleRows = aRows.filter(function (oRow) {
                let bDateMatch = true;
                if (oDateFrom || oDateTo) {
                    const sD = String(oRow.Data || "").replace(/\D/g, "");
                    if (/^\d{8}$/.test(sD)) {
                        const oRowDate = new Date(
                            Number(sD.substring(0, 4)),
                            Number(sD.substring(4, 6)) - 1,
                            Number(sD.substring(6, 8))
                        );
                        if (oDateFrom && oRowDate < oDateFrom) {
                            bDateMatch = false;
                        }
                        if (oDateTo && oRowDate > oDateTo) {
                            bDateMatch = false;
                        }
                    } else {
                        bDateMatch = false;
                    }
                }
                const bNameMatch = !aSelectedKeys.length || aSelectedKeys.indexOf(oRow.FileName) !== -1;
                const bStatusMatch = !sStatus || oRow.Stato === sStatus;
                return bDateMatch && bNameMatch && bStatusMatch;
            });
            oModel.setProperty("/visibleRows", aVisibleRows);
            oModel.setProperty("/count", aVisibleRows.length);
        },
        onHistoryRowPress(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("history");
            const oRow = oContext ? oContext.getObject() : null;
            if (!oRow) {
                return;
            }
            const oPayload = {
                FileName: oRow.FileName,
                FileId: oRow.FileId,
                DettaglioElabSet: []
            };
            this._doPost("/sap/opu/odata/sap/ZODATA_IMPORTA_ODV_SRV/VisElaborazioneSet", oPayload).then(function (oData) {
                const oEntry = oData && oData.d ? oData.d : {};
                const aResults = oEntry.DettaglioElabSet && oEntry.DettaglioElabSet.results ? oEntry.DettaglioElabSet.results : [];
                const iTotale = aResults.length;
                const iOk = aResults.filter(function (o) { return String(o.Stato || "").trim().toUpperCase() === "OK"; }).length;
                const iKo = aResults.filter(function (o) { return String(o.Stato || "").trim().toUpperCase() === "KO"; }).length;
                this.getOwnerComponent().setModel(new JSONModel({
                    FileId: oEntry.FileId || "",
                    FileName: oEntry.FileName || "",
                    ImportAuthor: oRow.ImportAuthor || "",
                    DataOraDisplay: oRow.DataOraDisplay || "",
                    Stato: oRow.Stato || "",
                    StatoState: formatter.statoState(oRow.Stato),
                    Totale: iTotale,
                    Ok: iOk,
                    Ko: iKo,
                    DettaglioElabSet: aResults
                }), "elaborazione");
                this.getOwnerComponent().getRouter().navTo("RouteImportDetail", {
                    ImportId: oEntry.FileId || "0"
                });
            }.bind(this)).catch(function (oXHR) {
                MessageBox.error(this._getODataErrorMessage(oXHR));
            }.bind(this));
        },
        onNavBackToImport() {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        }
    });
});