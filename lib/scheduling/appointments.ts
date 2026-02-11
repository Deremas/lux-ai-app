// lib/scheduling/appointments.ts
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/scheduling/audit";
import { sendStatusEmails } from "@/lib/scheduling/notify";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "canceled"
  | "completed";

const TERMINAL: AppointmentStatus[] = ["declined", "canceled", "completed"];

export function canTransition(from: AppointmentStatus, to: AppointmentStatus) {
  if (from === to) return true;
  if (TERMINAL.includes(from)) return false;

  // MVP transitions:
  // pending -> confirmed/declined/canceled
  // confirmed -> canceled/completed
  if (from === "pending")
    return ["confirmed", "declined", "canceled"].includes(to);
  if (from === "confirmed") return ["canceled", "completed"].includes(to);
  return false;
}

export async function updateAppointmentStatus(params: {
  orgId: string;
  appointmentId: string;
  actorUserId: string | null;
  nextStatus: AppointmentStatus;
  allowedCurrent?: AppointmentStatus[]; // optional extra safety
  reason?: string;
  allowRestore?: boolean;
}) {
  const current = await prisma.appointment.findFirst({
    where: {
      orgId: params.orgId,
      id: params.appointmentId,
    },
    select: {
      id: true,
      orgId: true,
      userId: true,
      staffUserId: true,
      meetingTypeId: true,
      mode: true,
      status: true,
      startAtUtc: true,
      endAtUtc: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!current) return { ok: false as const, error: "Appointment not found" };

  const from = current.status as AppointmentStatus;
  const to = params.nextStatus;

  if (params.allowedCurrent && !params.allowedCurrent.includes(from)) {
    return { ok: false as const, error: `Invalid state (current=${from})` };
  }

  const canRestore = params.allowRestore && from === "canceled" && to === "confirmed";
  if (!canTransition(from, to) && !canRestore) {
    return {
      ok: false as const,
      error: `Transition not allowed (${from} -> ${to})`,
    };
  }

  const after = await prisma.appointment.update({
    where: { id: params.appointmentId },
    data: {
      status: to,
      updatedAt: new Date(),
    },
  });

  await writeAudit({
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    entityType: "appointment",
    entityId: params.appointmentId,
    action: `status:${from}->${to}`,
    before: { ...current, reason: params.reason ?? null },
    after: { ...after, reason: params.reason ?? null },
  });

  let emailError: string | null = null;
  // MVP notifications log only (sendStatusEmails logs a notificationLog row)
  if (to === "confirmed" || to === "declined" || to === "canceled") {
    try {
      await sendStatusEmails({
        appointmentId: params.appointmentId,
        status: to,
        reason: params.reason,
      });
    } catch (err: unknown) {
      emailError =
        err instanceof Error ? err.message : typeof err === "string" ? err : null;
      console.error("sendStatusEmails failed", emailError);
    }
  }

  return { ok: true as const, appointment: after, emailError };
}
