sap.ui.define([
    "importaordinivendita/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "importaordinivendita/model/models"
], (BaseController, JSONModel, MessageToast, MessageBox, Fragment, models) => {
    "use strict";
    return BaseController.extend("importaordinivendita.controller.ImportDetail", {
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteImportDetail").attachPatternMatched(this._onRouteMatched, this);
        },
        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("RouteImports");
        },
        onBackToImports() {
            this.getOwnerComponent().getRouter().navTo("RouteImports");
        },
        onRefresh() {
            MessageToast.show("Aggiornamento non ancora collegato al servizio");
        },
        onRetryImport() {
            this._openCorrectionImportDialog();
        },
        onSetCompleted() {
            MessageToast.show("Imposta come Completato non ancora collegato al servizio");
        },
        onSettings() {
            MessageToast.show("Impostazioni tabella non ancora collegate");
        },
        onDetailSearch() {
            this._applyFilters();
        },
        onDetailRowPress() {
        },
        onOpenApplicationLog(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("detail");
            const oRow = oContext ? oContext.getObject() : null;
            if (!oRow) {
                return;
            }
            this.getView().getModel("detail").setProperty("/SelectedLogMessages", oRow.Messages || []);
            this._openApplicationLogDialog();
        },
        onCloseApplicationLogDialog() {
            this.byId("applicationLogDialog").close();
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
        onCorrectionImport() {
            const oModel = this.getView().getModel("detail");
            const aParsedRows = oModel.getProperty("/CorrectionParsedRows") || [];
            const bHasErrors = oModel.getProperty("/CorrectionHasValidationErrors");
            if (bHasErrors) {
                MessageBox.warning("Correggi gli errori del file prima di importare.");
                return;
            }
            if (!aParsedRows.length) {
                MessageBox.warning("Il file non contiene righe da importare.");
                return;
            }
            MessageToast.show("Importazione correttiva pronta per " + aParsedRows.length + " righe");
        },
        onCloseCorrectionImportDialog() {
            this._clearCorrectionImport();
            this.byId("correctionImportDialog").close();
        },
        _onRouteMatched(oEvent) {
            const sImportId = oEvent.getParameter("arguments").ImportId;
            const oDetail = JSON.parse(JSON.stringify(models.oImportDetailsMock[sImportId] || models.oImportDetailsMock["001"]));
            oDetail.Search = "";
            oDetail.VisibleRows = oDetail.Rows.slice();
            oDetail.Count = oDetail.VisibleRows.length;
            oDetail.SelectedLogMessages = [];
            oDetail.CorrectionImportName = "";
            oDetail.CorrectionSelectedFileName = "";
            oDetail.CorrectionPreviewRows = [];
            oDetail.CorrectionParsedRows = [];
            oDetail.CorrectionValidationMessages = [];
            oDetail.CorrectionValidationMessage = "";
            oDetail.CorrectionValidationMessageType = "Information";
            oDetail.CorrectionShowValidationMessage = false;
            oDetail.CorrectionHasValidationErrors = false;
            oDetail.CorrectionPreviewVisible = false;
            oDetail.CorrectionCanImport = false;
            this.getView().setModel(new JSONModel(oDetail), "detail");
        },
        _applyFilters() {
            const oModel = this.getView().getModel("detail");
            const sSearch = this._normalizeSearchValue(oModel.getProperty("/Search"));
            const aRows = oModel.getProperty("/Rows") || [];
            const aVisibleRows = aRows.filter(function (oRow) {
                return !sSearch || this._normalizeSearchValue(oRow.TemporarySalesOrderId).indexOf(sSearch) !== -1 || this._normalizeSearchValue(oRow.CreationStatus).indexOf(sSearch) !== -1 || this._normalizeSearchValue(oRow.ImportAuthor).indexOf(sSearch) !== -1;
            }.bind(this));
            oModel.setProperty("/VisibleRows", aVisibleRows);
            oModel.setProperty("/Count", aVisibleRows.length);
        },
        _normalizeSearchValue(vValue) {
            return vValue === null || vValue === undefined ? "" : String(vValue).trim().toLowerCase();
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
            const oModel = oView.getModel("detail");
            this._clearCorrectionImport();
            oModel.setProperty("/CorrectionImportName", oModel.getProperty("/ImportName"));
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
            const oMatchCheck = this._checkCorrectionFailedOrdersMatch(oResult.previewRows);
            if (!oMatchCheck.valid) {
                MessageBox.error("Il proprio file deve contenere almeno un record non riusc. in precedenza");
                this._clearCorrectionImport();
                return;
            }
            oModel.setProperty("/CorrectionPreviewRows", oResult.previewRows);
            oModel.setProperty("/CorrectionParsedRows", oResult.parsedRows);
            oModel.setProperty("/CorrectionValidationMessages", oResult.messages);
            oModel.setProperty("/CorrectionHasValidationErrors", oResult.hasErrors);
            oModel.setProperty("/CorrectionShowValidationMessage", true);
            oModel.setProperty("/CorrectionValidationMessageType", oResult.hasErrors ? "Error" : "Success");
            oModel.setProperty("/CorrectionValidationMessage", oResult.hasErrors ? "Il file contiene dati mancanti, non validi o doppi. Numero di messaggi: " + oResult.messages.length : "È ora possibile importare gli ordini di vendita corretti.");
            oModel.setProperty("/CorrectionPreviewVisible", true);
            oModel.setProperty("/CorrectionCanImport", !oResult.hasErrors && oResult.parsedRows.length > 0);
        },
        _checkCorrectionFailedOrdersMatch(aPreviewRows) {
            const oModel = this.getView().getModel("detail");
            const aFailedIds = (oModel.getProperty("/Rows") || []).filter(function (oRow) {
                return oRow.CreationStatusState === "Error";
            }).map(function (oRow) {
                return String(oRow.TemporarySalesOrderId);
            });
            const bValid = (aPreviewRows || []).some(function (oRow) {
                return aFailedIds.indexOf(String(oRow.TemporarySalesOrderId)) !== -1;
            });
            return {
                valid: bValid
            };
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
        }
    });
});