import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AttendanceDay, AttendancePDFData } from "@/types/pdf";

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: { textAlign: "center", marginBottom: 14 },
  companyName: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#4b4b4b" },
  divider: { borderBottom: "1pt solid #d0d0d0", marginTop: 8 },

  infoBlock: { paddingVertical: 10, marginBottom: 12 },
  infoRow: { flexDirection: "row", marginBottom: 5 },
  infoCol: { width: "50%", flexDirection: "row" },
  infoLabel: { color: "#666", width: 78 },
  infoValue: { fontFamily: "Helvetica-Bold" },

  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  summaryTable: {
    flexDirection: "row",
    border: "1pt solid #cfcfcf",
    marginBottom: 16,
  },
  summaryCell: {
    flex: 1,
    borderRight: "1pt solid #cfcfcf",
    paddingVertical: 7,
    alignItems: "center",
  },
  summaryCellLast: { flex: 1, paddingVertical: 7, alignItems: "center" },
  summaryLabel: {
    fontSize: 7,
    color: "#666",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },

  tablesRow: { flexDirection: "row" },
  tableCol: { flex: 1 },
  tableColGap: { width: 14 },
  tableHeaderBar: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 4,
    marginBottom: 3,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  tableColHeadRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #999",
    paddingBottom: 3,
    marginBottom: 2,
  },
  tableColHeadDate: { width: "44%", fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#555" },
  tableColHeadStatus: { width: "36%", fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#555" },
  tableColHeadOt: { width: "20%", fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#555", textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #eaeaea",
    paddingVertical: 2.5,
  },
  cellDate: { width: "44%", fontSize: 7.8 },
  cellStatus: { width: "36%", fontSize: 7.8 },
  cellOt: { width: "20%", fontSize: 7.8, textAlign: "right" },

  payrollSection: {
    marginTop: 20,
    borderTop: "1pt solid #cfcfcf",
    paddingTop: 10,
  },
  payrollRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2.5,
    fontSize: 9,
  },
  payrollLabel: { color: "#444" },
  payrollValue: { fontFamily: "Helvetica-Bold" },
  payrollTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1pt solid #333",
    marginTop: 5,
    paddingTop: 6,
    fontSize: 10.5,
  },
  payrollTotalLabel: { fontFamily: "Helvetica-Bold" },
  payrollTotalValue: { fontFamily: "Helvetica-Bold" },

  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 7.5,
    color: "#9a9a9a",
  },
});

function formatInr(amount: number): string {
  return `Rs. ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function DayTable({ title, days }: { title: string; days: AttendanceDay[] }) {
  return (
    <View style={styles.tableCol}>
      <View style={styles.tableHeaderBar}>
        <Text style={styles.tableHeaderText}>{title}</Text>
      </View>
      <View style={styles.tableColHeadRow}>
        <Text style={styles.tableColHeadDate}>Date</Text>
        <Text style={styles.tableColHeadStatus}>Status</Text>
        <Text style={styles.tableColHeadOt}>OT</Text>
      </View>
      {days.map((day, i) => (
        <View style={styles.tableRow} key={i}>
          <Text style={styles.cellDate}>{day.date}</Text>
          <Text style={styles.cellStatus}>{day.status}</Text>
          <Text style={styles.cellOt}>{day.ot}</Text>
        </View>
      ))}
    </View>
  );
}

export function AttendancePDF({ data }: { data: AttendancePDFData }) {
  return (
    <Document
      title={`${data.employeeName} Attendance ${data.reportingFrom} - ${data.reportingTo}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{data.companyName}</Text>
          <Text style={styles.subtitle}>Employee Attendance Timesheet</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Employee Name</Text>
              <Text style={styles.infoValue}>{data.employeeName}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Designation</Text>
              <Text style={styles.infoValue}>{data.designation}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Project</Text>
              <Text style={styles.infoValue}>{data.project}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Reporting Period</Text>
              <Text style={styles.infoValue}>
                {data.reportingFrom} - {data.reportingTo}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Employee Summary</Text>
        <View style={styles.summaryTable}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Total Days</Text>
            <Text style={styles.summaryValue}>{data.summary.totalDays}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Present</Text>
            <Text style={styles.summaryValue}>{data.summary.present}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Absent</Text>
            <Text style={styles.summaryValue}>{data.summary.absent}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Half Day</Text>
            <Text style={styles.summaryValue}>{data.summary.halfDay}</Text>
          </View>
          <View style={styles.summaryCellLast}>
            <Text style={styles.summaryLabel}>Overtime</Text>
            <Text style={styles.summaryValue}>
              {data.summary.overtimeHours > 0
                ? `${data.summary.overtimeHours} hrs`
                : "-"}
            </Text>
          </View>
        </View>

        <View style={styles.tablesRow}>
          <DayTable title={data.firstHalfLabel} days={data.firstHalf} />
          <View style={styles.tableColGap} />
          <DayTable title={data.secondHalfLabel} days={data.secondHalf} />
        </View>

        <View style={styles.payrollSection}>
          <Text style={styles.sectionTitle}>Total Payable</Text>
          <View style={styles.payrollRow}>
            <Text style={styles.payrollLabel}>Rate</Text>
            <Text style={styles.payrollValue}>{data.payroll.rateLabel}</Text>
          </View>
          <View style={styles.payrollRow}>
            <Text style={styles.payrollLabel}>Attendance Pay</Text>
            <Text style={styles.payrollValue}>
              {formatInr(data.payroll.attendancePay)}
            </Text>
          </View>
          <View style={styles.payrollRow}>
            <Text style={styles.payrollLabel}>Half Day Pay</Text>
            <Text style={styles.payrollValue}>
              {formatInr(data.payroll.halfDayPay)}
            </Text>
          </View>
          <View style={styles.payrollRow}>
            <Text style={styles.payrollLabel}>Overtime Pay</Text>
            <Text style={styles.payrollValue}>
              {formatInr(data.payroll.overtimePay)}
            </Text>
          </View>
          <View style={styles.payrollTotalRow}>
            <Text style={styles.payrollTotalLabel}>Net Salary</Text>
            <Text style={styles.payrollTotalValue}>
              {formatInr(data.payroll.netSalary)}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>Generated by Pillar</Text>
      </Page>
    </Document>
  );
}
