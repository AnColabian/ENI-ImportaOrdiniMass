sap.ui.define([
    "importaordinivendita/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "importaordinivendita/model/formatter"
], function (BaseController, JSONModel, MessageToast, MessageBox, Fragment, formatter) {
    "use strict";
    return BaseController.extend("importaordinivendita.controller.ImportDetail", {
        formatter: formatter,
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteImportDetail").attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched() {
    const oElabModel = this.getOwnerComponent().getModel("elaborazione");
    const oElab = oElabModel ? oElabModel.getData() : {};
    const aResults = oElab.DettaglioElabSet || [];
    const aRows = aResults.map(function (oItem) {
        return {
            IdOdvTmp: oItem.IdOdvTmp || "",
            Posnr: oItem.Posnr || "",
            Stato: oItem.Stato || "",
            StatoState: formatter.statoStateDetail(oItem.Stato),
            RowHighlight: formatter.statoHighlightDetail(oItem.Stato),
            Messaggio: oItem.Messaggio || "",
            DocCreato: oItem.DocCreato || "",
            Fkart: oItem.Fkart || "",
            Kunrg: oItem.Kunrg || "",
            Kunag: oItem.Kunag || "",
            Vkorg: oItem.Vkorg || "",
            Vtweg: oItem.Vtweg || "",
            Spart: oItem.Spart || "",
            AugruAuft: oItem.AugruAuft || "",
            Matnr: oItem.Matnr || "",
            Werks: oItem.Werks || "",
            Netwr: oItem.Netwr || "",
            Zterm: oItem.Zterm || "",
            Waerk: oItem.Waerk || "",
            Prctr: oItem.Prctr || "",
            Kostl: oItem.Kostl || "",
            Kschl: oItem.Kschl || "",
            Taxk1: oItem.Taxk1 || "",
            DataPrestAtt: oItem.DataPrestAtt || "",
            Testo0: oItem.Testo0 || "",
            Testo1: oItem.Testo1 || "",
            Testo2: oItem.Testo2 || "",
            Testo3: oItem.Testo3 || "",
            Testo4: oItem.Testo4 || "",
            Testo5: oItem.Testo5 || ""
        };
    });
    const bHasKo = aRows.some(function (o) { return String(o.Stato).trim().toUpperCase() === "KO"; });
    this.getView().setModel(new JSONModel({
        FileId: oElab.FileId || "",
        FileName: oElab.FileName || "",
        ImportAuthor: oElab.ImportAuthor || "",
        DataOraDisplay: oElab.DataOraDisplay || "",
        Stato: oElab.Stato || "",
        StatoState: formatter.statoState(oElab.Stato),
        Totale: oElab.Totale || 0,
        Ok: oElab.Ok || 0,
        Ko: oElab.Ko || 0,
        HasKo: bHasKo,
        Search: "",
        Rows: aRows,
        VisibleRows: aRows.slice(),
        Count: aRows.length,
        SelectedLogMessages: [],
        CorrectionFile: null,
        CorrectionSelectedFileName: "",
        CorrectionPreviewRows: [],
        CorrectionParsedRows: [],
        CorrectionValidationMessages: [],
        CorrectionValidationMessage: "",
        CorrectionValidationMessageType: "Information",
        CorrectionShowValidationMessage: false,
        CorrectionHasValidationErrors: false,
        CorrectionPreviewVisible: false,
        CorrectionCanImport: false
    }), "detail");
},
onOpenApplicationLog(oEvent) {
    const oContext = oEvent.getSource().getBindingContext("detail");
    const oRow = oContext ? oContext.getObject() : null;
    if (!oRow) {
        return;
    }
    const aMessages = oRow.Messaggio ? [{
        Severity: oRow.Stato || "",
        SeverityState: formatter.statoStateDetail(oRow.Stato),
        Description: oRow.Messaggio,
        Timestamp: oRow.DataPrestAtt ? formatter.formatDateDisplay(oRow.DataPrestAtt) : ""
    }] : [];
    this.getView().getModel("detail").setProperty("/SelectedLogMessages", aMessages);
    this._openApplicationLogDialog();
},
        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("RouteImports");
        },
        onBackToImports() {
            this.getOwnerComponent().getRouter().navTo("RouteImports");
        },
        onDetailSearch() {
            this._applyFilters();
        },
        _applyFilters() {
            const oModel = this.getView().getModel("detail");
            const sSearch = String(oModel.getProperty("/Search") || "").trim().toLowerCase();
            const aRows = oModel.getProperty("/Rows") || [];
            const aVisibleRows = aRows.filter(function (oRow) {
                return !sSearch ||
                    String(oRow.IdOdvTmp || "").toLowerCase().indexOf(sSearch) !== -1 ||
                    String(oRow.Posnr || "").toLowerCase().indexOf(sSearch) !== -1 ||
                    String(oRow.Stato || "").toLowerCase().indexOf(sSearch) !== -1 ||
                    String(oRow.Messaggio || "").toLowerCase().indexOf(sSearch) !== -1 ||
                    String(oRow.DocCreato || "").toLowerCase().indexOf(sSearch) !== -1;
            });
            oModel.setProperty("/VisibleRows", aVisibleRows);
            oModel.setProperty("/Count", aVisibleRows.length);
        },
        onCloseApplicationLogDialog() {
            this.byId("applicationLogDialog").close();
        },
        onRetryImport() {
            this._clearCorrectionImport();
            this._openCorrectionImportDialog();
        },
        onCorrectionFileUploaderChange(oEvent) {
            const aFiles = oEvent.getParameter("files");
            const oFile = aFiles && aFiles.length ? aFiles[0] : null;
            this._setCorrectionSelectedFile(oFile);
        },
        onCorrectionFileTypeMissmatch(oEvent) {
            const sFileName = oEvent.getParameter("fileName") || "";
            MessageBox.error("Il file " + sFileName + " non è valido. Sono ammessi solo file .xls e .xlsx.");
            this._clearCorrectionImport();
        },
        onShowCorrectionValidationDetails() {
            const aMessages = this.getView().getModel("detail").getProperty("/CorrectionValidationMessages") || [];
            if (!aMessages.length) {
                MessageToast.show("Nessun messaggio da visualizzare");
                return;
            }
            MessageBox.error(aMessages.join("\n"));
        },
        onCorrectionImport() {
            const oModel = this.getView().getModel("detail");
            const oFile = oModel.getProperty("/CorrectionFile");
            const aParsedRows = oModel.getProperty("/CorrectionParsedRows") || [];
            const bHasErrors = oModel.getProperty("/CorrectionHasValidationErrors");
            const sFileId = oModel.getProperty("/FileId");
            const sFileName = oModel.getProperty("/FileName");
            if (bHasErrors) {
                MessageBox.warning("Correggi gli errori del file prima di importare.");
                return;
            }
            if (!aParsedRows.length) {
                MessageBox.warning("Il file non contiene righe da importare.");
                return;
            }
            const oUploadPayload = this._buildCorrectionUploadPayload(oFile ? oFile.name : sFileName, aParsedRows, sFileId);
            const oElaboraPayload = {
                FileName: oFile ? oFile.name : sFileName,
                FileId: sFileId
            };
            this._doPost("/sap/opu/odata/sap/ZODATA_IMPORTA_ODV_SRV/UploadFileSet", oUploadPayload).then(function () {
                return this._doPost("/sap/opu/odata/sap/ZODATA_IMPORTA_ODV_SRV/ElaboraFileSet", oElaboraPayload);
            }.bind(this)).then(function (oData) {
                const oEntry = oData && oData.d ? oData.d : {};
                const sEsito = String(oEntry.Esito || "").trim().toUpperCase();
                const sMessage = String(oEntry.Message || "").trim();
                this.byId("correctionImportDialog").close();
                this._clearCorrectionImport();
                const oMessageBoxOptions = {
                    actions: ["Importa Ordini di Vendita da file", "Controlla elaborazioni"],
                    emphasizedAction: "Controlla elaborazioni",
                    onClose: function (sAction) {
                        if (sAction === "Importa Ordini di Vendita da file") {
                            this.getOwnerComponent().getRouter().navTo("RouteView1");
                        } else {
                            this.getOwnerComponent().getRouter().navTo("RouteImports");
                        }
                    }.bind(this)
                };
                if (sEsito === "OK") {
                    MessageBox.success(sMessage || "File inviato in elaborazione.", oMessageBoxOptions);
                } else {
                    MessageBox.error(sMessage || "Errore durante l'elaborazione.", oMessageBoxOptions);
                }
            }.bind(this)).catch(function (oXHR) {
                MessageBox.error(this._getODataErrorMessage(oXHR));
            }.bind(this));
        },
        onCloseCorrectionImportDialog() {
            this._clearCorrectionImport();
            this.byId("correctionImportDialog").close();
        },
        _setCorrectionSelectedFile(oFile) {
            if (!oFile) {
                this._clearCorrectionImport();
                return;
            }
            if (!this.isExcelFile(oFile)) {
                MessageBox.error("Il file " + oFile.name + " non è valido. Sono ammessi solo file .xls e .xlsx.");
                this._clearCorrectionImport();
                return;
            }
            const oModel = this.getView().getModel("detail");
            const sExpectedFileName = oModel.getProperty("/FileName");
            if (oFile.name !== sExpectedFileName) {
                MessageBox.error("Il nome del file deve corrispondere al file originale: \"" + sExpectedFileName + "\".");
                this._clearCorrectionImport();
                return;
            }
            oModel.setProperty("/CorrectionFile", oFile);
            oModel.setProperty("/CorrectionSelectedFileName", oFile.name);
            oModel.setProperty("/CorrectionCanImport", false);
            this.readExcelFile(oFile).then(function (aRows) {
                this._parseCorrectionExcelRows(aRows);
            }.bind(this)).catch(function (oError) {
                this.showExcelReadError(oError);
                this._clearCorrectionImport();
            }.bind(this));
        },
        _parseCorrectionExcelRows(aExcelRows) {
            const oModel = this.getView().getModel("detail");
            const oResult = this.parseExcelRows(aExcelRows);
            oModel.setProperty("/CorrectionPreviewRows", oResult.itemRows || []);
            oModel.setProperty("/CorrectionParsedRows", oResult.parsedRows);
            oModel.setProperty("/CorrectionValidationMessages", oResult.messages);
            oModel.setProperty("/CorrectionHasValidationErrors", oResult.hasErrors);
            oModel.setProperty("/CorrectionShowValidationMessage", true);
            oModel.setProperty("/CorrectionValidationMessageType", oResult.hasErrors ? "Error" : "Success");
            oModel.setProperty("/CorrectionValidationMessage", oResult.hasErrors ? "Il file contiene dati mancanti o non validi. Numero di messaggi: " + oResult.messages.length : "Il file è corretto. Clicca Importa per procedere.");
            oModel.setProperty("/CorrectionPreviewVisible", true);
            oModel.setProperty("/CorrectionCanImport", !oResult.hasErrors && oResult.parsedRows.length > 0);
        },
        _buildCorrectionUploadPayload(sFileName, aParsedRows, sFileId) {
            const aDetails = aParsedRows.map(function (oRow) {
                return {
                    FileId: sFileId,
                    IdOdvTmp: String(oRow.TemporarySalesOrderId || ""),
                    Posnr: String(oRow.Position || ""),
                    Fkart: String(oRow.NoteType || ""),
                    Kunrg: String(oRow.ShipToParty || ""),
                    Kunag: String(oRow.SoldToParty || ""),
                    Vkorg: String(oRow.SalesOrganization || ""),
                    Vtweg: String(oRow.DistributionChannel || ""),
                    Spart: String(oRow.Division || ""),
                    AugruAuft: String(oRow.Reason || ""),
                    Matnr: String(oRow.Material || ""),
                    Werks: String(oRow.PlantDivision || ""),
                    Netwr: String(oRow.Amount || ""),
                    Zterm: String(oRow.PaymentTerms || ""),
                    Waerk: String(oRow.Currency || ""),
                    Prctr: String(oRow.ProfitCenter || ""),
                    Testo0: String(oRow.Text0 || ""),
                    Testo1: String(oRow.Text1 || ""),
                    Testo2: String(oRow.Text2 || ""),
                    Testo3: String(oRow.Text3 || ""),
                    Testo4: String(oRow.Text4 || ""),
                    Testo5: String(oRow.Text5 || ""),
                    Kostl: String(oRow.CostCenter || ""),
                    Taxk1: String(oRow.AlternativeTaxClassification || ""),
                    Kschl: String(oRow.ConditionType || ""),
                    DataPrestAtt: this._formatServicePerformanceDateForUpload(oRow.ServicePerformanceDate)
                };
            }.bind(this));
            return {
                FileId: sFileId,
                FileName: sFileName,
                DettaglioFileSet: aDetails
            };
        },
        _formatServicePerformanceDateForUpload(sValue) {
            const sDateValue = String(sValue || "").replace(/\D/g, "");
            if (!/^\d{8}$/.test(sDateValue)) {
                return "";
            }
            const sFirstFour = sDateValue.substring(0, 4);
            if (/^(19|20)\d{2}$/.test(sFirstFour)) {
                return sDateValue.substring(6, 8) + sDateValue.substring(4, 6) + sDateValue.substring(0, 4);
            }
            return sDateValue;
        },
        _clearCorrectionImport() {
            const oModel = this.getView().getModel("detail");
            const oFileUploader = this.byId("correctionFileUploader");
            if (!oModel) {
                return;
            }
            oModel.setProperty("/CorrectionFile", null);
            oModel.setProperty("/CorrectionSelectedFileName", "");
            oModel.setProperty("/CorrectionPreviewRows", []);
            oModel.setProperty("/CorrectionParsedRows", []);
            oModel.setProperty("/CorrectionValidationMessages", []);
            oModel.setProperty("/CorrectionValidationMessage", "");
            oModel.setProperty("/CorrectionValidationMessageType", "Information");
            oModel.setProperty("/CorrectionShowValidationMessage", false);
            oModel.setProperty("/CorrectionHasValidationErrors", false);
            oModel.setProperty("/CorrectionPreviewVisible", false);
            oModel.setProperty("/CorrectionCanImport", false);
            if (oFileUploader) {
                oFileUploader.clear();
                oFileUploader.setValue("");
            }
        },
        _openApplicationLogDialog() {
            const oView = this.getView();
            if (!this._pApplicationLogDialog) {
                this._pApplicationLogDialog = Fragment.load({
                    id: oView.getId(),
                    name: "importaordinivendita.view.fragment.ApplicationLogDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pApplicationLogDialog.then(function (oDialog) {
                oDialog.open();
            });
        },
        _openCorrectionImportDialog() {
            const oView = this.getView();
            if (!this._pCorrectionImportDialog) {
                this._pCorrectionImportDialog = Fragment.load({
                    id: oView.getId(),
                    name: "importaordinivendita.view.fragment.CorrectionImportDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pCorrectionImportDialog.then(function (oDialog) {
                oDialog.open();
            });
        }
    });
});