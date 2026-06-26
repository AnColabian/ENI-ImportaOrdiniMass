sap.ui.define([
    "importaordinivendita/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "importaordinivendita/model/models",
    "importaordinivendita/model/formatter",
    "sap/ui/thirdparty/jquery"
], (BaseController, JSONModel, MessageToast, MessageBox, Fragment, Filter, FilterOperator, models, formatter, jQuery) => {
    "use strict";
    return BaseController.extend("importaordinivendita.controller.View1", {
        formatter: formatter,
        onInit() {
            const aColumnSettings = this._getInitialColumnSettings();
            this.getView().setModel(new JSONModel({
                importName: "",
                selectedFileName: "",
                hasFile: false,
                canImport: false,
                file: null,
                checkFileResult: null,
                backendFileId: "",
                previewVisible: false,
                previewRows: [],
                itemRows: [],
                detailRows: [],
                parsedRows: [],
                validationMessages: [],
                validationMessage: "",
                validationMessageType: "Information",
                showValidationMessage: false,
                hasValidationErrors: false,
                columnSettings: aColumnSettings,
                columnSettingsDraft: [],
                columnSettingsCount: aColumnSettings.length,
                selectedColumnCount: aColumnSettings.filter(function (oColumn) {
                    return oColumn.visible;
                }).length,
                allColumnsSelected: false,
                fclLayout: "OneColumn",
                selectedHeaderTitle: "",
                positionDetailsVisible: false,
                positionDetailsButtonText: "Mostra dettagli"
            }), "view");
            this.fetchCsrfToken().catch(function () {
            });
        },

        onAfterRendering() {
            this._attachDropAreaEvents();
        },
        onExit() {
            this._detachDropAreaEvents();
        },
        onDownloadTemplate() {
            const oTemplateExcel = models.oTemplateExcel;
            if (!window.XLSX) {
                MessageBox.error("Libreria XLSX non caricata. Verifica thirdparty/xlsx.full.min.js in index.html.");
                return;
            }
            const aHeaderRow = this._getTemplateExcelHeaderRow(oTemplateExcel.columns);
            const oWorksheet = window.XLSX.utils.aoa_to_sheet([aHeaderRow]);
            oWorksheet["!cols"] = this._getTemplateExcelColumnWidths(oTemplateExcel.columns);
            const oWorkbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(oWorkbook, oWorksheet, "Template");
            window.XLSX.writeFile(oWorkbook, oTemplateExcel.fileName + ".xlsx");
            MessageToast.show("Modello Excel scaricato");
        },
        _getTemplateExcelHeaderRow(aColumns) {
            return aColumns.map(function (oColumn) {
                return oColumn.label;
            });
        },
        _getTemplateExcelColumnWidths(aColumns) {
            return aColumns.map(function (oColumn) {
                return {
                    wch: oColumn.width || 20
                };
            });
        },
        onFileUploaderChange(oEvent) {
            const aFiles = oEvent.getParameter("files");
            const oFile = aFiles && aFiles.length ? aFiles[0] : null;
            this._setSelectedFile(oFile);
        },
        _checkFileNameAvailable(sFileName) {
            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url: "/sap/opu/odata/sap/ZODATA_IMPORTA_ODV_SRV/CheckFileSet(FileName='" + encodeURIComponent(sFileName) + "')",
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    success: function (oData) {
                        const oEntry = oData && oData.d ? oData.d : {};
                        const sEsito = String(oEntry.Esito || "").trim().toUpperCase();
                        const sMessage = String(oEntry.Message || "").trim();
                        if (sEsito === "OK") {
                            resolve(oEntry);
                            return;
                        }
                        MessageBox.error(sMessage || "File non valido per l'importazione.");
                        reject(oEntry);
                    },
                    error: function (oXHR) {
                        let sMessage = "Errore durante il controllo del file.";
                        try {
                            const oResponse = JSON.parse(oXHR.responseText);
                            sMessage = oResponse && oResponse.error && oResponse.error.message && oResponse.error.message.value ? oResponse.error.message.value : sMessage;
                        } catch (oError) {
                            sMessage = oXHR.responseText || sMessage;
                        }
                        MessageBox.error(sMessage);
                        reject(oXHR);
                    }
                });
            });
        },
        onFileTypeMissmatch(oEvent) {
            const sFileName = oEvent.getParameter("fileName") || "";
            MessageBox.error("Il file " + sFileName + " non è valido. Sono ammessi solo file .xls e .xlsx.");
            this._clearSelectedFile();
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
        _buildUploadPayload(sFileName, aParsedRows) {
            const oViewModel = this.getView().getModel("view");
            const sFileId = oViewModel.getProperty("/backendFileId");
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
        onImport() {
            const oViewModel = this.getView().getModel("view");
            const oFile = oViewModel.getProperty("/file");
            const aParsedRows = oViewModel.getProperty("/parsedRows") || [];
            const bHasValidationErrors = oViewModel.getProperty("/hasValidationErrors");
            const sBackendFileId = oViewModel.getProperty("/backendFileId");
            if (!oFile) {
                MessageBox.warning("Seleziona un file Excel prima di importare.");
                return;
            }
            if (!sBackendFileId) {
                MessageBox.warning("FileId non disponibile. Riesegui la selezione del file.");
                return;
            }
            if (bHasValidationErrors) {
                MessageBox.warning("Correggi gli errori del file prima di importare.");
                return;
            }
            if (!aParsedRows.length) {
                MessageBox.warning("Il file non contiene righe da importare.");
                return;
            }
            const oPayload = this._buildUploadPayload(oFile.name, aParsedRows);
            this._doPost("/sap/opu/odata/sap/ZODATA_IMPORTA_ODV_SRV/UploadFileSet", oPayload).then(function () {
                this.getOwnerComponent().getRouter().navTo("RouteImports");
            }.bind(this)).catch(function (oXHR) {
                MessageBox.error(this._getODataErrorMessage(oXHR));
            }.bind(this));
        },
        onCancel() {
            this._clearSelectedFile();
            this.getView().getModel("view").setProperty("/importName", "");
        },
        onShowValidationDetails() {
            const aMessages = this.getView().getModel("view").getProperty("/validationMessages") || [];
            if (!aMessages.length) {
                MessageToast.show("Nessun messaggio da visualizzare");
                return;
            }
            MessageBox.error(aMessages.join("\n"));
        },
        onShowPreviewSettings() {
            this._openColumnSettingsDialog();
        },
        _openColumnSettingsDialog() {
            const oView = this.getView();
            const oViewModel = oView.getModel("view");
            const aCurrentSettings = oViewModel.getProperty("/columnSettings") || [];
            oViewModel.setProperty("/columnSettingsDraft", JSON.parse(JSON.stringify(aCurrentSettings)));
            this._refreshColumnSettingsCounters(aCurrentSettings);
            if (!this._pColumnSettingsDialog) {
                this._pColumnSettingsDialog = Fragment.load({
                    id: oView.getId(),
                    name: "importaordinivendita.view.fragment.ColumnSettingsDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pColumnSettingsDialog.then(function (oDialog) {
                const oSearchField = this.byId("columnSettingsSearchField");
                const oList = this.byId("columnSettingsList");
                const oBinding = oList ? oList.getBinding("items") : null;
                if (oSearchField) {
                    oSearchField.setValue("");
                }
                if (oBinding) {
                    oBinding.filter([]);
                }
                oDialog.open();
            }.bind(this));
        },
        _refreshColumnSettingsCounters(aSettings) {
            const oViewModel = this.getView().getModel("view");
            const iSelectedCount = aSettings.filter(function (oColumn) {
                return oColumn.visible;
            }).length;
            oViewModel.setProperty("/selectedColumnCount", iSelectedCount);
            oViewModel.setProperty("/columnSettingsCount", aSettings.length);
            oViewModel.setProperty("/allColumnsSelected", iSelectedCount === aSettings.length);
        },
        _getInitialColumnSettings() {
            return models.oTemplateExcel.columns.filter(function (oColumn) {
                return models.aHeaderColumnProperties.indexOf(oColumn.property) !== -1;
            }).map(function (oColumn, iIndex) {
                return {
                    index: iIndex,
                    label: oColumn.label.replace("*", "").trim(),
                    templateLabel: oColumn.label,
                    property: oColumn.property,
                    visible: models.aDefaultHeaderColumnProperties.indexOf(oColumn.property) !== -1,
                    defaultVisible: models.aDefaultHeaderColumnProperties.indexOf(oColumn.property) !== -1
                };
            });
        },

        onPreviewRowPress(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("view");
            const oRow = oContext ? oContext.getObject() : null;
            const oViewModel = this.getView().getModel("view");
            if (!oRow) {
                return;
            }
            const sTemporarySalesOrderId = String(oRow.TemporarySalesOrderId || "");
            const aItemRows = oViewModel.getProperty("/itemRows") || [];
            const aDetailRows = aItemRows.filter(function (oItemRow) {
                return String(oItemRow.TemporarySalesOrderId || "") === sTemporarySalesOrderId;
            });
            oViewModel.setProperty("/detailRows", aDetailRows.length ? aDetailRows : oRow._items || []);
            oViewModel.setProperty("/selectedHeaderTitle", sTemporarySalesOrderId);
            oViewModel.setProperty("/positionDetailsVisible", false);
            oViewModel.setProperty("/positionDetailsButtonText", "Mostra dettagli");
            oViewModel.setProperty("/fclLayout", "TwoColumnsMidExpanded");
        },
        onTogglePositionDetails() {
            const oViewModel = this.getView().getModel("view");
            const bVisible = !oViewModel.getProperty("/positionDetailsVisible");
            oViewModel.setProperty("/positionDetailsVisible", bVisible);
            oViewModel.setProperty("/positionDetailsButtonText", bVisible ? "Nascondi dettagli" : "Mostra dettagli");
        },
        onCloseDetail() {
            const oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/detailRows", []);
            oViewModel.setProperty("/selectedHeaderTitle", "");
            oViewModel.setProperty("/positionDetailsVisible", false);
            oViewModel.setProperty("/positionDetailsButtonText", "Mostra dettagli");
            oViewModel.setProperty("/fclLayout", "OneColumn");
        },
        onToggleDetailFullScreen() {
            const oViewModel = this.getView().getModel("view");
            const sCurrentLayout = oViewModel.getProperty("/fclLayout");
            oViewModel.setProperty("/fclLayout", sCurrentLayout === "MidColumnFullScreen" ? "TwoColumnsMidExpanded" : "MidColumnFullScreen");
        },
        onColumnSettingsSearch(oEvent) {
            const sValue = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
            const oList = this.byId("columnSettingsList");
            const oBinding = oList ? oList.getBinding("items") : null;
            if (!oBinding) {
                return;
            }
            if (!sValue) {
                oBinding.filter([]);
                return;
            }
            oBinding.filter([new Filter("label", FilterOperator.Contains, sValue)]);
        },
        onColumnSettingsToggleAll(oEvent) {
            const bSelected = oEvent.getParameter("selected");
            const oViewModel = this.getView().getModel("view");
            const aDraft = oViewModel.getProperty("/columnSettingsDraft").map(function (oColumn) {
                return Object.assign({}, oColumn, {
                    visible: bSelected
                });
            });
            oViewModel.setProperty("/columnSettingsDraft", aDraft);
            this._refreshColumnSettingsCounters(aDraft);
        },
        onColumnSettingsItemSelect(oEvent) {
            const oCheckBox = oEvent.getSource();
            const oContext = oCheckBox.getBindingContext("view");
            const oViewModel = this.getView().getModel("view");
            if (!oContext) {
                return;
            }
            oViewModel.setProperty(oContext.getPath() + "/visible", oEvent.getParameter("selected"));
            this._refreshColumnSettingsCounters(oViewModel.getProperty("/columnSettingsDraft"));
        },
        onColumnSettingsConfirm() {
            const oViewModel = this.getView().getModel("view");
            const aDraft = oViewModel.getProperty("/columnSettingsDraft") || [];
            const bHasVisibleColumn = aDraft.some(function (oColumn) {
                return oColumn.visible;
            });
            if (!bHasVisibleColumn) {
                MessageBox.warning("Seleziona almeno una colonna da visualizzare.");
                return;
            }
            oViewModel.setProperty("/columnSettings", JSON.parse(JSON.stringify(aDraft)));
            this._refreshColumnSettingsCounters(aDraft);
            this.byId("columnSettingsDialog").close();
        },
        onColumnSettingsCancel() {
            this.byId("columnSettingsDialog").close();
        },
        _attachDropAreaEvents() {
            const oDropArea = this.byId("dropArea");
            const oDropAreaDomRef = oDropArea ? oDropArea.getDomRef() : null;
            if (!oDropAreaDomRef) {
                this._detachDropAreaEvents();
                return;
            }
            if (this._oDropAreaDomRef === oDropAreaDomRef) {
                return;
            }
            this._detachDropAreaEvents();
            this._fnDragEnter = this._fnDragEnter || this._onDropAreaDragEnter.bind(this);
            this._fnDragOver = this._fnDragOver || this._onDropAreaDragOver.bind(this);
            this._fnDragLeave = this._fnDragLeave || this._onDropAreaDragLeave.bind(this);
            this._fnDrop = this._fnDrop || this._onDropAreaDrop.bind(this);
            this._oDropAreaDomRef = oDropAreaDomRef;
            this._oDropAreaDomRef.addEventListener("dragenter", this._fnDragEnter);
            this._oDropAreaDomRef.addEventListener("dragover", this._fnDragOver);
            this._oDropAreaDomRef.addEventListener("dragleave", this._fnDragLeave);
            this._oDropAreaDomRef.addEventListener("drop", this._fnDrop);
        },
        _detachDropAreaEvents() {
            if (!this._oDropAreaDomRef) {
                return;
            }
            if (this._fnDragEnter) {
                this._oDropAreaDomRef.removeEventListener("dragenter", this._fnDragEnter);
            }
            if (this._fnDragOver) {
                this._oDropAreaDomRef.removeEventListener("dragover", this._fnDragOver);
            }
            if (this._fnDragLeave) {
                this._oDropAreaDomRef.removeEventListener("dragleave", this._fnDragLeave);
            }
            if (this._fnDrop) {
                this._oDropAreaDomRef.removeEventListener("drop", this._fnDrop);
            }
            this._oDropAreaDomRef = null;
        },
        _onDropAreaDragEnter(oEvent) {
            oEvent.preventDefault();
            oEvent.stopPropagation();
            this.byId("dropArea").addStyleClass("iovDropAreaActive");
        },
        _onDropAreaDragOver(oEvent) {
            oEvent.preventDefault();
            oEvent.stopPropagation();
            oEvent.dataTransfer.dropEffect = "copy";
        },
        _onDropAreaDragLeave(oEvent) {
            oEvent.preventDefault();
            oEvent.stopPropagation();
            this.byId("dropArea").removeStyleClass("iovDropAreaActive");
        },
        _onDropAreaDrop(oEvent) {
            oEvent.preventDefault();
            oEvent.stopPropagation();
            this.byId("dropArea").removeStyleClass("iovDropAreaActive");
            const aFiles = oEvent.dataTransfer && oEvent.dataTransfer.files ? oEvent.dataTransfer.files : [];
            const oFile = aFiles.length ? aFiles[0] : null;
            this._setSelectedFile(oFile);
        },
        _setSelectedFile(oFile) {
            if (!oFile) {
                this._clearSelectedFile();
                return;
            }
            if (!this.isExcelFile(oFile)) {
                MessageBox.error("Il file " + oFile.name + " non è valido. Sono ammessi solo file .xls e .xlsx.");
                this._clearSelectedFile();
                return;
            }
            const oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/file", oFile);
            oViewModel.setProperty("/selectedFileName", oFile.name);
            oViewModel.setProperty("/hasFile", true);
            oViewModel.setProperty("/canImport", false);
            oViewModel.setProperty("/importName", this.getImportNameFromFile(oFile.name));
            this._checkFileNameAvailable(oFile.name).then(function (oCheckResult) {
                oViewModel.setProperty("/checkFileResult", oCheckResult);
                oViewModel.setProperty("/backendFileId", oCheckResult.FileId || "");
                this._readExcelFile(oFile);
            }.bind(this)).catch(function () {
                this._clearSelectedFile();
            }.bind(this));
        },
        _readExcelFile(oFile) {
            this.readExcelFile(oFile).then(function (aRows) {
                this._parseExcelRows(aRows);
            }.bind(this)).catch(function (oError) {
                this.showExcelReadError(oError);
                this._clearSelectedFile();
            }.bind(this));
        },
        _parseExcelRows(aExcelRows) {
            const oViewModel = this.getView().getModel("view");
            const oResult = this.parseExcelRows(aExcelRows);
            this._applyDefaultAndErrorColumnVisibility(oResult.errorProperties);
            oViewModel.setProperty("/previewRows", oResult.previewRows);
            oViewModel.setProperty("/itemRows", oResult.itemRows || []);
            oViewModel.setProperty("/detailRows", []);
            oViewModel.setProperty("/parsedRows", oResult.parsedRows);
            oViewModel.setProperty("/validationMessages", oResult.messages);
            oViewModel.setProperty("/hasValidationErrors", oResult.hasErrors);
            oViewModel.setProperty("/showValidationMessage", true);
            oViewModel.setProperty("/validationMessageType", oResult.hasErrors ? "Error" : "Success");
            oViewModel.setProperty("/validationMessage", oResult.hasErrors ? "Il file contiene dati mancanti, non validi o doppi. Numero di messaggi: " + oResult.messages.length : "È ora possibile importare gli ordini di vendita.");
            oViewModel.setProperty("/previewVisible", true);
            oViewModel.setProperty("/canImport", !oResult.hasErrors && oResult.parsedRows.length > 0);
            oViewModel.setProperty("/fclLayout", "OneColumn");
            oViewModel.setProperty("/selectedHeaderTitle", "");
        },
        _applyDefaultAndErrorColumnVisibility(aErrorProperties) {
            const oViewModel = this.getView().getModel("view");
            const aErrorColumnProperties = aErrorProperties || [];
            const aColumnSettings = (oViewModel.getProperty("/columnSettings") || []).map(function (oColumn) {
                const bDefaultVisible = models.aDefaultHeaderColumnProperties.indexOf(oColumn.property) !== -1;
                const bHeaderColumn = models.aHeaderColumnProperties.indexOf(oColumn.property) !== -1;
                const bHasError = aErrorColumnProperties.indexOf(oColumn.property) !== -1;
                return Object.assign({}, oColumn, {
                    visible: bDefaultVisible || bHeaderColumn && bHasError,
                    defaultVisible: bDefaultVisible
                });
            });
            oViewModel.setProperty("/columnSettings", aColumnSettings);
            this._refreshColumnSettingsCounters(aColumnSettings);
        },
        _clearSelectedFile() {
            const oViewModel = this.getView().getModel("view");
            const oFileUploader = this.byId("fileUploader");
            const aColumnSettings = this._getInitialColumnSettings();
            this._detachDropAreaEvents();
            oViewModel.setProperty("/file", null);
            oViewModel.setProperty("/selectedFileName", "");
            oViewModel.setProperty("/hasFile", false);
            oViewModel.setProperty("/canImport", false);
            oViewModel.setProperty("/checkFileResult", null);
            oViewModel.setProperty("/backendFileId", "");
            oViewModel.setProperty("/previewVisible", false);
            oViewModel.setProperty("/previewRows", []);
            oViewModel.setProperty("/itemRows", []);
            oViewModel.setProperty("/detailRows", []);
            oViewModel.setProperty("/parsedRows", []);
            oViewModel.setProperty("/validationMessages", []);
            oViewModel.setProperty("/validationMessage", "");
            oViewModel.setProperty("/validationMessageType", "Information");
            oViewModel.setProperty("/showValidationMessage", false);
            oViewModel.setProperty("/hasValidationErrors", false);
            oViewModel.setProperty("/columnSettings", aColumnSettings);
            oViewModel.setProperty("/columnSettingsDraft", []);
            oViewModel.setProperty("/fclLayout", "OneColumn");
            oViewModel.setProperty("/selectedHeaderTitle", "");
            oViewModel.setProperty("/positionDetailsVisible", false);
            oViewModel.setProperty("/positionDetailsButtonText", "Mostra dettagli");
            this._refreshColumnSettingsCounters(aColumnSettings);
            if (oFileUploader) {
                oFileUploader.clear();
                oFileUploader.setValue("");
            }
            setTimeout(function () {
                this._attachDropAreaEvents();
            }.bind(this), 0);
        },
        onShowAllImports() {
            this.getOwnerComponent().getRouter().navTo("RouteImports");
        }
    });
});