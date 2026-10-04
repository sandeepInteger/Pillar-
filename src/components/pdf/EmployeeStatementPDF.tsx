import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { EmployeeStatementPDFData, StatementDay } from "@/types/pdf";
import { PdfEmployeeInfo, PdfFooter, PdfHeader, formatInr, pdfStyles } from "@/components/pdf/PdfShared";

const BORDER = "1pt solid #cfcfcf";
const HAIRLINE = "0.5pt solid #eaeaea";

const styles = StyleSheet.create({
  section: { marginBottom: 8 },

  summaryTable: { flexDirection: "row", border: BORDER },
  summaryCell: {
    flex: 1,
    borderRight: BORDER,
    paddingVertical: 3,
    alignItems: "center",
  },
  summaryCellLast: { flex: 1, paddingVertical: 3, alignItems: "center" },
  summaryLabel: {
    fontSize: 5.8,
    color: "#666",
    marginBottom: 1,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },

  gridRow: { flexDirection: "row" },
  gridCol: { flex: 1, border: BORDER },
  gridGap: { width: 5 },
  gridTitle: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 2,
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    borderBottom: BORDER,
  },
  gridHead: { flexDirection: "row", borderBottom: "1pt solid #999" },
  gridLine: { flexDirection: "row", borderBottom: HAIRLINE },
  gDate: { width: "44%", fontSize: 6.6, paddingVertical: 1.5, paddingHorizontal: 3 },
  gStatus: { width: "20%", fontSize: 6.6, paddingVertical: 1.5, textAlign: "center" },
  gOt: { width: "36%", fontSize: 6.6, paddingVertical: 1.5, paddingHorizontal: 3, textAlign: "right" },
  gHeadText: { fontFamily: "Helvetica-Bold", color: "#555" },
  absent: { color: "#b42318", fontFamily: "Helvetica-Bold" },

  table: { border: BORDER },
  headRow: { flexDirection: "row", backgroundColor: "#f0f0f0", borderBottom: "1pt solid #999" },
  row: { flexDirection: "row", borderBottom: HAIRLINE },
  cell: { fontSize: 7, paddingVertical: 2, paddingHorizontal: 5 },
  headCell: { fontFamily: "Helvetica-Bold", color: "#444" },
  right: { textAlign: "right" },

  pLabel: { width: "38%" },
  pDetail: { width: "38%", color: "#555" },
  pAmount: { width: "24%", textAlign: "right" },

  lDate: { width: "14%" },
  lDesc: { width: "34%" },
  lMode: { width: "20%" },
  lGiven: { width: "16%", textAlign: "right" },
  lEarned: { width: "16%", textAlign: "right" },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1pt solid #333",
    paddingVertical: 3,
    paddingHorizontal: 5,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },

  balanceBox: { marginTop: 5, border: "1pt solid #333" },
  balanceLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    paddingHorizontal: 8,
    fontSize: 7.5,
  },
  balanceClosing: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#f0f0f0",
    borderTop: "1pt solid #333",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
});

function signedInr(amount: number): string {
  return amount < 0 ? `- ${formatInr(Math.abs(amount))}` : formatInr(amount);
}

function SummaryCell({ label, value, last }: { label: string; value: string | number; last?: boolean }) {
  return (
    <View style={last ? styles.summaryCellLast : styles.summaryCell}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function DayColumn({ label, days }: { label: string; days: StatementDay[] }) {
  return (
    <View style={styles.gridCol}>
      <Text style={styles.gridTitle}>{label}</Text>
      <View style={styles.gridHead}>
        <Text style={[styles.gDate, styles.gHeadText]}>Date</Text>
        <Text style={[styles.gStatus, styles.gHeadText]}>A/P</Text>
        <Text style={[styles.gOt, styles.gHeadText]}>OT</Text>
      </View>
      {days.map((d) => (
        <View style={styles.gridLine} key={d.day}>
          <Text style={styles.gDate}>{d.date}</Text>
          <Text style={d.status === "A" ? [styles.gStatus, styles.absent] : styles.gStatus}>
            {d.status}
          </Text>
          <Text style={styles.gOt}>{d.ot || "-"}</Text>
        </View>
      ))}
    </View>
  );
}

export function EmployeeStatementPDF({ data }: { data: EmployeeStatementPDFData }) {
  const { summary, payable, ledger } = data;
  const owed = ledger.closingBalance >= 0;

  return (
    <Document
      title={`${data.employeeName} Statement ${data.reportingFrom} - ${data.reportingTo}`}
    >
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          companyName={data.companyName}
          subtitle="Monthly Attendance & Salary Statement"
        />

        <PdfEmployeeInfo
          employeeName={`${data.employeeName} (${data.employeeCode})`}
          designation={data.designation}
          project={data.project}
          reportingFrom={data.reportingFrom}
          reportingTo={data.reportingTo}
        />

        {data.tracksAttendance && (
          <>
            <View style={styles.section} wrap={false}>
              <Text style={pdfStyles.sectionTitle}>Attendance Summary</Text>
              <View style={styles.summaryTable}>
                <SummaryCell label="Total Days" value={summary.totalDays} />
                <SummaryCell label="Present" value={summary.present} />
                <SummaryCell label="Absent" value={summary.absent} />
                <SummaryCell label="Half Day" value={summary.halfDay} />
                <SummaryCell label="Leave (SL)" value={summary.leave} />
                <SummaryCell
                  label="Overtime"
                  value={summary.overtimeHours > 0 ? `${summary.overtimeHours} hrs` : "-"}
                  last
                />
              </View>
            </View>

            <View style={styles.section} wrap={false}>
              <Text style={pdfStyles.sectionTitle}>Daily Attendance</Text>
              <View style={styles.gridRow}>
                {data.columns.map((col, i) => (
                  <View key={col.label} style={{ flex: 1, flexDirection: "row" }}>
                    {i > 0 && <View style={styles.gridGap} />}
                    <DayColumn label={col.label} days={col.days} />
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={styles.section} wrap={false}>
          <Text style={pdfStyles.sectionTitle}>Total Payable</Text>
          <View style={styles.table}>
            <View style={styles.headRow}>
              <Text style={[styles.cell, styles.headCell, styles.pLabel]}>Item</Text>
              <Text style={[styles.cell, styles.headCell, styles.pDetail]}>
                Rate: {payable.rateLabel}
              </Text>
              <Text style={[styles.cell, styles.headCell, styles.pAmount]}>Amount</Text>
            </View>
            {payable.rows.map((row) => (
              <View style={styles.row} key={row.label}>
                <Text style={[styles.cell, styles.pLabel]}>{row.label}</Text>
                <Text style={[styles.cell, styles.pDetail]}>{row.detail}</Text>
                <Text style={[styles.cell, styles.pAmount]}>
                  {row.amount === 0 ? "-" : signedInr(row.amount)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text>Net Salary (this month)</Text>
              <Text>{formatInr(payable.netSalary)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={pdfStyles.sectionTitle}>Salary Ledger</Text>
          <View style={styles.table}>
            <View style={styles.headRow}>
              <Text style={[styles.cell, styles.headCell, styles.lDate]}>Date</Text>
              <Text style={[styles.cell, styles.headCell, styles.lDesc]}>Description</Text>
              <Text style={[styles.cell, styles.headCell, styles.lMode]}>Mode</Text>
              <Text style={[styles.cell, styles.headCell, styles.lGiven]}>Money Given</Text>
              <Text style={[styles.cell, styles.headCell, styles.lEarned]}>Earned</Text>
            </View>
            {ledger.rows.length === 0 ? (
              <View style={styles.row}>
                <Text style={[styles.cell, { width: "100%", textAlign: "center", color: "#888" }]}>
                  No entries for this month
                </Text>
              </View>
            ) : (
              ledger.rows.map((row, i) => (
                <View style={styles.row} key={i} wrap={false}>
                  <Text style={[styles.cell, styles.lDate]}>{row.date}</Text>
                  <Text style={[styles.cell, styles.lDesc]}>{row.description}</Text>
                  <Text style={[styles.cell, styles.lMode]}>{row.mode}</Text>
                  <Text style={[styles.cell, styles.lGiven]}>{row.given}</Text>
                  <Text style={[styles.cell, styles.lEarned]}>{row.earned}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.balanceBox} wrap={false}>
            <View style={styles.balanceLine}>
              <Text>
                {ledger.openingBalance >= 0
                  ? "Previous balance (still to pay)"
                  : "Previous advance (paid extra earlier)"}
              </Text>
              <Text>{signedInr(ledger.openingBalance)}</Text>
            </View>
            <View style={styles.balanceLine}>
              <Text>+ Net salary this month</Text>
              <Text>{formatInr(ledger.netSalary)}</Text>
            </View>
            <View style={styles.balanceLine}>
              <Text>- Money given this month</Text>
              <Text>{formatInr(ledger.givenThisMonth)}</Text>
            </View>
            <View style={styles.balanceClosing}>
              <Text>
                {owed
                  ? "Monthly Closing Balance (company to pay)"
                  : "Monthly Closing Balance (advance, adjust next month)"}
              </Text>
              <Text>{formatInr(Math.abs(ledger.closingBalance))}</Text>
            </View>
          </View>
        </View>

        <PdfFooter companyName={data.companyName} />
      </Page>
    </Document>
  );
}
