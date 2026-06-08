sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";
    return {
        oTemplateExcel: {
            fileName: "Template_APP IMPORT DATA from Excel",
            columns: [
                { label: "ID (odv temporaneo)*", property: "TemporarySalesOrderId", type: "String", width: 24 },
                { label: "Posizione*", property: "Position", type: "Number", width: 12 },
                { label: "Tipo nota*", property: "NoteType", type: "String", width: 14 },
                { label: "Destinatario merci*", property: "ShipToParty", type: "String", width: 22 },
                { label: "Committente*", property: "SoldToParty", type: "String", width: 16 },
                { label: "Org Comm*", property: "SalesOrganization", type: "String", width: 14 },
                { label: "Can Distr*", property: "DistributionChannel", type: "String", width: 14 },
                { label: "Sett Merc*", property: "Division", type: "String", width: 14 },
                { label: "Causale*", property: "Reason", type: "String", width: 12 },
                { label: "Materiale*", property: "Material", type: "String", width: 14 },
                { label: "Divisione*", property: "PlantDivision", type: "String", width: 14 },
                { label: "Importo*", property: "Amount", type: "Number", width: 16, scale: 2 },
                { label: "Cond Pag*", property: "PaymentTerms", type: "String", width: 14 },
                { label: "Valuta*", property: "Currency", type: "String", width: 10 },
                { label: "Centro Profitto*", property: "ProfitCenter", type: "String", width: 20 },
                { label: "Testo 0", property: "Text0", type: "String", width: 16 },
                { label: "Testo 1", property: "Text1", type: "String", width: 18 },
                { label: "Testo 2", property: "Text2", type: "String", width: 18 },
                { label: "Testo 3", property: "Text3", type: "String", width: 18 },
                { label: "Testo 4 ", property: "Text4", type: "String", width: 18 },
                { label: "Testo 5", property: "Text5", type: "String", width: 22 },
                { label: "Centro Costo*", property: "CostCenter", type: "String", width: 18 },
                { label: "Classif.fisc. Alternativa*", property: "AlternativeTaxClassification", type: "String", width: 28 },
                { label: "Tipo cond.*", property: "ConditionType", type: "String", width: 14 },
                { label: "Data Prestazione Attività*", property: "ServicePerformanceDate", type: "String", width: 28 }
            ],
            rows: []
        },
        aHeaderColumnProperties: [
            "TemporarySalesOrderId",
            "NoteType",
            "ShipToParty",
            "SoldToParty",
            "SalesOrganization",
            "DistributionChannel",
            "Division",
            "Reason",
            "PaymentTerms",
            "Currency"
        ],
        aItemColumnProperties: [
            "Position",
            "Material",
            "PlantDivision",
            "ProfitCenter",
            "CostCenter",
            "ServicePerformanceDate"
        ],
        aDefaultHeaderColumnProperties: [
            "TemporarySalesOrderId",
            "NoteType",
            "ShipToParty",
            "SoldToParty",
            "SalesOrganization",
            "DistributionChannel",
            "Division",
            "Reason",
            "PaymentTerms",
            "Currency"
        ],
        aPositionResultDetailFields: [
            { label: "Tipo condizione", property: "ConditionType" },
            { label: "Importo condizione", property: "Amount" },
            { label: "Divisa", property: "Currency" },
            { label: "Unità di prezzo", property: "PricingUnit" },
            { label: "Unità di misura", property: "UnitOfMeasure" },
            { label: "Testo 0", property: "Text0" },
            { label: "Testo 1", property: "Text1" },
            { label: "Testo 2", property: "Text2" },
            { label: "Testo 3", property: "Text3" },
            { label: "Testo 4", property: "Text4" },
            { label: "Testo 5", property: "Text5" },
            { label: "Classif.fisc. Alternativa", property: "AlternativeTaxClassification" }
        ],
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        oImportsHistoryMock: {
            filters: {
                search: "",
                importDate: "",
                importName: "",
                status: ""
            },
            rows: [
                {
                    ImportId: "001",
                    ImportName: "Modello d'importazione dell'ordine di vendita_ZFEIfinalxlsx",
                    ProcessingStatus: "Contiene errori",
                    ProcessingStatusState: "Error",
                    Created: "",
                    Failed: 1,
                    ManuallyProcessed: "",
                    ImportDate: "09.04.2026, 08:47:43",
                    ImportAuthor: "EXT2045608",
                    RowHighlight: "Error"
                },
                {
                    ImportId: "002",
                    ImportName: "Modello d'importazione dell'ordine di vendita_ZFEIfinalxlsx",
                    ProcessingStatus: "Contiene errori",
                    ProcessingStatusState: "Error",
                    Created: "",
                    Failed: 1,
                    ManuallyProcessed: "",
                    ImportDate: "08.04.2026, 20:56:54",
                    ImportAuthor: "EXT2045608",
                    RowHighlight: "Error"
                }
            ],
            visibleRows: [],
            statusItems: [
                {
                    key: "",
                    text: ""
                },
                {
                    key: "Contiene errori",
                    text: "Contiene errori"
                },
                {
                    key: "Completato",
                    text: "Completato"
                },
                {
                    key: "In elaborazione",
                    text: "In elaborazione"
                }
            ]
        },
        oImportDetailsMock: {
            "001": {
                ImportId: "001",
                ImportName: "Modello d'importazione dell'ordine di vendita_ZFEIfinalxlsx",
                ImportAuthor: "EXT2045608",
                ImportDate: "09.04.2026, 08:47:43",
                Created: "–",
                Failed: 1,
                ManuallyProcessed: "–",
                ProcessingStatus: "Contiene errori",
                ProcessingStatusState: "Error",
                MessageText: "Correggi i record errati e importa nuovamente.",
                Rows: [
                    {
                        TemporarySalesOrderId: "70",
                        CreationStatus: "Non riuscito",
                        CreationStatusState: "Error",
                        SalesOrder: "",
                        SalesOrderType: "",
                        CreationDate: "",
                        ImportAuthor: "EXT2045608",
                        DistributionChannel: "",
                        SalesOrganization: "",
                        Division: "",
                        RowHighlight: "Error",
                        Messages: [
                            {
                                Severity: "Errore",
                                SeverityState: "Error",
                                Description: "Il ruolo partner TZ non è previsto nello schema partner ZX ()",
                                Timestamp: "09.04.2026, 08:47:43"
                            }
                        ]
                    }
                ],
                VisibleRows: []
            },
            "002": {
                ImportId: "002",
                ImportName: "Modello d'importazione dell'ordine di vendita_ZFEIfinalxlsx",
                ImportAuthor: "EXT2045608",
                ImportDate: "08.04.2026, 20:56:54",
                Created: "–",
                Failed: 1,
                ManuallyProcessed: "–",
                ProcessingStatus: "Contiene errori",
                ProcessingStatusState: "Error",
                MessageText: "Correggi i record errati e importa nuovamente.",
                Rows: [
                    {
                        TemporarySalesOrderId: "80",
                        CreationStatus: "Non riuscito",
                        CreationStatusState: "Error",
                        SalesOrder: "",
                        SalesOrderType: "",
                        CreationDate: "",
                        ImportAuthor: "EXT2045608",
                        DistributionChannel: "",
                        SalesOrganization: "",
                        Division: "",
                        RowHighlight: "Error",
                        Messages: [
                            {
                                Severity: "Errore",
                                SeverityState: "Error",
                                Description: "Il ruolo partner TZ non è previsto nello schema partner ZX ()",
                                Timestamp: "08.04.2026, 20:56:54"
                            }
                        ]
                    }
                ],
                VisibleRows: []
            }
        },
    };
});