sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "importaordinivendita/model/models"
], function (Controller, MessageBox, models) {
    "use strict";
    return Controller.extend("importaordinivendita.controller.BaseController", {
        readExcelFile(oFile) {
            return new Promise(function (resolve, reject) {
                if (!window.XLSX) {
                    reject(new Error("Libreria XLSX non caricata. Verifica thirdparty/xlsx.full.min.js in index.html."));
                    return;
                }
                const oReader = new FileReader();
                oReader.onload = function (oEvent) {
                    try {
                        const aData = new Uint8Array(oEvent.target.result);
                        const oWorkbook = window.XLSX.read(aData, {
                            type: "array",
                            cellDates: false
                        });
                        const sSheetName = oWorkbook.SheetNames[0];
                        const oSheet = oWorkbook.Sheets[sSheetName];
                        const aRows = window.XLSX.utils.sheet_to_json(oSheet, {
                            header: 1,
                            raw: false,
                            defval: ""
                        });
                        resolve(aRows);
                    } catch (oError) {
                        reject(oError);
                    }
                };
                oReader.onerror = function () {
                    reject(new Error("Errore durante la lettura del file."));
                };
                oReader.readAsArrayBuffer(oFile);
            });
        },
        parseExcelRows(aExcelRows) {
            const aTemplateColumns = models.oTemplateExcel.columns;
            const aHeader = aExcelRows && aExcelRows.length ? aExcelRows[0] : [];
            const oHeaderCheck = this.validateHeader(aHeader, aTemplateColumns);
            const aDataRows = this.getCompiledExcelRows(aExcelRows.slice(1));
            const oResult = this.validateDataRows(aDataRows, aTemplateColumns, oHeaderCheck.correctColumnIndexes);
            const aPreviewRows = this.buildHeaderPreviewRows(oResult.previewRows);
            const aMessages = oHeaderCheck.messages.concat(oResult.messages);
            return {
                previewRows: aPreviewRows,
                itemRows: oResult.previewRows,
                parsedRows: oResult.parsedRows,
                messages: aMessages,
                hasErrors: aMessages.length > 0,
                errorProperties: oResult.errorProperties
            };
        },
        validateHeader(aHeader, aTemplateColumns) {
            const aMessages = [];
            const aCorrectColumnIndexes = [];
            const iMaxLength = Math.max(aHeader.length, aTemplateColumns.length);
            for (let iIndex = 0; iIndex < iMaxLength; iIndex++) {
                const sActualLabel = this.normalizeHeaderValue(aHeader[iIndex]);
                const sExpectedLabel = aTemplateColumns[iIndex] ? this.normalizeHeaderValue(aTemplateColumns[iIndex].label) : "";
                if (sExpectedLabel && sActualLabel === sExpectedLabel) {
                    aCorrectColumnIndexes.push(iIndex);
                    continue;
                }
                if (sActualLabel) {
                    aMessages.push("Colonna " + this.getExcelColumnLetter(iIndex) + " \"" + sActualLabel + "\" non corrisponde al template.");
                } else if (sExpectedLabel) {
                    aMessages.push("Colonna " + this.getExcelColumnLetter(iIndex) + " \"" + sExpectedLabel + "\" mancante.");
                }
            }
            return {
                messages: aMessages,
                correctColumnIndexes: aCorrectColumnIndexes
            };
        },
        validateDataRows(aDataRows, aTemplateColumns, aCorrectColumnIndexes) {
            const aMessages = [];
            const aPreviewRows = [];
            const aParsedRows = [];
            const mErrorProperties = {};
            const mCorrectIndexes = aCorrectColumnIndexes.reduce(function (mMap, iIndex) {
                mMap[iIndex] = true;
                return mMap;
            }, {});
            aDataRows.forEach(function (aRow, iRowIndex) {
                const iExcelRow = iRowIndex + 2;
                const oPreviewRow = {
                    RowHighlight: "None",
                    _messages: [],
                    _errors: {},
                    _excelRow: iExcelRow,
                    _resultDetails: []
                };
                const oParsedRow = {
                    _excelRow: iExcelRow
                };
                aTemplateColumns.forEach(function (oColumn, iColumnIndex) {
                    const sProperty = oColumn.property;
                    const vCellValue = mCorrectIndexes[iColumnIndex] ? aRow[iColumnIndex] : "";
                    const oCellResult = this.validateCellValue(vCellValue, oColumn);
                    oPreviewRow[sProperty] = oCellResult.displayValue;
                    oParsedRow[sProperty] = oCellResult.parsedValue;
                    if (oCellResult.message) {
                        const sMessage = "Riga " + iExcelRow + ", Colonna " + this.getExcelColumnLetter(iColumnIndex) + " \"" + oColumn.label + "\": " + oCellResult.message;
                        aMessages.push(sMessage);
                        oPreviewRow._messages.push(sMessage);
                        oPreviewRow._errors[sProperty] = {
                            text: oCellResult.displayValue,
                            message: oCellResult.message
                        };
                        mErrorProperties[sProperty] = true;
                    }
                }.bind(this));
                oPreviewRow.PricingUnit = oPreviewRow.PricingUnit || "1";
                oPreviewRow.UnitOfMeasure = oPreviewRow.UnitOfMeasure || "";
                oPreviewRow._resultDetails = this.buildPositionResultDetails(oPreviewRow);
                if (oPreviewRow._messages.length) {
                    oPreviewRow.RowHighlight = "Error";
                }
                aPreviewRows.push(oPreviewRow);
                aParsedRows.push(oParsedRow);
            }.bind(this));
            return {
                messages: aMessages,
                previewRows: aPreviewRows,
                parsedRows: aParsedRows,
                errorProperties: Object.keys(mErrorProperties)
            };
        },
        validateCellValue(vValue, oColumn) {
            const sValue = this.getCellStringValue(vValue);
            if (this.isRequiredColumn(oColumn) && !sValue) {
                return {
                    displayValue: "Obbligatorio",
                    parsedValue: "",
                    message: "valore obbligatorio"
                };
            }
            if (!sValue) {
                return {
                    displayValue: "",
                    parsedValue: "",
                    message: ""
                };
            }
            if (oColumn.property === "Position") {
                return this.validateIntegerValue(sValue);
            }
            if (oColumn.property === "Amount") {
                return this.validateAmountValue(sValue);
            }
            if (oColumn.property === "ServicePerformanceDate") {
                return this.validateServicePerformanceDate(sValue);
            }
            return {
                displayValue: sValue,
                parsedValue: sValue,
                message: ""
            };
        },
        validateIntegerValue(sValue) {
            if (!/^\d+$/.test(sValue)) {
                return {
                    displayValue: "Formato non valido",
                    parsedValue: "",
                    message: "deve essere un numero intero"
                };
            }
            return {
                displayValue: sValue,
                parsedValue: parseInt(sValue, 10),
                message: ""
            };
        },
        validateAmountValue(sValue) {
            const sNormalizedValue = sValue.replace(/\s/g, "").replace(",", ".");
            if (!/^-?\d+(\.\d{1,2})?$/.test(sNormalizedValue)) {
                return {
                    displayValue: "Formato non valido",
                    parsedValue: "",
                    message: "deve essere numerico con massimo 2 decimali"
                };
            }
            const fAmount = Number(sNormalizedValue);
            if (!Number.isFinite(fAmount)) {
                return {
                    displayValue: "Formato non valido",
                    parsedValue: "",
                    message: "deve essere numerico"
                };
            }
            const sParsedValue = fAmount.toFixed(2).replace(".", ",");
            return {
                displayValue: sParsedValue,
                parsedValue: sParsedValue,
                message: ""
            };
        },
        validateServicePerformanceDate(sValue) {
            const sDateValue = sValue.replace(/\D/g, "");
            if (!/^\d{8}$/.test(sDateValue)) {
                return {
                    displayValue: sValue,
                    parsedValue: "",
                    message: "deve essere in formato ddmmyyyy"
                };
            }
            const sDay = sDateValue.substring(0, 2);
            const sMonth = sDateValue.substring(2, 4);
            const sYear = sDateValue.substring(4, 8);
            const oDate = new Date(Number(sYear), Number(sMonth) - 1, Number(sDay));
            const bValidDate = oDate.getFullYear() === Number(sYear) && oDate.getMonth() === Number(sMonth) - 1 && oDate.getDate() === Number(sDay);
            if (!bValidDate) {
                return {
                    displayValue: sDateValue,
                    parsedValue: "",
                    message: "data non valida"
                };
            }
            return {
                displayValue: sDateValue,
                parsedValue: sYear + sMonth + sDay,
                message: ""
            };
        },
        buildHeaderPreviewRows(aItemRows) {
            const mGroups = {};
            aItemRows.forEach(function (oItemRow) {
                const sTemporarySalesOrderId = oItemRow.TemporarySalesOrderId || "";
                const sGroupKey = sTemporarySalesOrderId || "__EMPTY__" + oItemRow._excelRow;
                if (!mGroups[sGroupKey]) {
                    mGroups[sGroupKey] = {
                        RowHighlight: "None",
                        _messages: [],
                        _errors: {},
                        _items: []
                    };
                    models.aHeaderColumnProperties.forEach(function (sProperty) {
                        mGroups[sGroupKey][sProperty] = oItemRow[sProperty];
                        if (oItemRow._errors && oItemRow._errors[sProperty]) {
                            mGroups[sGroupKey]._errors[sProperty] = oItemRow._errors[sProperty];
                        }
                    });
                }
                mGroups[sGroupKey]._items.push(oItemRow);
                if (oItemRow._messages && oItemRow._messages.length) {
                    mGroups[sGroupKey]._messages = mGroups[sGroupKey]._messages.concat(oItemRow._messages);
                    mGroups[sGroupKey].RowHighlight = "Error";
                }
                if (oItemRow._errors) {
                    Object.keys(oItemRow._errors).forEach(function (sProperty) {
                        if (models.aHeaderColumnProperties.indexOf(sProperty) !== -1) {
                            mGroups[sGroupKey]._errors[sProperty] = oItemRow._errors[sProperty];
                        }
                    });
                }
            });
            return Object.keys(mGroups).map(function (sKey) {
                return mGroups[sKey];
            });
        },
        buildPositionResultDetails(oRow) {
            return models.aPositionResultDetailFields.filter(function (oField) {
                const vValue = oRow[oField.property];
                return vValue !== null && vValue !== undefined && String(vValue).trim() !== "";
            }).map(function (oField) {
                return {
                    label: oField.label,
                    value: oRow[oField.property]
                };
            });
        },
        getCompiledExcelRows(aRows) {
            return aRows.filter(function (aRow) {
                return aRow.some(function (vCellValue) {
                    return this.getCellStringValue(vCellValue) !== "";
                }.bind(this));
            }.bind(this));
        },
        getCellStringValue(vValue) {
            if (vValue === null || vValue === undefined) {
                return "";
            }
            return String(vValue).trim();
        },
        normalizeHeaderValue(vValue) {
            return this.getCellStringValue(vValue);
        },
        isRequiredColumn(oColumn) {
            return oColumn.label.indexOf("*") !== -1;
        },
        getExcelColumnLetter(iIndex) {
            let sColumn = "";
            let iColumnNumber = iIndex + 1;
            while (iColumnNumber > 0) {
                const iModulo = (iColumnNumber - 1) % 26;
                sColumn = String.fromCharCode(65 + iModulo) + sColumn;
                iColumnNumber = Math.floor((iColumnNumber - iModulo) / 26);
            }
            return sColumn;
        },
        isExcelFile(oFile) {
            const sFileName = oFile && oFile.name ? oFile.name : "";
            const sLowerFileName = sFileName.toLowerCase();
            return sLowerFileName.endsWith(".xls") || sLowerFileName.endsWith(".xlsx");
        },
        getImportNameFromFile(sFileName) {
            return sFileName.replace(/\.[^/.]+$/, "");
        },
        showExcelReadError(oError) {
            MessageBox.error(oError && oError.message ? oError.message : "Errore durante la lettura del file Excel.");
        }
    });
});