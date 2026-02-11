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
  name: string;
  email: string;
  phone: string;
  country: string;
  company: string;
  taskDescription: string;
};

export default function ContactRequestEmail({
  name,
  email,
  phone,
  country,
  company,
  taskDescription,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New contact request</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>New contact request</Heading>
          <Text style={styles.text}>
            A new contact form submission is ready to review.
          </Text>

          <Section style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{name}</Text>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{email}</Text>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{phone}</Text>
            <Text style={styles.label}>Country</Text>
            <Text style={styles.value}>{country}</Text>
            <Text style={styles.label}>Company</Text>
            <Text style={styles.value}>{company}</Text>
            <Text style={styles.label}>Task</Text>
            <Text style={styles.value}>{taskDescription}</Text>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.muted}>
            Reply directly to reach the requester.
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
    whiteSpace: "pre-wrap" as const,
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
