sap.ui.define([
    "importaordinivendita/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "importaordinivendita/model/models",
    "importaordinivendita/model/formatter"
], (BaseController, JSONModel, MessageToast, MessageBox, Fragment, models, formatter) => {
    "use strict";
    return BaseController.extend("importaordinivendita.controller.ImportDetail", {
        formatter: formatter,
        models: models,
        onInit() {
            const oData = JSON.parse(JSON.stringify(models.oImportsHistoryMock));
            oData.visibleRows = oData.rows.slice();
            oData.count = oData.visibleRows.length;
            this.getView().setModel(new JSONModel(oData), "history");
        },
        onNavBackToImport() {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },
        onHistorySearch() {
            this._applyHistoryFilters();
        },
        onHistoryFilterChange() {
            this._applyHistoryFilters();
        },
        onHistoryAdaptFilters() {
            MessageToast.show("Adatta filtri non ancora collegato");
        },
        onHistorySetCompleted() {
            MessageToast.show("Imposta come Completato non ancora collegato");
        },
        onHistorySettings() {
            MessageToast.show("Impostazioni tabella non ancora collegate");
        },
        onHistoryRowPress(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("history");
            const oRow = oContext ? oContext.getObject() : null;
            if (!oRow) {
                return;
            }
            this.getOwnerComponent().getRouter().navTo("RouteImportDetail", {
                ImportId: oRow.ImportId
            });
        },
        _applyHistoryFilters() {
            const oModel = this.getView().getModel("history");
            const oFilters = oModel.getProperty("/filters");
            const aRows = oModel.getProperty("/rows") || [];
            const sSearch = this._normalizeSearchValue(oFilters.search);
            const sImportDate = this._normalizeSearchValue(oFilters.importDate);
            const sImportName = this._normalizeSearchValue(oFilters.importName);
            const sStatus = this._normalizeSearchValue(oFilters.status);
            const aVisibleRows = aRows.filter(function (oRow) {
                const bSearchMatch = !sSearch || this._normalizeSearchValue(oRow.ImportName).indexOf(sSearch) !== -1 || this._normalizeSearchValue(oRow.ImportAuthor).indexOf(sSearch) !== -1;
                const bDateMatch = !sImportDate || this._normalizeSearchValue(oRow.ImportDate).indexOf(sImportDate) !== -1;
                const bNameMatch = !sImportName || this._normalizeSearchValue(oRow.ImportName).indexOf(sImportName) !== -1;
                const bStatusMatch = !sStatus || this._normalizeSearchValue(oRow.ProcessingStatus) === sStatus;
                return bSearchMatch && bDateMatch && bNameMatch && bStatusMatch;
            }.bind(this));
            oModel.setProperty("/visibleRows", aVisibleRows);
            oModel.setProperty("/count", aVisibleRows.length);
        },
        _normalizeSearchValue(vValue) {
            return vValue === null || vValue === undefined ? "" : String(vValue).trim().toLowerCase();
        },

    });
});