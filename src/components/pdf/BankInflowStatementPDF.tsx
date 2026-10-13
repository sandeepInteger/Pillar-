import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PdfFooter, PdfHeader, formatInr, pdfStyles } from "@/components/pdf/PdfShared";

const BORDER = "1pt solid #cfcfcf";
const HAIRLINE = "0.5pt solid #eaeaea";

export interface BankInflowStatementRow {
  sr: number;
  date: string;
  reference: string;
  amount: number;
  runningTotal: number;
}

export interface BankInflowStatementPDFData {
  companyName: string;
  projectName: string;
  projectCode: string;
  clientName: string;
  location: string;
  periodFrom: string;
  periodTo: string;
  generatedOn: string;
  rows: BankInflowStatementRow[];
  total: number;
}

const styles = StyleSheet.create({
  section: { marginBottom: 8 },
  table: { border: BORDER },
  headRow: { flexDirection: "row", backgroundColor: "#f0f0f0", borderBottom: "1pt solid #999" },
  row: { flexDirection: "row", borderBottom: HAIRLINE },
  cell: { fontSize: 7.5, paddingVertical: 2.5, paddingHorizontal: 5 },
  headCell: { fontFamily: "Helvetica-Bold", color: "#444" },
  cSr: { width: "7%", textAlign: "center" },
  cDate: { width: "16%" },
  cRef: { width: "43%" },
  cAmount: { width: "17%", textAlign: "right" },
  cRunning: { width: "17%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1pt solid #333",
    backgroundColor: "#f0f0f0",
    paddingVertical: 4,
    paddingHorizontal: 5,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
});

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <View style={pdfStyles.infoCol}>
      <Text style={pdfStyles.infoLabel}>{label}</Text>
      <Text style={pdfStyles.infoValue}>{value}</Text>
    </View>
  );
}

export function BankInflowStatementPDF({ data }: { data: BankInflowStatementPDFData }) {
  return (
    <Document title={`${data.projectName} Bank Inflow Statement`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader companyName={data.companyName} subtitle="Project Bank Inflow Statement" />

        <View style={pdfStyles.infoBlock}>
          <View style={pdfStyles.infoRow}>
            <InfoPair label="Project" value={`${data.projectName} (${data.projectCode})`} />
            <InfoPair label="Client" value={data.clientName} />
          </View>
          <View style={pdfStyles.infoRow}>
            <InfoPair label="Location" value={data.location} />
            <InfoPair label="Period" value={`${data.periodFrom} - ${data.periodTo}`} />
          </View>
          <View style={pdfStyles.infoRow}>
            <InfoPair label="Transactions" value={String(data.rows.length)} />
            <InfoPair label="Generated on" value={data.generatedOn} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={pdfStyles.sectionTitle}>Transactions</Text>
          <View style={styles.table}>
            <View style={styles.headRow} fixed>
              <Text style={[styles.cell, styles.headCell, styles.cSr]}>Sr</Text>
              <Text style={[styles.cell, styles.headCell, styles.cDate]}>Date received</Text>
              <Text style={[styles.cell, styles.headCell, styles.cRef]}>Reference / note</Text>
              <Text style={[styles.cell, styles.headCell, styles.cAmount]}>Amount</Text>
              <Text style={[styles.cell, styles.headCell, styles.cRunning]}>Running total</Text>
            </View>
            {data.rows.length === 0 ? (
              <View style={styles.row}>
                <Text style={[styles.cell, { width: "100%", textAlign: "center", color: "#888" }]}>
                  No bank inflows recorded for this project
                </Text>
              </View>
            ) : (
              data.rows.map((row) => (
                <View style={styles.row} key={row.sr} wrap={false}>
                  <Text style={[styles.cell, styles.cSr]}>{row.sr}</Text>
                  <Text style={[styles.cell, styles.cDate]}>{row.date}</Text>
                  <Text style={[styles.cell, styles.cRef]}>{row.reference}</Text>
                  <Text style={[styles.cell, styles.cAmount]}>{formatInr(row.amount)}</Text>
                  <Text style={[styles.cell, styles.cRunning]}>{formatInr(row.runningTotal)}</Text>
                </View>
              ))
            )}
            <View style={styles.totalRow} wrap={false}>
              <Text>Total received</Text>
              <Text>{formatInr(data.total)}</Text>
            </View>
          </View>
        </View>

        <PdfFooter companyName={data.companyName} />
      </Page>
    </Document>
  );
}
