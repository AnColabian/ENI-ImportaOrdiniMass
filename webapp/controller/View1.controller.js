sap.ui.define([
    "importaordinivendita/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "importaordinivendita/model/models",
    "importaordinivendita/model/formatter"
], (BaseController, JSONModel, MessageToast, MessageBox, Fragment, Filter, FilterOperator, models, formatter) => {
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
                previewVisible: false,
                previewRows: [],
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
        onShowAllImports() {
            MessageToast.show("Navigazione importazioni non ancora collegata");
        },
        onFileUploaderChange(oEvent) {
            const aFiles = oEvent.getParameter("files");
            const oFile = aFiles && aFiles.length ? aFiles[0] : null;
            this._setSelectedFile(oFile);
        },
        onFileTypeMissmatch(oEvent) {
            const sFileName = oEvent.getParameter("fileName") || "";
            MessageBox.error("Il file " + sFileName + " non è valido. Sono ammessi solo file .xls e .xlsx.");
            this._clearSelectedFile();
        },
        onImport() {
            const oViewModel = this.getView().getModel("view");
            const oFile = oViewModel.getProperty("/file");
            const aParsedRows = oViewModel.getProperty("/parsedRows") || [];
            const bHasValidationErrors = oViewModel.getProperty("/hasValidationErrors");
            if (!oFile) {
                MessageBox.warning("Seleziona un file Excel prima di importare.");
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
            MessageToast.show("Importazione pronta per " + aParsedRows.length + " righe");
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
            oViewModel.setProperty("/detailRows", oRow._items || []);
            oViewModel.setProperty("/selectedHeaderTitle", oRow.TemporarySalesOrderId || "");
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
            this._readExcelFile(oFile);
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
            oViewModel.setProperty("/previewVisible", false);
            oViewModel.setProperty("/previewRows", []);
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