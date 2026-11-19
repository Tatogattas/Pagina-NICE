import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import {auth, db, handleFirestoreError, OperationType} from '../firebase';

export const LINKED_ADMIN_EMAIL = 'taroret134@gmail.com';
export const ORIGIN_WHATSAPP = '+503 60431208';
export const ORIGIN_WHATSAPP_DIGITS = '50360431208';

export interface WhatsappAdvisorSlot {
  slot: 1 | 2 | 3;
  display: '+503 61631237' | '+503 79007071' | '+503 75437670';
  waDigits: string;
}

export const WHATSAPP_ADVISORS: readonly WhatsappAdvisorSlot[] = [
  {slot: 1, display: '+503 61631237', waDigits: '50361631237'},
  {slot: 2, display: '+503 79007071', waDigits: '50379007071'},
  {slot: 3, display: '+503 75437670', waDigits: '50375437670'},
] as const;

export type EmailDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'activation_required'
  | 'fallback';

export type WebhookDeliveryStatus = 'not_configured' | 'sent' | 'failed';

export interface ContactSubmissionInput {
  name: string;
  email: string;
  phone: string;
  message: string;
  brandName: string;
  whatsappWebhookUrl?: string;
}

export interface ContactDispatchResult {
  inquiryId: string;
  senderWhatsapp: string;
  advisor: WhatsappAdvisorSlot;
  turnCount: number;
  whatsappUrl: string;
  originForwardUrl: string;
  mailtoUrl: string;
  emailStatus: EmailDeliveryStatus;
  webhookStatus: WebhookDeliveryStatus;
  savedToCloud: boolean;
}

export interface StoredContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  senderWhatsapp: string;
  assignedWhatsapp: string;
  turnSlot: number;
  recipientEmail: string;
  emailStatus: EmailDeliveryStatus;
  dispatched: boolean;
  createdAtMs: number;
}

const LOCAL_TURN_FALLBACK_KEY = 'nice_whatsapp_turn_fallback_v1';
const ROUTING_COLLECTION = 'contactRouting';
const ROUTING_DOC_ID = 'roundRobin';
const INQUIRIES_COLLECTION = 'contactInquiries';

function getLocalFallbackTurn(): number {
  try {
    const raw = localStorage.getItem(LOCAL_TURN_FALLBACK_KEY);
    const prev = raw ? Number.parseInt(raw, 10) : 0;
    const next = Number.isFinite(prev) && prev >= 0 ? prev + 1 : 1;
    localStorage.setItem(LOCAL_TURN_FALLBACK_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('timeout'));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function claimNextRoundRobinTurn(): Promise<number> {
  const routingRef = doc(db, ROUTING_COLLECTION, ROUTING_DOC_ID);
  try {
    const turnCount = await withTimeout(
      runTransaction(db, async (tx) => {
        const snap = await tx.get(routingRef);
        if (!snap.exists()) {
          tx.set(routingRef, {
            turnCount: 1,
            updatedAt: serverTimestamp(),
          });
          return 1;
        }
        const data = snap.data() as {turnCount?: unknown};
        const current =
          typeof data.turnCount === 'number' &&
          Number.isInteger(data.turnCount) &&
          data.turnCount >= 1
            ? data.turnCount
            : 0;
        const next = current + 1;
        tx.update(routingRef, {
          turnCount: next,
          updatedAt: serverTimestamp(),
        });
        return next;
      }),
      3500
    );
    return turnCount;
  } catch {
    return getLocalFallbackTurn();
  }
}

export function getAdvisorBySlotOrDisplay(
  turnSlot: number,
  assignedWhatsapp?: string
): WhatsappAdvisorSlot {
  const byDisplay = WHATSAPP_ADVISORS.find(
    (a) => a.display === assignedWhatsapp
  );
  if (byDisplay) return byDisplay;
  return (
    WHATSAPP_ADVISORS.find((a) => a.slot === turnSlot) ?? WHATSAPP_ADVISORS[0]
  );
}

function buildWhatsappUrl(
  advisor: WhatsappAdvisorSlot,
  input: ContactSubmissionInput
): string {
  const lines = [
    `Hola, me comunico con ${input.brandName} (Turno ${advisor.slot} · ${advisor.display}).`,
    '',
    `Nombre: ${input.name}`,
    `Correo: ${input.email}`,
    `Teléfono: ${input.phone}`,
    `Mensaje: ${input.message}`,
  ];
  return `https://wa.me/${advisor.waDigits}?text=${encodeURIComponent(
    lines.join('\n')
  )}`;
}

export function buildOriginForwardWhatsappUrl(
  inquiry: {
    name: string;
    email: string;
    phone: string;
    message: string;
    turnSlot: number;
    assignedWhatsapp: string;
  },
  brandName: string
): string {
  const advisor = getAdvisorBySlotOrDisplay(
    inquiry.turnSlot,
    inquiry.assignedWhatsapp
  );
  const lines = [
    `[${brandName}] Derivación de consulta — Turno ${advisor.slot}`,
    `Enviado desde: ${ORIGIN_WHATSAPP}`,
    `Para asesor: ${advisor.display}`,
    '',
    `Cliente: ${inquiry.name}`,
    `Teléfono: ${inquiry.phone}`,
    `Correo: ${inquiry.email}`,
    `Consulta: ${inquiry.message}`,
  ];
  return `https://wa.me/${advisor.waDigits}?text=${encodeURIComponent(
    lines.join('\n')
  )}`;
}

function buildMailtoUrl(
  advisor: WhatsappAdvisorSlot,
  input: ContactSubmissionInput
): string {
  const subject = `[${input.brandName}] Nueva consulta de ${input.name}`;
  const body = [
    `Nueva consulta desde ${input.brandName}`,
    '',
    `Nombre: ${input.name}`,
    `Correo: ${input.email}`,
    `Teléfono: ${input.phone}`,
    `WhatsApp emisor: ${ORIGIN_WHATSAPP}`,
    `Turno WhatsApp asignado: Turno ${advisor.slot} (${advisor.display})`,
    '',
    'Mensaje:',
    input.message,
  ].join('\n');
  return `mailto:${LINKED_ADMIN_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

async function sendEmailViaFormSubmit(
  advisor: WhatsappAdvisorSlot,
  input: ContactSubmissionInput
): Promise<EmailDeliveryStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(
      `https://formsubmit.co/ajax/${LINKED_ADMIN_EMAIL}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `[${input.brandName}] Nueva consulta de ${input.name} (Turno ${advisor.slot})`,
          _template: 'table',
          _captcha: 'false',
          _replyto: input.email,
          Nombre: input.name,
          Correo: input.email,
          Telefono: input.phone,
          Mensaje: input.message,
          WhatsApp_Emisor: ORIGIN_WHATSAPP,
          WhatsApp_Turno_Asignado: `Turno ${advisor.slot}: ${advisor.display}`,
        }),
      }
    );

    const payload = (await response.json().catch(() => null)) as {
      success?: string | boolean;
      message?: string;
    } | null;

    if (
      response.ok &&
      (payload?.success === true || payload?.success === 'true')
    ) {
      return 'sent';
    }
    if (
      typeof payload?.message === 'string' &&
      payload.message.toLowerCase().includes('activat')
    ) {
      return 'activation_required';
    }
    return 'fallback';
  } catch {
    return 'fallback';
  } finally {
    clearTimeout(timer);
  }
}

async function triggerWhatsappWebhook(
  webhookUrl: string | undefined,
  payload: {
    inquiryId: string;
    brandName: string;
    senderWhatsapp: string;
    senderWhatsappDigits: string;
    assignedWhatsapp: string;
    assignedWhatsappDigits: string;
    turnSlot: number;
    turnCount: number;
    recipientEmail: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    whatsappForwardUrl: string;
  }
): Promise<WebhookDeliveryStatus> {
  const cleanUrl = typeof webhookUrl === 'string' ? webhookUrl.trim() : '';
  if (!/^https:\/\/.+/.test(cleanUrl)) {
    return 'not_configured';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'nice.contact_inquiry.created',
        ...payload,
      }),
    });
    return res.ok ? 'sent' : 'failed';
  } catch {
    return 'failed';
  } finally {
    clearTimeout(timer);
  }
}

export async function submitContactInquiry(
  rawInput: ContactSubmissionInput
): Promise<ContactDispatchResult> {
  const input: ContactSubmissionInput = {
    name: rawInput.name.trim().slice(0, 120),
    email: rawInput.email.trim().slice(0, 160),
    phone: rawInput.phone.trim().slice(0, 40),
    message: rawInput.message.trim().slice(0, 2000),
    brandName: rawInput.brandName.trim() || 'Academia/Clínica NICE',
    whatsappWebhookUrl: rawInput.whatsappWebhookUrl?.trim() || '',
  };

  const turnCount = await claimNextRoundRobinTurn();
  const advisor = WHATSAPP_ADVISORS[(turnCount - 1) % WHATSAPP_ADVISORS.length];
  const inquiryId = `inq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const whatsappUrl = buildWhatsappUrl(advisor, input);
  const originForwardUrl = buildOriginForwardWhatsappUrl(
    {
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
      turnSlot: advisor.slot,
      assignedWhatsapp: advisor.display,
    },
    input.brandName
  );
  const mailtoUrl = buildMailtoUrl(advisor, input);

  const [emailStatus, webhookStatus] = await Promise.all([
    sendEmailViaFormSubmit(advisor, input),
    triggerWhatsappWebhook(input.whatsappWebhookUrl, {
      inquiryId,
      brandName: input.brandName,
      senderWhatsapp: ORIGIN_WHATSAPP,
      senderWhatsappDigits: ORIGIN_WHATSAPP_DIGITS,
      assignedWhatsapp: advisor.display,
      assignedWhatsappDigits: advisor.waDigits,
      turnSlot: advisor.slot,
      turnCount,
      recipientEmail: LINKED_ADMIN_EMAIL,
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
      whatsappForwardUrl: originForwardUrl,
    }),
  ]);

  let savedToCloud = false;
  try {
    await withTimeout(
      setDoc(doc(db, INQUIRIES_COLLECTION, inquiryId), {
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message,
        senderWhatsapp: ORIGIN_WHATSAPP,
        assignedWhatsapp: advisor.display,
        turnSlot: advisor.slot,
        recipientEmail: LINKED_ADMIN_EMAIL,
        emailStatus,
        dispatched: false,
        createdAt: serverTimestamp(),
      }),
      3500
    );
    savedToCloud = true;
  } catch {
    savedToCloud = false;
  }

  return {
    inquiryId,
    senderWhatsapp: ORIGIN_WHATSAPP,
    advisor,
    turnCount,
    whatsappUrl,
    originForwardUrl,
    mailtoUrl,
    emailStatus,
    webhookStatus,
    savedToCloud,
  };
}

export function subscribeToContactInquiries(
  onData: (items: StoredContactInquiry[]) => void
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }

  const q = query(
    collection(db, INQUIRIES_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: StoredContactInquiry[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const ts = data.createdAt as Timestamp | undefined;
        return {
          id: docSnap.id,
          name: typeof data.name === 'string' ? data.name : '',
          email: typeof data.email === 'string' ? data.email : '',
          phone: typeof data.phone === 'string' ? data.phone : '',
          message: typeof data.message === 'string' ? data.message : '',
          senderWhatsapp:
            typeof data.senderWhatsapp === 'string'
              ? data.senderWhatsapp
              : ORIGIN_WHATSAPP,
          assignedWhatsapp:
            typeof data.assignedWhatsapp === 'string'
              ? data.assignedWhatsapp
              : '',
          turnSlot: typeof data.turnSlot === 'number' ? data.turnSlot : 1,
          recipientEmail:
            typeof data.recipientEmail === 'string'
              ? data.recipientEmail
              : LINKED_ADMIN_EMAIL,
          emailStatus:
            (data.emailStatus as EmailDeliveryStatus) || 'fallback',
          dispatched: data.dispatched === true,
          createdAtMs: ts?.toMillis ? ts.toMillis() : Date.now(),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, INQUIRIES_COLLECTION);
      } catch {
        // Ignore non-admin permission error if auth is not taroret134@gmail.com
      }
    }
  );
}

export async function markInquiryDispatched(
  inquiryId: string,
  dispatched: boolean
): Promise<void> {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, INQUIRIES_COLLECTION, inquiryId), {
      dispatched,
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `${INQUIRIES_COLLECTION}/${inquiryId}`
    );
  }
}

export async function deleteContactInquiry(inquiryId: string): Promise<void> {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, INQUIRIES_COLLECTION, inquiryId));
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.DELETE,
      `${INQUIRIES_COLLECTION}/${inquiryId}`
    );
  }
}
