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
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  meetingKey: string;
  mode: string;
  startUtc: string;
  endUtc: string;
  reason?: string | null;
  adminLink?: string | null;
};

export default function RescheduleRequestEmail({
  customerName,
  customerEmail,
  customerPhone,
  meetingKey,
  mode,
  startUtc,
  endUtc,
  reason,
  adminLink,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Reschedule request</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Reschedule request</Heading>
          <Text style={styles.text}>
            A customer asked to reschedule their booking.
          </Text>

          <Section style={styles.card}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{customerName ?? "Customer"}</Text>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{customerEmail ?? "n/a"}</Text>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{customerPhone ?? "n/a"}</Text>
          </Section>

          <Section style={styles.card}>
            <Text style={styles.label}>Meeting</Text>
            <Text style={styles.value}>{meetingKey}</Text>
            <Text style={styles.label}>Mode</Text>
            <Text style={styles.value}>{mode}</Text>
            <Text style={styles.label}>Start (UTC)</Text>
            <Text style={styles.value}>{startUtc}</Text>
            <Text style={styles.label}>End (UTC)</Text>
            <Text style={styles.value}>{endUtc}</Text>
            {reason && (
              <>
                <Text style={styles.label}>Request note</Text>
                <Text style={styles.value}>{reason}</Text>
              </>
            )}
            {adminLink && (
              <>
                <Text style={styles.label}>Admin link</Text>
                <Text style={styles.value}>{adminLink}</Text>
              </>
            )}
          </Section>

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
