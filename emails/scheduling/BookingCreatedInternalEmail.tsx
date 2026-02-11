import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  userCompany?: string | null;
  userCompanyRole?: string | null;
  userNotes?: string | null;
  meetingKey: string;
  mode: string;
  status: string;
  startUtc: string;
  endUtc: string;
  meetingLink?: string | null;
  approvalLink?: string | null;
  calendarLink?: string | null;
};

export default function BookingCreatedInternalEmail({
  name,
  email,
  phone,
  userCompany,
  userCompanyRole,
  userNotes,
  meetingKey,
  mode,
  status,
  startUtc,
  endUtc,
  meetingLink,
  approvalLink,
  calendarLink,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New booking received (staff)</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>New booking received</Heading>
          <Text style={styles.text}>
            A customer just submitted a booking. Review details below.
          </Text>

          <Section style={styles.card}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{name ?? "Customer"}</Text>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{email ?? "n/a"}</Text>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{phone ?? "n/a"}</Text>
            {(userCompany || userCompanyRole) && (
              <>
                <Text style={styles.label}>Company</Text>
                <Text style={styles.value}>
                  {userCompany ?? "n/a"}
                  {userCompanyRole ? ` · ${userCompanyRole}` : ""}
                </Text>
              </>
            )}
            {userNotes && (
              <>
                <Text style={styles.label}>Notes</Text>
                <Text style={styles.value}>{userNotes}</Text>
              </>
            )}
          </Section>

          <Section style={styles.card}>
            <Text style={styles.label}>Meeting</Text>
            <Text style={styles.value}>{meetingKey}</Text>
            <Text style={styles.label}>Mode</Text>
            <Text style={styles.value}>{mode}</Text>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{status}</Text>
            <Text style={styles.label}>Start (UTC)</Text>
            <Text style={styles.value}>{startUtc}</Text>
            <Text style={styles.label}>End (UTC)</Text>
            <Text style={styles.value}>{endUtc}</Text>
            {meetingLink && (
              <>
                <Text style={styles.label}>Meeting link</Text>
                <Text style={styles.value}>{meetingLink}</Text>
              </>
            )}
            {calendarLink && (
              <>
                <Text style={styles.label}>Add to calendar</Text>
                <Text style={styles.value}>{calendarLink}</Text>
              </>
            )}
          </Section>

          {approvalLink && (
            <Section style={styles.card}>
              <Text style={styles.label}>Approval required</Text>
              <Text style={styles.value}>{approvalLink}</Text>
            </Section>
          )}

          <Hr style={styles.hr} />

          <Text style={styles.muted}>
            You are receiving this because you are listed as a scheduling
            recipient.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f6f7fb",
    fontFamily: "Helvetica, Arial, sans-serif",
    color: "#0f172a",
  },
  container: {
    backgroundColor: "#ffffff",
    padding: "32px",
    margin: "40px auto",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  h1: {
    fontSize: "22px",
    marginBottom: "12px",
  },
  text: {
    fontSize: "14px",
    marginBottom: "16px",
  },
  card: {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    marginBottom: "12px",
  },
  label: {
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "#64748b",
    marginTop: "10px",
    marginBottom: "4px",
  },
  value: {
    fontSize: "14px",
    marginTop: "0",
    marginBottom: "0",
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "24px 0",
  },
  muted: {
    fontSize: "12px",
    color: "#64748b",
  },
};
