import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SalaryLedgerPDFData } from "@/types/pdf";
import { PdfEmployeeInfo, PdfFooter, PdfHeader, pdfStyles } from "@/components/pdf/PdfShared";

const styles = StyleSheet.create({
  table: {
    border: "1pt solid #cfcfcf",
    marginBottom: 16,
  },
  headRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottom: "1pt solid #999",
  },
  headCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#444",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #eaeaea",
  },
  cell: {
    fontSize: 8.5,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  colDate: { width: "22%" },
  colMode: { width: "26%" },
  colAmount: { width: "26%", textAlign: "right" },
  colEarned: { width: "26%", textAlign: "right" },

  closingBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1pt solid #333",
    marginTop: 4,
    paddingTop: 8,
    fontSize: 11,
  },
  closingBalanceLabel: { fontFamily: "Helvetica-Bold" },
  closingBalanceValue: { fontFamily: "Helvetica-Bold" },
});

export function SalaryLedgerPDF({ data }: { data: SalaryLedgerPDFData }) {
  return (
    <Document
      title={`${data.employeeName} Salary Ledger ${data.reportingFrom} - ${data.reportingTo}`}
    >
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader companyName={data.companyName} subtitle="Employee Salary Ledger" />

        <PdfEmployeeInfo
          employeeName={data.employeeName}
          designation={data.designation}
          project={data.project}
          reportingFrom={data.reportingFrom}
          reportingTo={data.reportingTo}
        />

        <Text style={pdfStyles.sectionTitle}>Salary Ledger</Text>
        <View style={styles.table}>
          <View style={styles.headRow}>
            <Text style={[styles.headCell, styles.colDate]}>Date</Text>
            <Text style={[styles.headCell, styles.colMode]}>Mode</Text>
            <Text style={[styles.headCell, styles.colAmount]}>Amount</Text>
            <Text style={[styles.headCell, styles.colEarned]}>Earned</Text>
          </View>
          {data.rows.length === 0 ? (
            <View style={styles.row}>
              <Text style={[styles.cell, { width: "100%", textAlign: "center", color: "#888" }]}>
                No ledger entries for this period
              </Text>
            </View>
          ) : (
            data.rows.map((row, i) => (
              <View style={styles.row} key={i}>
                <Text style={[styles.cell, styles.colDate]}>{row.date}</Text>
                <Text style={[styles.cell, styles.colMode]}>{row.mode}</Text>
                <Text style={[styles.cell, styles.colAmount]}>{row.amount}</Text>
                <Text style={[styles.cell, styles.colEarned]}>{row.earned}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.closingBalanceRow}>
          <Text style={styles.closingBalanceLabel}>Month Closing Balance</Text>
          <Text style={styles.closingBalanceValue}>{data.monthClosingBalance}</Text>
        </View>

        <PdfFooter companyName={data.companyName} />
      </Page>
    </Document>
  );
}
