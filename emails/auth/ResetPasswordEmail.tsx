import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  resetUrl: string;
  expiresInHours?: number;
};

export default function ResetPasswordEmail({
  resetUrl,
  expiresInHours = 1,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Lux AI account password</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Reset your password</Heading>
          <Text style={styles.text}>
            We received a request to reset your password. Use the button below
            to set a new one.
          </Text>

          <Section style={styles.card}>
            <Button href={resetUrl} style={styles.button}>
              Reset password
            </Button>
            <Text style={styles.muted}>
              This link expires in {expiresInHours} hour
              {expiresInHours === 1 ? "" : "s"}.
            </Text>
            <Text style={styles.small}>
              Or copy and paste this link:
              <br />
              <Link href={resetUrl} style={styles.link}>
                {resetUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.muted}>
            If you did not request a password reset, you can ignore this email.
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
  button: {
    display: "inline-block",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    textDecoration: "none",
  },
  link: {
    color: "#1d4ed8",
    wordBreak: "break-all" as const,
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "24px 0",
  },
  muted: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "10px",
  },
  small: {
    fontSize: "12px",
    color: "#334155",
    marginTop: "12px",
  },
};
