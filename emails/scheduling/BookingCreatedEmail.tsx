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
  meetingKey: string;
  mode: string;
  status: string;
  startUtc: string;
  endUtc: string;
  meetingLink?: string | null;
  phone?: string | null;
  calendarLink?: string | null;
};

export default function BookingCreatedEmail({
  name,
  meetingKey,
  mode,
  status,
  startUtc,
  endUtc,
  meetingLink,
  phone,
  calendarLink,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New booking received</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>New booking received</Heading>
          <Text style={styles.text}>
            {name ? `Hi ${name},` : "Hello,"} we have received your booking.
          </Text>

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
            {phone && mode === "phone" && (
              <>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{phone}</Text>
              </>
            )}
            {calendarLink && (
              <>
                <Text style={styles.label}>Add to calendar</Text>
                <Text style={styles.value}>{calendarLink}</Text>
              </>
            )}
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.muted}>
            If you have questions, reply to this email.
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
