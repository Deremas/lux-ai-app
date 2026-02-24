import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";

type Props = {
  name?: string | null;
  verifyUrl: string;
  expiresInHours?: number;
};

export default function VerifyEmail({
  name,
  verifyUrl,
  expiresInHours = 1,
}: Props) {
  const firstName = name?.trim() || "there";
  const year = new Date().getFullYear();
  const expiresInMinutes = Math.round(expiresInHours * 60);
  return (
    <Html>
      <Head />
      <Preview>Confirm your email to finish creating your Lux AI account.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.preheader}>
            Confirm your email to finish creating your Lux AI account.
          </Text>
          <Section style={styles.brandHeader}>
            <Row>
              <Column style={styles.brandBadgeCol}>
                <div style={styles.brandBadge}>LUX</div>
              </Column>
              <Column>
                <Text style={styles.brandName}>
                  Lux AI Consultancy & Automation
                </Text>
              </Column>
            </Row>
          </Section>

          <Heading style={styles.h1}>Verify your email</Heading>
          <Text style={styles.text}>
            Hi {firstName},
          </Text>
          <Text style={styles.text}>
            Please confirm your email address to finish creating your Lux AI account.
          </Text>

          <Section style={styles.card}>
            <table role="presentation" style={styles.buttonTable}>
              <tbody>
                <tr>
                  <td align="center" style={styles.buttonCell}>
                    <a href={verifyUrl} style={styles.button}>
                      Verify email
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
            <Text style={styles.muted}>
              This link expires in {expiresInMinutes} minutes.
            </Text>
            <Text style={styles.small}>
              Or copy and paste this link into your browser:
            </Text>
            <Link href={verifyUrl} style={styles.link}>
              {verifyUrl}
            </Link>
          </Section>

          <Text style={styles.muted}>
            If you did not request this account, you can safely ignore this email.
          </Text>

          <Hr style={styles.hr} />

          <Text style={styles.footerText}>
            Lux AI Consultancy & Automation
            <br />
            <Link href="https://luxaiautomation.com" style={styles.footerLink}>
              luxaiautomation.com
            </Link>
            <br />
            <Link href="mailto:molla@luxaiautomation.com" style={styles.footerLink}>
              molla@luxaiautomation.com
            </Link>
          </Text>
          <Text style={styles.footerMuted}>
            © {year} Lux AI Consultancy & Automation. All rights reserved.
          </Text>
          <Text style={styles.footerMuted}>
            This is an automated email message.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f6f7fb",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#0f172a",
  },
  container: {
    backgroundColor: "#ffffff",
    padding: "32px",
    margin: "40px auto",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    maxWidth: "600px",
  },
  preheader: {
    display: "none",
    fontSize: "1px",
    lineHeight: "1px",
    maxHeight: "0",
    maxWidth: "0",
    opacity: "0",
    overflow: "hidden",
    msoHide: "all" as const,
  },
  brandHeader: {
    marginTop: "24px",
    marginBottom: "20px",
  },
  brandBadgeCol: {
    width: "48px",
  },
  brandBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    border: "2px solid #2563eb",
    backgroundColor: "#dbeafe",
    color: "#2563eb",
    fontWeight: 700,
    fontSize: "12px",
    lineHeight: "40px",
    textAlign: "center" as const,
    letterSpacing: "1px",
  },
  brandName: {
    margin: "0",
    fontSize: "16px",
    fontWeight: 700,
    color: "#2563eb",
  },
  h1: {
    fontSize: "22px",
    marginBottom: "12px",
  },
  text: {
    fontSize: "14px",
    marginBottom: "12px",
  },
  card: {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  buttonTable: {
    width: "100%",
    marginBottom: "10px",
  },
  buttonCell: {
    textAlign: "center" as const,
  },
  button: {
    display: "inline-block",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 700,
    textDecoration: "none",
  },
  link: {
    color: "#1d4ed8",
    wordBreak: "break-all" as const,
    fontSize: "12px",
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "24px 0 16px",
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
    marginBottom: "4px",
  },
  footerText: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "8px",
  },
  footerLink: {
    color: "#6b7280",
    textDecoration: "none",
  },
  footerMuted: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "6px",
  },
};
