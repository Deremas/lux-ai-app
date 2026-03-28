"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { DateTime } from "luxon";
import { toast } from "sonner";

import AvailabilityCalendar from "@/components/scheduling/AvailabilityCalendar";
import { useLanguage } from "@/components/LanguageProvider";
import Stepper from "@/components/scheduling/Stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SearchablePhoneInput from "@/components/PhoneInputField";
import type { AppLanguage } from "@/lib/i18n";

const localeByLanguage: Record<AppLanguage, string> = {
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
  lb: "lb-LU",
};

const schedulingUnavailableGuidance = {
  en: {
    includeTitle: "What to send instead",
    includeItems: [
      "The workflow bottleneck or business problem you want reviewed first.",
      "The tools or systems involved, such as CRM, email, forms, dashboards, or internal operations tools.",
      "The outcome you want, such as faster response, fewer handoffs, clearer visibility, or cleaner automation logic.",
    ],
    nextStepsTitle: "What happens next",
    nextSteps: [
      "We review the workflow context and identify the most practical first automation step.",
      "We recommend whether the next move should be direct implementation, a broader audit, or written scoping first.",
      "We follow up with practical next steps and move you into the right booking or contact path once available.",
    ],
    note: "You can still start the free audit process without choosing a calendar slot.",
  },
  fr: {
    includeTitle: "Que nous envoyer a la place",
    includeItems: [
      "Le blocage workflow ou le probleme metier a examiner en premier.",
      "Les outils ou systemes impliques, comme CRM, email, formulaires, dashboards ou outils internes.",
      "Le resultat attendu, par exemple une reponse plus rapide, moins de handoffs, plus de visibilite ou une logique d'automatisation plus propre.",
    ],
    nextStepsTitle: "Ce qui se passe ensuite",
    nextSteps: [
      "Nous examinons le contexte du workflow et identifions la premiere etape d'automatisation la plus utile.",
      "Nous recommandons si la suite doit etre une implementation directe, un audit plus large ou un cadrage ecrit d'abord.",
      "Nous revenons avec des prochaines etapes concretes et vous orientons vers le bon chemin de reservation ou de contact des qu'il est disponible.",
    ],
    note: "Vous pouvez toujours lancer le processus d'audit gratuit sans choisir de creneau calendrier.",
  },
  de: {
    includeTitle: "Was Sie stattdessen senden sollten",
    includeItems: [
      "Den Workflow-Engpass oder das Geschaeftsproblem, das zuerst geprueft werden soll.",
      "Die beteiligten Tools oder Systeme, etwa CRM, E-Mail, Formulare, Dashboards oder interne Operations-Tools.",
      "Das gewuenschte Ergebnis, zum Beispiel schnellere Reaktion, weniger Handoffs, bessere Sichtbarkeit oder sauberere Automatisierungslogik.",
    ],
    nextStepsTitle: "Wie es danach weitergeht",
    nextSteps: [
      "Wir pruefen den Workflow-Kontext und identifizieren den praktischsten ersten Automatisierungsschritt.",
      "Wir empfehlen, ob der naechste Schritt direkte Umsetzung, ein breiteres Audit oder zuerst ein schriftliches Scoping sein sollte.",
      "Wir melden uns mit konkreten naechsten Schritten und fuehren Sie in den passenden Buchungs- oder Kontaktweg, sobald dieser verfuegbar ist.",
    ],
    note: "Sie koennen den kostenlosen Audit-Prozess auch ohne Kalenderslot starten.",
  },
  lb: {
    includeTitle: "Wat Dir amplaz schécke kënnt",
    includeItems: [
      "Den Workflow-Engpass oder de Business-Problem, deen als éischt gekuckt soll ginn.",
      "D'Tools oder d'Systemer, déi involvéiert sinn, wéi CRM, E-Mail, Formulairen, Dashboards oder intern Operations-Tools.",
      "Dat Resultat, dat Dir wëllt, zum Beispill méi séier Äntwerten, manner Handoffs, besser Visibilitéit oder méi propper Automatiséierungslogik.",
    ],
    nextStepsTitle: "Wat duerno geschitt",
    nextSteps: [
      "Mir préiwen de Workflow-Kontext an identifizéieren dee prakteschsten éischten Automatiséierungsschrëtt.",
      "Mir recommandéieren, ob den nächste Schrëtt direkt Ëmsetzung, e méi breeden Audit oder fir d'éischt schrëftleche Scoping soll sinn.",
      "Mir kommen op Iech zeréck mat konkrete nächste Schrëtt a féieren Iech an de richtege Booking- oder Kontaktwee, soubal en disponibel ass.",
    ],
    note: "Dir kënnt de gratis Audit-Prozess och ouni Kalenner-Slot ufänken.",
  },
} as const;

const schedulingEntryCopy = {
  en: {
    heroTitle: "Choose the right booking path",
    heroBody:
      "Start with the free workflow audit or choose a direct live session if you already know the conversation you need.",
    heroSupport:
      "Choose now, sign in securely, then continue directly to booking.",
    recommendedBadge: "Recommended",
    freeAuditEyebrow: "Recommended starting point",
    freeAuditTitle: "Start with the free workflow audit",
    freeAuditBody:
      "Best for first-time conversations when you want the clearest review of your workflow, systems, and next automation opportunities.",
    freeAuditCardBullets: [
      "First review of your workflow or challenge",
      "Guidance on the best next step",
      "No obligation",
    ],
    freeAuditCta: "Start with free audit",
    freeAuditDetailsTitle: "What happens in the free audit",
    freeAuditDetailsBody:
      "The free audit gives you a structured first review before any deeper session is recommended.",
    freeAuditBullets: [
      "Quick review of your workflow or current challenge",
      "Discussion of existing tools and blockers",
      "Guidance on where automation or AI would help first",
      "Recommendation for the right next service or session",
    ],
    freeAuditNotes: [
      "No obligation",
      "Best for new enquiries",
      "Ideal if you are not sure which session fits yet",
    ],
    optionsEyebrow: "Direct sessions",
    optionsTitle: "Book a direct live session",
    optionsBody:
      "If you already know the type of conversation you need, choose one of the active live booking options below and continue with sign-in.",
    directSessionBullets: [
      "Choose a live session",
      "Sign in securely",
      "Continue directly to booking",
    ],
    optionsCta: "Browse direct booking options",
    directSectionLead:
      "Or choose a direct session if you already know what you need",
    howItWorksTitle: "How booking works",
    howItWorksBody:
      "Your selected audit or session stays saved so you continue directly into the correct booking flow after sign-in.",
    howItWorksSteps: [
      {
        title: "Choose your path",
        body: "Start with the free audit or select a direct session.",
      },
      {
        title: "Sign in securely",
        body: "Your selected booking path stays attached to your account.",
      },
      {
        title: "Confirm date and time",
        body: "Continue directly into the correct availability step.",
      },
    ],
    optionsSectionTitle: "Direct live booking options",
    optionsSectionBody:
      "Choose a session below if you already know the conversation you want. After selection, sign in to continue directly into booking with that session already selected.",
    previewTitle: "Choose a direct session",
    previewBody:
      "These live options come directly from the active meeting types in your scheduling system.",
    previewAction: "Select and continue",
    selectedLabel: "Selected session",
    requestedMissingTitle: "That session is not live right now",
    requestedMissingBody:
      "The requested meeting type is not currently published. You can still start with the free audit or choose another live session below.",
    bestForLabel: "Best for",
    outcomeLabel: "You will leave with",
    durationLabel: "Duration",
    formatLabel: "Format",
    priceLabel: "Price",
    freePriceLabel: "Free",
    noDirectOptions:
      "No direct live sessions are active yet. You can still start with the free audit.",
    showMoreOptions: "Show more sessions",
    showFewerOptions: "Show fewer sessions",
    continueTitle: "Continue to booking after sign-in",
    continueBody:
      "Your selected path is saved. Sign in now to view the correct availability and complete your booking without starting over.",
    continueBullets: [
      "Your selected session or audit stays saved",
      "You choose the date and time after sign-in",
      "Confirmations and updates stay linked to your account",
    ],
    contactNote: "Not ready to book yet?",
    contactLink: "Use the contact form and we will guide you to the right next step.",
  },
  fr: {
    heroTitle: "Choisissez le bon chemin de reservation",
    heroBody:
      "Commencez par l'audit workflow gratuit ou choisissez une session directe si vous savez deja quelle conversation il vous faut.",
    heroSupport:
      "Choisissez maintenant, connectez-vous en toute securite, puis continuez directement vers la reservation.",
    recommendedBadge: "Recommande",
    freeAuditEyebrow: "Point de depart recommande",
    freeAuditTitle: "Commencez par l'audit workflow gratuit",
    freeAuditBody:
      "Ideal pour une premiere conversation quand vous voulez une revue claire du workflow, des systemes et des prochaines opportunites d'automatisation.",
    freeAuditCardBullets: [
      "Premiere revue du workflow ou du probleme",
      "Orientation sur la bonne prochaine etape",
      "Sans obligation",
    ],
    freeAuditCta: "Commencer par l'audit gratuit",
    freeAuditDetailsTitle: "Ce qui se passe dans l'audit gratuit",
    freeAuditDetailsBody:
      "L'audit gratuit donne une premiere revue structuree avant toute session plus approfondie.",
    freeAuditBullets: [
      "Revue rapide du workflow ou du probleme actuel",
      "Discussion des outils existants et des blocages",
      "Orientation sur l'endroit ou l'automatisation ou l'IA aiderait d'abord",
      "Recommandation sur le bon prochain service ou rendez-vous",
    ],
    freeAuditNotes: [
      "Sans obligation",
      "Ideal pour les nouvelles demandes",
      "Utile si vous ne savez pas encore quelle session convient",
    ],
    optionsEyebrow: "Sessions directes",
    optionsTitle: "Reserver une session directe",
    optionsBody:
      "Si vous connaissez deja le type de conversation dont vous avez besoin, choisissez une session active ci-dessous puis continuez avec la connexion.",
    directSessionBullets: [
      "Choisissez une session active",
      "Connectez-vous",
      "Continuez directement vers la reservation",
    ],
    optionsCta: "Voir les sessions directes",
    directSectionLead:
      "Ou choisissez une session directe si vous savez deja ce dont vous avez besoin",
    howItWorksTitle: "Comment la reservation fonctionne",
    howItWorksBody:
      "Votre audit ou session selectionne reste sauvegarde afin que vous repreniez directement dans le bon flux apres connexion.",
    howItWorksSteps: [
      {
        title: "Choisissez votre chemin",
        body: "Commencez par l'audit gratuit ou selectionnez une session directe.",
      },
      {
        title: "Connectez-vous",
        body: "Le parcours choisi reste lie a votre compte.",
      },
      {
        title: "Confirmez date et heure",
        body: "Vous continuez directement vers la bonne disponibilite.",
      },
    ],
    optionsSectionTitle: "Options de reservation directes",
    optionsSectionBody:
      "Choisissez une session ci-dessous si vous savez deja la conversation voulue. Apres selection, connectez-vous pour continuer directement dans la reservation avec cette session deja choisie.",
    previewTitle: "Choisissez une session directe",
    previewBody:
      "Ces options en ligne viennent directement des types de session actifs dans votre systeme de planification.",
    previewAction: "Selectionner et continuer",
    selectedLabel: "Session selectionnee",
    requestedMissingTitle: "Cette session n'est pas active pour le moment",
    requestedMissingBody:
      "Le type de session demande n'est pas publie actuellement. Vous pouvez quand meme commencer par l'audit gratuit ou choisir une autre session active ci-dessous.",
    bestForLabel: "Ideal pour",
    outcomeLabel: "Vous repartez avec",
    durationLabel: "Duree",
    formatLabel: "Format",
    priceLabel: "Prix",
    freePriceLabel: "Gratuit",
    noDirectOptions:
      "Aucune session directe n'est active pour le moment. Vous pouvez toujours commencer par l'audit gratuit.",
    showMoreOptions: "Voir plus de sessions",
    showFewerOptions: "Voir moins de sessions",
    continueTitle: "Continuer vers la reservation apres connexion",
    continueBody:
      "Votre chemin selectionne est sauvegarde. Connectez-vous maintenant pour voir la bonne disponibilite et terminer la reservation sans recommencer.",
    continueBullets: [
      "Votre session ou audit selectionne reste sauvegarde",
      "Vous choisissez la date et l'heure apres connexion",
      "Les confirmations et mises a jour restent liees a votre compte",
    ],
    contactNote: "Pas pret a reserver maintenant ?",
    contactLink: "Utilisez le formulaire de contact et nous vous guiderons vers la bonne suite.",
  },
  de: {
    heroTitle: "Waehlen Sie den richtigen Buchungsweg",
    heroBody:
      "Starten Sie mit dem kostenlosen Workflow-Audit oder waehlen Sie eine direkte Live-Session, wenn Sie bereits wissen, welches Gespraech Sie brauchen.",
    heroSupport:
      "Jetzt waehlen, sicher anmelden und dann direkt mit der Buchung weitermachen.",
    recommendedBadge: "Empfohlen",
    freeAuditEyebrow: "Empfohlener Startpunkt",
    freeAuditTitle: "Mit dem kostenlosen Workflow-Audit starten",
    freeAuditBody:
      "Am besten fuer erste Gespraeche, wenn Sie eine klare Pruefung Ihres Workflows, Ihrer Systeme und der naechsten Automatisierungschancen wollen.",
    freeAuditCardBullets: [
      "Erste Pruefung Ihres Workflows oder Problems",
      "Hinweis auf den besten naechsten Schritt",
      "Keine Verpflichtung",
    ],
    freeAuditCta: "Mit kostenlosem Audit starten",
    freeAuditDetailsTitle: "Was im kostenlosen Audit passiert",
    freeAuditDetailsBody:
      "Das kostenlose Audit bietet eine strukturierte erste Pruefung, bevor eine tiefere Session empfohlen wird.",
    freeAuditBullets: [
      "Kurze Pruefung Ihres Workflows oder aktuellen Problems",
      "Besprechung bestehender Tools und Blocker",
      "Hinweis, wo Automatisierung oder KI zuerst helfen kann",
      "Empfehlung fuer den richtigen naechsten Service oder Termin",
    ],
    freeAuditNotes: [
      "Keine Verpflichtung",
      "Ideal fuer neue Anfragen",
      "Gut, wenn Sie noch nicht sicher sind, welche Session passt",
    ],
    optionsEyebrow: "Direkte Sessions",
    optionsTitle: "Direkte Live-Session buchen",
    optionsBody:
      "Wenn Sie bereits wissen, welche Art von Gespraech Sie brauchen, waehlen Sie unten eine aktive Session und fahren Sie mit der Anmeldung fort.",
    directSessionBullets: [
      "Live-Session auswaehlen",
      "Sicher anmelden",
      "Direkt in die Buchung weitergehen",
    ],
    optionsCta: "Direkte Buchungsoptionen ansehen",
    directSectionLead:
      "Oder waehlen Sie eine direkte Session, wenn Sie bereits wissen, was Sie brauchen",
    howItWorksTitle: "So funktioniert die Buchung",
    howItWorksBody:
      "Ihr gewaehltes Audit oder Ihre Session bleibt gespeichert, damit Sie nach der Anmeldung direkt im richtigen Buchungsablauf weitermachen.",
    howItWorksSteps: [
      {
        title: "Weg waehlen",
        body: "Mit dem kostenlosen Audit starten oder direkte Session auswaehlen.",
      },
      {
        title: "Sicher anmelden",
        body: "Der gewaehlte Buchungsweg bleibt mit Ihrem Konto verknuepft.",
      },
      {
        title: "Datum und Uhrzeit bestaetigen",
        body: "Sie gehen direkt in den passenden Verfuegbarkeitsschritt weiter.",
      },
    ],
    optionsSectionTitle: "Direkte Live-Buchungsoptionen",
    optionsSectionBody:
      "Waehlen Sie unten eine Session, wenn Sie bereits wissen, welches Gespraech Sie wollen. Nach der Auswahl melden Sie sich an und machen direkt mit dieser Session weiter.",
    previewTitle: "Direkte Session waehlen",
    previewBody:
      "Diese Live-Optionen kommen direkt aus den aktiven Meeting-Typen in Ihrem Terminplanungssystem.",
    previewAction: "Auswaehlen und weiter",
    selectedLabel: "Ausgewaehlte Session",
    requestedMissingTitle: "Diese Session ist derzeit nicht live",
    requestedMissingBody:
      "Der angeforderte Meeting-Typ ist derzeit nicht veroeffentlicht. Sie koennen trotzdem mit dem kostenlosen Audit starten oder unten eine andere Live-Session waehlen.",
    bestForLabel: "Am besten fuer",
    outcomeLabel: "Sie gehen heraus mit",
    durationLabel: "Dauer",
    formatLabel: "Format",
    priceLabel: "Preis",
    freePriceLabel: "Kostenlos",
    noDirectOptions:
      "Noch keine direkten Live-Sessions aktiv. Sie koennen weiterhin mit dem kostenlosen Audit starten.",
    showMoreOptions: "Mehr Sessions anzeigen",
    showFewerOptions: "Weniger Sessions anzeigen",
    continueTitle: "Nach der Anmeldung zur Buchung weiter",
    continueBody:
      "Ihr gewaehlter Weg ist gespeichert. Melden Sie sich jetzt an, um die richtige Verfuegbarkeit zu sehen und die Buchung ohne Neustart abzuschliessen.",
    continueBullets: [
      "Ihre gewaehlte Session oder Ihr Audit bleibt gespeichert",
      "Datum und Uhrzeit waehlen Sie nach der Anmeldung",
      "Bestaetigungen und Updates bleiben mit Ihrem Konto verknuepft",
    ],
    contactNote: "Noch nicht bereit zu buchen?",
    contactLink: "Nutzen Sie das Kontaktformular und wir fuehren Sie zum richtigen naechsten Schritt.",
  },
  lb: {
    heroTitle: "Wielt de richtege Booking-Wee",
    heroBody:
      "Fänkt mam gratis Workflow-Audit un oder wielt eng direkt Live-Sessioun, wann Dir schonn wësst, wéi e Gespréich Dir braucht.",
    heroSupport:
      "Elo wielen, sécher umellen, an da direkt mat der Booking weidergoen.",
    recommendedBadge: "Empfohlen",
    freeAuditEyebrow: "Empfohlene Startpunkt",
    freeAuditTitle: "Mam gratis Workflow-Audit ufänken",
    freeAuditBody:
      "Am beschte fir éischt Gespréicher, wann Dir eng kloer Iwwerpréiwung vun Ärem Workflow, Äre Systemer an de nächsten Automatiséierungschancen wëllt.",
    freeAuditCardBullets: [
      "Éischt Iwwerpréiwung vun Ärem Workflow oder Problem",
      "Orientatioun fir de beschte nächste Schrëtt",
      "Keng Verpflichtung",
    ],
    freeAuditCta: "Mam gratis Audit ufänken",
    freeAuditDetailsTitle: "Wat am gratis Audit geschitt",
    freeAuditDetailsBody:
      "De gratis Audit gëtt Iech eng strukturéiert éischt Iwwerpréiwung, ier eng méi déif Sessioun recommandéiert gëtt.",
    freeAuditBullets: [
      "Kuerz Iwwerpréiwung vun Ärem Workflow oder aktuelle Problem",
      "Gespréich iwwer déi bestoend Tools an d'Blocker",
      "Orientatioun, wou Automatiséierung oder AI als éischt hëllefe kann",
      "Recommandatioun fir de richtege nächste Service oder Termin",
    ],
    freeAuditNotes: [
      "Keng Verpflichtung",
      "Ideal fir nei Ufroen",
      "Gutt, wann Dir nach net sécher sidd, wéi eng Sessioun passt",
    ],
    optionsEyebrow: "Direkt Sessiounen",
    optionsTitle: "Eng direkt Live-Sessioun buchen",
    optionsBody:
      "Wann Dir schonn d'Zort Gespréich kennt, déi Dir braucht, wielt hei drënner eng aktiv Sessioun a fuert mat der Umeldung weider.",
    directSessionBullets: [
      "Eng live Sessioun wielen",
      "Sécher umellen",
      "Direkt an d'Booking weidergoen",
    ],
    optionsCta: "Direkt Booking-Optiounen kucken",
    directSectionLead:
      "Oder wielt eng direkt Sessioun, wann Dir schonn wësst, wat Dir braucht",
    howItWorksTitle: "Wéi d'Booking funktionéiert",
    howItWorksBody:
      "Ären gewielten Audit oder Är Sessioun bleift gespäichert, sou datt Dir nom Umellen direkt am richtege Booking-Flow weidermaacht.",
    howItWorksSteps: [
      {
        title: "Äre Wee wielen",
        body: "Mam gratis Audit ufänken oder eng direkt Sessioun auswielen.",
      },
      {
        title: "Sécher umellen",
        body: "De gewielte Booking-Wee bleift mat Ärem Konto verbonnen.",
      },
      {
        title: "Datum an Zäit confirméieren",
        body: "Dir gitt direkt an de richtegen Disponibilitéits-Schrëtt weider.",
      },
    ],
    optionsSectionTitle: "Direkt Live-Booking-Optiounen",
    optionsSectionBody:
      "Wielt hei drënner eng Sessioun, wann Dir schonn d'Gespréich kennt, dat Dir wëllt. Nom Auswielen mellt Dir Iech un a gitt direkt mat där Sessioun weider.",
    previewTitle: "Eng direkt Sessioun auswielen",
    previewBody:
      "Dës Live-Optioune kommen direkt vun den aktive Meeting-Typen an Ärem Scheduling-System.",
    previewAction: "Auswielen a weider",
    selectedLabel: "Gewielt Sessioun",
    requestedMissingTitle: "Dës Sessioun ass elo nach net live",
    requestedMissingBody:
      "De gefroten Meeting-Typ ass aktuell nach net publizéiert. Dir kënnt awer mam gratis Audit ufänken oder hei drënner eng aner Live-Sessioun wielen.",
    bestForLabel: "Am beschte fir",
    outcomeLabel: "Dir gitt eraus mat",
    durationLabel: "Dauer",
    formatLabel: "Format",
    priceLabel: "Präis",
    freePriceLabel: "Gratis",
    noDirectOptions:
      "Et sinn nach keng direkt Live-Sessiounen aktiv. Dir kënnt awer mam gratis Audit ufänken.",
    showMoreOptions: "Méi Sessioune weisen",
    showFewerOptions: "Manner Sessioune weisen",
    continueTitle: "No der Umeldung an d'Booking weidergoen",
    continueBody:
      "Äre gewielte Wee ass gespäichert. Mellt Iech elo un, fir déi richteg Disponibilitéit ze gesinn an d'Booking ouni nei unzefänken ofzeschléissen.",
    continueBullets: [
      "Är gewielte Sessioun oder Ären Audit bleift gespäichert",
      "Datum an Zäit wielt Dir no der Umeldung",
      "Confirmatiounen an Updates bleiwen un Äre Konto gebonnen",
    ],
    contactNote: "Nach net prett fir ze buchen?",
    contactLink: "Benotzt de Kontakt-Formulaire a mir féieren Iech op de richtege nächste Schrëtt.",
  },
} as const;

const schedulingCopyEn = {
  bridge: {
    eyebrow: "Need a broader workflow audit?",
    title: "Move from booking into a deeper contact and scoping discussion.",
    description:
      "If the challenge spans systems, integrations, or process redesign, send the workflow through contact so we can review the context and recommend the right next step.",
    primaryCta: "See Booking Options",
    secondaryCta: "Jump to Contact Form",
    guestNote:
      "Not ready to sign in and book yet? Use the contact form first and we can guide you to the right session.",
  },
  heroEyebrow: "Scheduling",
  heroTitle: "Book Your Free Audit",
  heroBody:
    "Use scheduling to book the free audit or continue into a live conversation with the Lux AI team.",
  guest: {
    eyebrow: "Free audit option",
    title: "Book your free audit here after sign-in.",
    description:
      "Use this page to continue into scheduling. Once you sign in, we will take you to the free audit option so you can choose a time and complete the booking.",
    bullets: [
      "Free audit booking happens inside scheduling",
      "You choose the time only after sign-in",
      "Contact still works if you prefer to send context first",
    ],
    primaryCta: "Sign in and continue",
    secondaryCta: "Use contact instead",
  },
  unavailableEyebrow: "Scheduling",
  unavailableTitle: "Scheduling temporarily unavailable",
  unavailableFallback:
    "We can't show booking availability right now. You can still start the audit process or send your details and we'll guide you to the next step.",
  unavailablePrimary: "Start free audit",
  unavailableSecondary: "Send details",
  unavailableNote:
    "We'll review your request and follow up with the right next step or booking once availability is restored.",
  stepLabels: { type: "Type", mode: "Mode", profile: "Profile", time: "Time", confirm: "Confirm" },
  buttons: {
    back: "Back", next: "Next", signIn: "Sign in", freeAudit: "Contact form", editDetails: "Edit details", saveProfile: "Save profile", saving: "Saving...", cancel: "Cancel", changeMeetingType: "Change meeting type", viewBookings: "View my bookings", confirmBooking: "Confirm booking", proceedToPayment: "Proceed to payment", booking: "Booking...", signInToBook: "Sign in to book", downloadIcs: "Download ICS", addToGoogleCalendar: "Add to Google Calendar", bookAnotherTime: "Book another time",
  },
  status: { loading: "Loading...", meetingTypes: "Loading meeting types...", profile: "Loading your profile...", noMeetingTypes: "No meeting types available yet." },
  errors: {
    unknown: "Unknown error", notesRequired: "Meeting notes are required.", notesLength: "Notes must be 8-1000 characters.", fullName: "Full name must be 2-120 characters.", phone: "Enter a valid phone number.", timezone: "Select a timezone.", roleRequired: "Role is required when company is provided.", companyTooLong: "Company name is too long.", roleTooLong: "Role is too long.", loadMeetingTypes: "Failed to load meeting types", loadProfile: "Failed to load profile.", saveProfile: "Failed to save profile.", signInToBook: "Please sign in to book and complete payment.", missingPaidConfig: "This paid meeting type is missing a price or currency.", paymentSetup: "Payment setup failed.", bookingFailed: "Booking failed.", bookingPending: "Booking request submitted.", bookingConfirmed: "Booking confirmed.",
  },
  meetingModes: { select: "Select a meeting mode", googleMeet: "Google Meet", zoom: "Zoom", phone: "Phone call", inPerson: "In-person" },
  timezonePicker: { search: "Search timezone", empty: "No matches" },
  step1: { title: "Step 1 · Choose a meeting type", body: "Pick the session that fits your goals.", signIn: "Sign in to choose a meeting type and continue.", modeTbd: "mode: tbd", required: "required" },
  step2: { title: "Step 2 · Choose a meeting mode", body: "Pick how you want to connect with our team.", signIn: "Sign in to choose a meeting mode.", unlock: "Select a meeting type first to unlock meeting modes.", availableModes: "Available modes", basedOn: "Based on", noModes: "No modes configured for this meeting type." },
  step3: { title: "Step 3 · Booking profile", body: "We save this once and reuse it for future bookings.", unlock: "Select a meeting type and meeting mode to unlock the booking profile.", fullName: "Full name *", phone: "Phone *", phonePlaceholder: "Enter phone number", phoneHint: "Use a WhatsApp-enabled number for booking updates.", timezone: "Timezone *", company: "Company (optional)", role: "Role in company", rolePlaceholder: "Required if company is provided", incomplete: "Fill in the required fields to save your profile.", contact: "Contact", timezoneCard: "Timezone", timezoneHint: "Used to keep your booking times consistent.", confirm: "I confirm these details are correct for this booking." },
  step4: { title: "Step 4 · Choose a time", body: "Display timezone controls how the calendar is shown.", displayTimezone: "Display timezone", displayCurrency: "Display currency", ratesUpdated: "Rates updated", selectType: "Select a meeting type to unlock available times.", selectMode: "Select a meeting mode to unlock available times.", completeProfile: "Complete your booking profile to unlock available times.", confirmProfile: "Confirm your booking profile to unlock available times.", selectedTime: "Selected time", timeSelected: "Time selected", noTimeSelected: "No time selected yet", pickSlotPrefix: "Pick a slot to preview in", clearSelection: "Click to clear selection.", notes: "Meeting concept notes *", notesPlaceholder: "Share what you want to cover in this session.", notesUsage: "Used only for this booking." },
  step5: { title: "Step 5 · Confirmation", body: "Review details before confirming your booking.", meeting: "Meeting", sessionFallback: "Session", phoneCallTo: "Phone call to", meetingLinkLater: "Meeting link will be emailed after confirmation.", time: "Time", booker: "Booker", personalBooking: "Personal booking", notes: "Notes", preferredTimezone: "Preferred timezone", payment: "Payment", paymentRequired: "Payment required", paid: "Payment: Paid", checkoutHint: "Click “Proceed to payment” to pay in Stripe before this booking can be confirmed.", approvalHint: "If the organization requires approval, your booking can still stay pending until the team approves it.", paymentLinkHint: "If redirect fails, use the payment link provided by your admin.", paymentStatus: "Payment status", notifications: "You will receive a confirmation email if notifications are enabled.", selectTimeNotice: "Select a time to review your booking details." },
  calendarText: { fileName: "luxai-booking.ics", meetingWithLuxAi: "Meeting with Lux AI", notesPrefix: "Notes", modePrefix: "Mode", meetingLinkPrefix: "Meeting link", phonePrefix: "Phone", phoneFallback: "n/a" },
};

const schedulingCopyFr = {
  bridge: {
    eyebrow: "Besoin d'un audit de workflow plus large ?",
    title: "Passez de la reservation a une discussion plus approfondie sur le cadrage et le besoin.",
    description:
      "Si le sujet touche plusieurs systemes, integrations ou une refonte de processus, utilisez le contact pour que nous analysions le contexte et recommandions la bonne suite.",
    primaryCta: "Voir les options de reservation",
    secondaryCta: "Aller au formulaire de contact",
    guestNote:
      "Pas encore pret a vous connecter et reserver ? Utilisez d'abord le formulaire de contact et nous vous guiderons vers la bonne session.",
  },
  heroEyebrow: "Planification",
  heroTitle: "Reservez votre audit gratuit",
  heroBody: "Utilisez la planification pour reserver l'audit gratuit ou avancer vers une conversation en direct avec l'equipe Lux AI.",
  guest: {
    eyebrow: "Option audit gratuit",
    title: "Reservez votre audit gratuit ici apres connexion.",
    description:
      "Utilisez cette page pour continuer vers la planification. Une fois connecte, nous vous amenons a l'option d'audit gratuit pour choisir un creneau et finaliser la reservation.",
    bullets: [
      "La reservation de l'audit gratuit se fait dans la planification",
      "Vous choisissez le creneau seulement apres connexion",
      "Le contact reste disponible si vous preferez envoyer le contexte d'abord",
    ],
    primaryCta: "Se connecter et continuer",
    secondaryCta: "Utiliser le contact",
  },
  unavailableEyebrow: "Planification",
  unavailableTitle: "Planification temporairement indisponible",
  unavailableFallback:
    "Nous ne pouvons pas afficher les disponibilites pour le moment. Vous pouvez toujours lancer l'audit ou envoyer vos details, et nous vous guiderons vers la bonne suite.",
  unavailablePrimary: "Lancer l'audit gratuit",
  unavailableSecondary: "Envoyer vos details",
  unavailableNote:
    "Nous examinerons votre demande et reviendrons vers vous avec la bonne prochaine etape ou reservation des que la disponibilite sera retablie.",
  stepLabels: { type: "Type", mode: "Mode", profile: "Profil", time: "Heure", confirm: "Confirmer" },
  buttons: {
    back: "Retour", next: "Suivant", signIn: "Se connecter", freeAudit: "Formulaire de contact", editDetails: "Modifier les informations", saveProfile: "Enregistrer le profil", saving: "Enregistrement...", cancel: "Annuler", changeMeetingType: "Changer de type de session", viewBookings: "Voir mes reservations", confirmBooking: "Confirmer la reservation", proceedToPayment: "Passer au paiement", booking: "Reservation...", signInToBook: "Se connecter pour reserver", downloadIcs: "Telecharger l'ICS", addToGoogleCalendar: "Ajouter a Google Agenda", bookAnotherTime: "Reserver un autre creneau",
  },
  status: { loading: "Chargement...", meetingTypes: "Chargement des types de session...", profile: "Chargement de votre profil...", noMeetingTypes: "Aucun type de session disponible pour le moment." },
  errors: {
    unknown: "Erreur inconnue", notesRequired: "Les notes de session sont obligatoires.", notesLength: "Les notes doivent contenir entre 8 et 1000 caracteres.", fullName: "Le nom complet doit contenir entre 2 et 120 caracteres.", phone: "Saisissez un numero de telephone valide.", timezone: "Selectionnez un fuseau horaire.", roleRequired: "Le role est obligatoire si une entreprise est indiquee.", companyTooLong: "Le nom de l'entreprise est trop long.", roleTooLong: "Le role est trop long.", loadMeetingTypes: "Impossible de charger les types de session", loadProfile: "Impossible de charger le profil.", saveProfile: "Impossible d'enregistrer le profil.", signInToBook: "Veuillez vous connecter pour reserver et finaliser le paiement.", missingPaidConfig: "Ce type de session payant n'a pas de prix ou de devise configure.", paymentSetup: "La preparation du paiement a echoue.", bookingFailed: "La reservation a echoue.", bookingPending: "Demande de reservation envoyee.", bookingConfirmed: "Reservation confirmee.",
  },
  meetingModes: { select: "Selectionner un mode de reunion", googleMeet: "Google Meet", zoom: "Zoom", phone: "Appel telephonique", inPerson: "En presentiel" },
  timezonePicker: { search: "Rechercher un fuseau horaire", empty: "Aucun resultat" },
  step1: { title: "Etape 1 · Choisir un type de session", body: "Choisissez la session adaptee a votre objectif.", signIn: "Connectez-vous pour choisir un type de session et continuer.", modeTbd: "mode : a definir", required: "requis" },
  step2: { title: "Etape 2 · Choisir un mode de reunion", body: "Choisissez comment vous souhaitez echanger avec notre equipe.", signIn: "Connectez-vous pour choisir un mode de reunion.", unlock: "Choisissez d'abord un type de session pour debloquer les modes de reunion.", availableModes: "Modes disponibles", basedOn: "Base sur", noModes: "Aucun mode configure pour ce type de session." },
  step3: { title: "Etape 3 · Profil de reservation", body: "Nous l'enregistrons une fois et le reutilisons pour les reservations futures.", unlock: "Choisissez un type de session et un mode de reunion pour debloquer le profil de reservation.", fullName: "Nom complet *", phone: "Telephone *", phonePlaceholder: "Saisir le numero", phoneHint: "Utilisez un numero joignable sur WhatsApp pour les mises a jour de reservation.", timezone: "Fuseau horaire *", company: "Entreprise (optionnel)", role: "Role dans l'entreprise", rolePlaceholder: "Obligatoire si une entreprise est indiquee", incomplete: "Renseignez les champs obligatoires pour enregistrer votre profil.", contact: "Contact", timezoneCard: "Fuseau horaire", timezoneHint: "Utilise pour garder des horaires de reservation coherents.", confirm: "Je confirme que ces informations sont correctes pour cette reservation." },
  step4: { title: "Etape 4 · Choisir une heure", body: "Le fuseau horaire d'affichage controle la facon dont le calendrier est presente.", displayTimezone: "Fuseau horaire d'affichage", displayCurrency: "Devise d'affichage", ratesUpdated: "Taux mis a jour", selectType: "Choisissez un type de session pour debloquer les horaires disponibles.", selectMode: "Choisissez un mode de reunion pour debloquer les horaires disponibles.", completeProfile: "Completez votre profil de reservation pour debloquer les horaires disponibles.", confirmProfile: "Confirmez votre profil de reservation pour debloquer les horaires disponibles.", selectedTime: "Horaire selectionne", timeSelected: "Horaire selectionne", noTimeSelected: "Aucun horaire selectionne pour le moment", pickSlotPrefix: "Choisissez un creneau pour l'apercu dans", clearSelection: "Cliquez pour effacer la selection.", notes: "Notes sur l'objectif de la session *", notesPlaceholder: "Indiquez ce que vous souhaitez couvrir pendant cette session.", notesUsage: "Utilise uniquement pour cette reservation." },
  step5: { title: "Etape 5 · Confirmation", body: "Verifiez les details avant de confirmer votre reservation.", meeting: "Session", sessionFallback: "Session", phoneCallTo: "Appel vers", meetingLinkLater: "Le lien de reunion sera envoye par e-mail apres confirmation.", time: "Horaire", booker: "Reservant", personalBooking: "Reservation personnelle", notes: "Notes", preferredTimezone: "Fuseau horaire prefere", payment: "Paiement", paymentRequired: "Paiement requis", paid: "Paiement : paye", checkoutHint: "Cliquez sur « Passer au paiement » pour payer dans Stripe avant que cette reservation puisse etre confirmee.", approvalHint: "Si l'organisation exige une approbation, la reservation peut rester en attente jusqu'a validation par l'equipe.", paymentLinkHint: "Si la redirection echoue, utilisez le lien de paiement fourni par votre administrateur.", paymentStatus: "Statut du paiement", notifications: "Vous recevrez un e-mail de confirmation si les notifications sont activees.", selectTimeNotice: "Selectionnez un horaire pour verifier les details de votre reservation." },
  calendarText: { fileName: "reservation-luxai.ics", meetingWithLuxAi: "Reunion avec Lux AI", notesPrefix: "Notes", modePrefix: "Mode", meetingLinkPrefix: "Lien de reunion", phonePrefix: "Telephone", phoneFallback: "n/d" },
};

const schedulingCopyDe = {
  bridge: {
    eyebrow: "Brauchen Sie ein breiteres Workflow-Audit?",
    title: "Wechseln Sie von der Buchung in ein tieferes Kontakt- und Scoping-Gesprach.",
    description: "Wenn die Herausforderung mehrere Systeme, Integrationen oder Prozessneugestaltung betrifft, nutzen Sie das Kontaktformular. So konnen wir den Kontext prufen und den richtigen nachsten Schritt empfehlen.",
    primaryCta: "Buchungsoptionen ansehen",
    secondaryCta: "Zum Kontaktformular",
    guestNote: "Noch nicht bereit, sich anzumelden und zu buchen? Nutzen Sie zuerst das Kontaktformular, und wir leiten Sie zur passenden Session.",
  },
  heroEyebrow: "Terminbuchung",
  heroTitle: "Buchen Sie Ihr kostenloses Audit",
  heroBody: "Nutzen Sie die Terminbuchung, um das kostenlose Audit zu buchen oder in ein Live-Gesprach mit dem Lux-AI-Team zu wechseln.",
  guest: {
    eyebrow: "Kostenloses Audit",
    title: "Buchen Sie Ihr kostenloses Audit hier nach der Anmeldung.",
    description:
      "Nutzen Sie diese Seite als Einstieg in die Terminplanung. Nach der Anmeldung fuhren wir Sie direkt zur kostenlosen Audit-Option, damit Sie eine Zeit auswahlen und die Buchung abschliessen konnen.",
    bullets: [
      "Die kostenlose Audit-Buchung lauft innerhalb der Terminplanung",
      "Die Uhrzeit wahlen Sie erst nach der Anmeldung",
      "Kontakt bleibt verfugbar, wenn Sie den Kontext lieber zuerst senden mochten",
    ],
    primaryCta: "Anmelden und fortfahren",
    secondaryCta: "Kontakt nutzen",
  },
  unavailableEyebrow: "Terminbuchung",
  unavailableTitle: "Terminbuchung voruebergehend nicht verfuegbar",
  unavailableFallback:
    "Wir koennen die Buchungsverfuegbarkeit gerade nicht anzeigen. Sie koennen den Audit-Prozess trotzdem starten oder Ihre Angaben senden, und wir leiten Sie zum richtigen naechsten Schritt.",
  unavailablePrimary: "Kostenloses Audit starten",
  unavailableSecondary: "Details senden",
  unavailableNote:
    "Wir pruefen Ihre Anfrage und melden uns mit dem richtigen naechsten Schritt oder Termin, sobald die Verfuegbarkeit wiederhergestellt ist.",
  stepLabels: { type: "Typ", mode: "Modus", profile: "Profil", time: "Zeit", confirm: "Bestatigen" },
  buttons: {
    back: "Zuruck", next: "Weiter", signIn: "Anmelden", freeAudit: "Kontaktformular", editDetails: "Angaben bearbeiten", saveProfile: "Profil speichern", saving: "Speichert...", cancel: "Abbrechen", changeMeetingType: "Meeting-Typ andern", viewBookings: "Meine Buchungen ansehen", confirmBooking: "Buchung bestatigen", proceedToPayment: "Zur Zahlung", booking: "Bucht...", signInToBook: "Zum Buchen anmelden", downloadIcs: "ICS herunterladen", addToGoogleCalendar: "Zu Google Kalender hinzufugen", bookAnotherTime: "Anderen Termin buchen",
  },
  status: { loading: "Ladt...", meetingTypes: "Meeting-Typen werden geladen...", profile: "Ihr Profil wird geladen...", noMeetingTypes: "Noch keine Meeting-Typen verfugbar." },
  errors: {
    unknown: "Unbekannter Fehler", notesRequired: "Sitzungsnotizen sind erforderlich.", notesLength: "Die Notizen mussen zwischen 8 und 1000 Zeichen lang sein.", fullName: "Der vollstandige Name muss zwischen 2 und 120 Zeichen lang sein.", phone: "Geben Sie eine gultige Telefonnummer ein.", timezone: "Wahlen Sie eine Zeitzone aus.", roleRequired: "Eine Rolle ist erforderlich, wenn ein Unternehmen angegeben ist.", companyTooLong: "Der Unternehmensname ist zu lang.", roleTooLong: "Die Rolle ist zu lang.", loadMeetingTypes: "Meeting-Typen konnten nicht geladen werden", loadProfile: "Profil konnte nicht geladen werden.", saveProfile: "Profil konnte nicht gespeichert werden.", signInToBook: "Bitte melden Sie sich an, um zu buchen und die Zahlung abzuschliessen.", missingPaidConfig: "Fur diesen kostenpflichtigen Meeting-Typ fehlen Preis oder Wahrung.", paymentSetup: "Die Zahlungseinrichtung ist fehlgeschlagen.", bookingFailed: "Die Buchung ist fehlgeschlagen.", bookingPending: "Buchungsanfrage gesendet.", bookingConfirmed: "Buchung bestatigt.",
  },
  meetingModes: { select: "Meeting-Modus auswahlen", googleMeet: "Google Meet", zoom: "Zoom", phone: "Telefonat", inPerson: "Vor Ort" },
  timezonePicker: { search: "Zeitzone suchen", empty: "Keine Treffer" },
  step1: { title: "Schritt 1 · Meeting-Typ wahlen", body: "Wahlen Sie die Session, die zu Ihrem Ziel passt.", signIn: "Melden Sie sich an, um einen Meeting-Typ auszuwahlen und fortzufahren.", modeTbd: "Modus: offen", required: "erforderlich" },
  step2: { title: "Schritt 2 · Meeting-Modus wahlen", body: "Wahlen Sie, wie Sie mit unserem Team in Kontakt treten mochten.", signIn: "Melden Sie sich an, um einen Meeting-Modus zu wahlen.", unlock: "Wahlen Sie zuerst einen Meeting-Typ, um die Meeting-Modi freizuschalten.", availableModes: "Verfugbare Modi", basedOn: "Basierend auf", noModes: "Fur diesen Meeting-Typ sind keine Modi konfiguriert." },
  step3: { title: "Schritt 3 · Buchungsprofil", body: "Wir speichern dies einmal und verwenden es fur kunftige Buchungen wieder.", unlock: "Wahlen Sie einen Meeting-Typ und einen Meeting-Modus, um das Buchungsprofil freizuschalten.", fullName: "Vollstandiger Name *", phone: "Telefon *", phonePlaceholder: "Telefonnummer eingeben", phoneHint: "Verwenden Sie eine WhatsApp-fahige Nummer fur Buchungsupdates.", timezone: "Zeitzone *", company: "Unternehmen (optional)", role: "Rolle im Unternehmen", rolePlaceholder: "Erforderlich, wenn ein Unternehmen angegeben ist", incomplete: "Fullen Sie die Pflichtfelder aus, um Ihr Profil zu speichern.", contact: "Kontakt", timezoneCard: "Zeitzone", timezoneHint: "Dient dazu, Ihre Buchungszeiten konsistent zu halten.", confirm: "Ich bestatige, dass diese Angaben fur diese Buchung korrekt sind." },
  step4: { title: "Schritt 4 · Zeit wahlen", body: "Die Anzeige-Zeitzone steuert, wie der Kalender dargestellt wird.", displayTimezone: "Anzeige-Zeitzone", displayCurrency: "Anzeige-Wahrung", ratesUpdated: "Kurse aktualisiert", selectType: "Wahlen Sie einen Meeting-Typ, um verfugbare Zeiten freizuschalten.", selectMode: "Wahlen Sie einen Meeting-Modus, um verfugbare Zeiten freizuschalten.", completeProfile: "Vervollstandigen Sie Ihr Buchungsprofil, um verfugbare Zeiten freizuschalten.", confirmProfile: "Bestatigen Sie Ihr Buchungsprofil, um verfugbare Zeiten freizuschalten.", selectedTime: "Gewahlte Zeit", timeSelected: "Zeit ausgewahlt", noTimeSelected: "Noch keine Zeit ausgewahlt", pickSlotPrefix: "Wahlen Sie ein Zeitfenster zur Vorschau in", clearSelection: "Klicken Sie, um die Auswahl zu loschen.", notes: "Notizen zum Sitzungsthema *", notesPlaceholder: "Teilen Sie mit, was Sie in dieser Session besprechen mochten.", notesUsage: "Wird nur fur diese Buchung verwendet." },
  step5: { title: "Schritt 5 · Bestatigung", body: "Prufen Sie die Details, bevor Sie Ihre Buchung bestatigen.", meeting: "Meeting", sessionFallback: "Session", phoneCallTo: "Telefonat an", meetingLinkLater: "Der Meeting-Link wird nach der Bestatigung per E-Mail gesendet.", time: "Zeit", booker: "Buchende Person", personalBooking: "Personliche Buchung", notes: "Notizen", preferredTimezone: "Bevorzugte Zeitzone", payment: "Zahlung", paymentRequired: "Zahlung erforderlich", paid: "Zahlung: bezahlt", checkoutHint: "Klicken Sie auf „Zur Zahlung“, um in Stripe zu zahlen, bevor diese Buchung bestatigt werden kann.", approvalHint: "Wenn die Organisation eine Freigabe verlangt, kann Ihre Buchung dennoch auf ausstehend bleiben, bis das Team zustimmt.", paymentLinkHint: "Falls die Weiterleitung fehlschlagt, verwenden Sie den von Ihrem Admin bereitgestellten Zahlungslink.", paymentStatus: "Zahlungsstatus", notifications: "Sie erhalten eine Bestatigungs-E-Mail, wenn Benachrichtigungen aktiviert sind.", selectTimeNotice: "Wahlen Sie eine Zeit, um die Buchungsdetails zu prufen." },
  calendarText: { fileName: "luxai-buchung.ics", meetingWithLuxAi: "Meeting mit Lux AI", notesPrefix: "Notizen", modePrefix: "Modus", meetingLinkPrefix: "Meeting-Link", phonePrefix: "Telefon", phoneFallback: "k. A." },
};

const schedulingCopyLb = {
  bridge: {
    eyebrow: "Braucht Dir e méi breeden Workflow-Audit?",
    title: "Gitt vun der Buchung an eng méi déif Kontakt- a Scoping-Diskussioun.",
    description: "Wann d'Erausfuerderung iwwer Systemer, Integratiounen oder Prozess-Redesign geet, benotzt de Kontakt, fir datt mir de Kontext kënne kucken an de richtege nächste Schrëtt recommandéieren.",
    primaryCta: "Booking-Optioune kucken",
    secondaryCta: "Bei de Kontakt-Formulaire",
    guestNote: "Nach net prett, Iech unzemellen a ze buchen? Benotzt fir d'éischt de Kontakt-Formulaire, an da féiere mir Iech op déi richteg Session.",
  },
  heroEyebrow: "Planung",
  heroTitle: "Bucht Äre gratis Audit",
  heroBody: "Benotzt d'Scheduling, fir de gratis Audit ze buchen oder an e Live-Gespréich mat der Lux-AI-Equipe weiderzegoen.",
  guest: {
    eyebrow: "Gratis Audit Optioun",
    title: "Bucht Äre gratis Audit hei no der Umeldung.",
    description:
      "Benotzt dës Säit fir an d'Scheduling eran ze goen. No der Umeldung féiere mir Iech direkt op d'Gratis-Audit-Optioun, fir datt Dir eng Zäit wielt an d'Buchung ofschléisst.",
    bullets: [
      "D'Gratis-Audit-Buchung leeft an der Scheduling",
      "Dir wielt d'Zäit eréischt no der Umeldung",
      "Kontakt bleift disponibel, wann Dir léiwer fir d'éischt de Kontext schécke wëllt",
    ],
    primaryCta: "Umellen a weidergoen",
    secondaryCta: "Kontakt benotzen",
  },
  unavailableEyebrow: "Scheduling",
  unavailableTitle: "Scheduling temporär net disponibel",
  unavailableFallback:
    "Mir kënnen d'Booking-Disponibilitéit elo net weisen. Dir kënnt awer de gratis Audit ufänken oder Är Detailer schécken, a mir féieren Iech op de richtege nächste Schrëtt.",
  unavailablePrimary: "Gratis Audit ufänken",
  unavailableSecondary: "Detailer schécken",
  unavailableNote:
    "Mir préiwen Är Ufro a kommen op Iech zeréck mam richtege nächste Schrëtt oder Booking, soubal d'Disponibilitéit erëm do ass.",
  stepLabels: { type: "Typ", mode: "Modus", profile: "Profil", time: "Zäit", confirm: "Confirméieren" },
  buttons: {
    back: "Zréck", next: "Weider", signIn: "Umellen", freeAudit: "Kontakt-Formulaire", editDetails: "Detailer änneren", saveProfile: "Profil späicheren", saving: "Späichert...", cancel: "Ofbriechen", changeMeetingType: "Meeting-Typ änneren", viewBookings: "Meng Buchunge kucken", confirmBooking: "Buchung confirméieren", proceedToPayment: "Weider op Bezuelung", booking: "Bucht...", signInToBook: "Umellen fir ze buchen", downloadIcs: "ICS eroflueden", addToGoogleCalendar: "Bei Google Kalenner dobäisetzen", bookAnotherTime: "Eng aner Zäit buchen",
  },
  status: { loading: "Lued...", meetingTypes: "Meeting-Typpe ginn gelueden...", profile: "Äre Profil gëtt gelueden...", noMeetingTypes: "Et si nach keng Meeting-Typpe verfügbar." },
  errors: {
    unknown: "Onbekannte Feeler", notesRequired: "Session-Notize si verlaangt.", notesLength: "D'Notize mussen tëscht 8 an 1000 Zeeche leien.", fullName: "De komplette Numm muss tëscht 2 an 120 Zeeche leien.", phone: "Gitt eng valabel Telefonsnummer an.", timezone: "Wielt eng Zäitzon aus.", roleRequired: "Eng Roll ass verlaangt, wann eng Firma uginn ass.", companyTooLong: "De Firmennumm ass ze laang.", roleTooLong: "D'Roll ass ze laang.", loadMeetingTypes: "D'Meeting-Typpe konnten net geluede ginn", loadProfile: "De Profil konnt net geluede ginn.", saveProfile: "De Profil konnt net gespäichert ginn.", signInToBook: "Mellt Iech w.e.g. un, fir ze buchen an d'Bezuelung ofzeschléissen.", missingPaidConfig: "Fir dëse bezuelte Meeting-Typ feelt e Präis oder eng Währung.", paymentSetup: "D'Bezuelungskonfiguratioun ass feelgeschloen.", bookingFailed: "D'Buchung ass feelgeschloen.", bookingPending: "Buchungsufro agereecht.", bookingConfirmed: "Buchung confirméiert.",
  },
  meetingModes: { select: "Meeting-Modus auswielen", googleMeet: "Google Meet", zoom: "Zoom", phone: "Telefonsgespréich", inPerson: "Op der Plaz" },
  timezonePicker: { search: "Zäitzon sichen", empty: "Keng Treffer" },
  step1: { title: "Schrëtt 1 · Meeting-Typ auswielen", body: "Wielt d'Session, déi am Beschte bei Äert Zil passt.", signIn: "Mellt Iech un, fir e Meeting-Typ ze wielen an weiderzefueren.", modeTbd: "Modus: nach op", required: "néideg" },
  step2: { title: "Schrëtt 2 · Meeting-Modus auswielen", body: "Wielt, wéi Dir mat eiser Equipe verbannen wëllt.", signIn: "Mellt Iech un, fir e Meeting-Modus ze wielen.", unlock: "Wielt als éischt e Meeting-Typ, fir d'Meeting-Modi fräizeginn.", availableModes: "Verfügbar Modi", basedOn: "Baséiert op", noModes: "Fir dëse Meeting-Typ si keng Modi ageriicht." },
  step3: { title: "Schrëtt 3 · Buchungsprofil", body: "Mir späicheren dat eng Kéier a benotzen et fir zukünfteg Buchungen erëm.", unlock: "Wielt e Meeting-Typ an e Meeting-Modus, fir de Buchungsprofil fräizeginn.", fullName: "Komplette Numm *", phone: "Telefon *", phonePlaceholder: "Telefonsnummer aginn", phoneHint: "Benotzt eng WhatsApp-fäheg Nummer fir Buchungsupdates.", timezone: "Zäitzon *", company: "Firma (optional)", role: "Roll an der Firma", rolePlaceholder: "Verlaangt, wann eng Firma uginn ass", incomplete: "Fëllt déi néideg Felder aus, fir Äre Profil ze späicheren.", contact: "Kontakt", timezoneCard: "Zäitzon", timezoneHint: "Dat gëtt benotzt, fir Är Buchungszäite konsequent ze halen.", confirm: "Ech confirméieren, datt dës Detailer fir dës Buchung richteg sinn." },
  step4: { title: "Schrëtt 4 · Zäit auswielen", body: "D'Affichage-Zäitzon bestëmmt, wéi de Kalenner gewise gëtt.", displayTimezone: "Affichage-Zäitzon", displayCurrency: "Affichage-Währung", ratesUpdated: "Coursen aktualiséiert", selectType: "Wielt e Meeting-Typ, fir verfügbar Zäiten fräizeginn.", selectMode: "Wielt e Meeting-Modus, fir verfügbar Zäiten fräizeginn.", completeProfile: "Fëllt Äre Buchungsprofil aus, fir verfügbar Zäiten fräizeginn.", confirmProfile: "Confirméiert Äre Buchungsprofil, fir verfügbar Zäiten fräizeginn.", selectedTime: "Gewielte Zäit", timeSelected: "Zäit ausgewielt", noTimeSelected: "Nach keng Zäit ausgewielt", pickSlotPrefix: "Wielt e Slot fir d'Virschau an", clearSelection: "Klickt fir d'Auswiel ze läschen.", notes: "Notize fir d'Sessiounszil *", notesPlaceholder: "Deelt mat, wat Dir an dëser Session ofdecke wëllt.", notesUsage: "Nëmme fir dës Buchung benotzt." },
  step5: { title: "Schrëtt 5 · Confirmatioun", body: "Iwwerpréift d'Detailer, ier Dir Är Buchung confirméiert.", meeting: "Meeting", sessionFallback: "Session", phoneCallTo: "Telefonsgespréich un", meetingLinkLater: "De Meeting-Link gëtt no der Confirmatioun per E-Mail geschéckt.", time: "Zäit", booker: "Buchend Persoun", personalBooking: "Perséinlech Buchung", notes: "Notizen", preferredTimezone: "Bevorzucht Zäitzon", payment: "Bezuelung", paymentRequired: "Bezuelung verlaangt", paid: "Bezuelung: bezuelt", checkoutHint: "Klickt op « Weider op Bezuelung », fir an Stripe ze bezuelen, ier dës Buchung confirméiert ka ginn.", approvalHint: "Wann d'Organisatioun eng Zoustëmmung verlaangt, kann Är Buchung nach ëmmer op pending bleiwen, bis d'Equipe zoustëmmt.", paymentLinkHint: "Wann d'Weiderleedung feelt, benotzt de Bezuelungslink vun Ärem Admin.", paymentStatus: "Bezuelungsstatus", notifications: "Dir kritt eng Confirmatiouns-E-Mail, wann Notifikatiounen aktivéiert sinn.", selectTimeNotice: "Wielt eng Zäit, fir Är Buchungsdetailer ze iwwerpréiwen." },
  calendarText: { fileName: "luxai-buchung.ics", meetingWithLuxAi: "Meeting mat Lux AI", notesPrefix: "Notizen", modePrefix: "Modus", meetingLinkPrefix: "Meeting-Link", phonePrefix: "Telefon", phoneFallback: "keng Angab" },
};

const localizedSchedulingCopy = {
  en: schedulingCopyEn,
  fr: schedulingCopyFr,
  de: schedulingCopyDe,
  lb: schedulingCopyLb,
} as const;

type Props = {
  orgId: string; // required for booking flows
  meetingTypeId?: string;
  meetingTypeKey?: string;
  staffUserId?: string;
  tz?: string;
  availabilityError?: string;
};

type BookingProfile = {
  id: string;
  orgId: string | null;
  userId: string;
  fullName: string;
  phone: string;
  company: string | null;
  companyRole: string | null;
  timezone: string;
  notes?: string | null;
};

type FormState = {
  fullName: string;
  phone: string;
  company: string;
  companyRole: string;
  timezone: string;
};

type MeetingMode = "google_meet" | "zoom" | "phone" | "in_person";
type ModeDetails = {
  label?: string | null;
  description?: string | null;
  link?: string | null;
};
type MeetingModeOption = {
  mode: MeetingMode;
  details?: ModeDetails | null;
};
type MeetingType = {
  id: string;
  key: string;
  title: string;
  subtitle?: string | null;
  description: string | null;
  durationMin: number;
  paymentPolicy?: PaymentPolicy | null;
  priceCents: number | null;
  currency: string | null;
  modes: MeetingModeOption[];
};
type BookedSlot = {
  startUtc: string;
  endUtc: string;
  startLocal: string;
  endLocal: string;
  timezone: string;
  staffUserId?: string | null;
};
type BookingSummary = {
  slot: BookedSlot;
  meetingTypeId: string;
  displayTz: string;
  mode: MeetingMode;
  status: string;
  meetingLink?: string | null;
  payment?: {
    status: string;
    priceCents: number | null;
    currency: string | null;
    policy: string;
  } | null;
};

type PaymentPolicy = "FREE" | "PAID";
type SchedulingCopy = typeof schedulingCopyEn;
type SchedulingEntryCopy = (typeof schedulingEntryCopy)[AppLanguage];

const DIRECT_MEETING_PRIORITY = [
  "discovery-call",
  "ai-strategy-consultation",
  "automation-audit",
];
const INTERNAL_MEETING_KEY_HINTS = [
  "internal",
  "follow-up",
  "followup",
  "staff",
  "review",
  "approval",
  "manual",
  "admin",
  "partner",
];
const MAX_PUBLIC_DIRECT_MEETING_TYPES = 3;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMeetingTypeToken(value: string): string {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findRequestedMeetingTypeId(
  items: MeetingType[],
  params: { meetingTypeId?: string; meetingTypeKey?: string }
): string {
  const byId = cleanString(params.meetingTypeId);
  if (byId && items.some((item) => item.id === byId)) {
    return byId;
  }

  const keyToken = normalizeMeetingTypeToken(params.meetingTypeKey ?? "");
  if (keyToken) {
    const byKey = items.find((item) => {
      const candidates = [
        item.key,
        item.title,
        item.subtitle ?? "",
      ].map(normalizeMeetingTypeToken);

      return candidates.some(
        (candidate) =>
          candidate === keyToken ||
          candidate.includes(keyToken) ||
          keyToken.includes(candidate)
      );
    });

    if (byKey) return byKey.id;
  }

  return "";
}

function resolveMeetingTypeId(
  items: MeetingType[],
  params: { meetingTypeId?: string; meetingTypeKey?: string }
): string {
  const requestedId = findRequestedMeetingTypeId(items, params);
  if (requestedId) return requestedId;

  const hasExplicitRequest = Boolean(
    cleanString(params.meetingTypeId) || cleanString(params.meetingTypeKey)
  );

  if (hasExplicitRequest) return "";
  const freeAuditId = findRequestedMeetingTypeId(items, {
    meetingTypeKey: "free-audit",
  });
  if (freeAuditId) return freeAuditId;
  return items[0]?.id ?? "";
}

function buildSchedulingHref(params: { meetingTypeKey?: string; tz?: string }) {
  const search = new URLSearchParams();
  const meetingTypeKey = cleanString(params.meetingTypeKey);
  const tz = cleanString(params.tz);

  if (meetingTypeKey) search.set("meetingTypeKey", meetingTypeKey);
  if (tz) search.set("tz", tz);

  const query = search.toString();
  return query ? `/scheduling?${query}` : "/scheduling";
}

function isFreeAuditMeetingType(item: Pick<MeetingType, "key" | "title" | "subtitle">) {
  const candidates = [item.key, item.title, item.subtitle ?? ""].map(
    normalizeMeetingTypeToken
  );

  return candidates.some(
    (candidate) =>
      candidate === "free-audit" ||
      candidate.includes("free-audit") ||
      (candidate.includes("free") && candidate.includes("audit"))
  );
}

function compareMeetingTypes(a: MeetingType, b: MeetingType) {
  const aFreeAudit = isFreeAuditMeetingType(a);
  const bFreeAudit = isFreeAuditMeetingType(b);

  if (aFreeAudit !== bFreeAudit) {
    return aFreeAudit ? -1 : 1;
  }

  const aPriority = DIRECT_MEETING_PRIORITY.indexOf(
    normalizeMeetingTypeToken(a.key)
  );
  const bPriority = DIRECT_MEETING_PRIORITY.indexOf(
    normalizeMeetingTypeToken(b.key)
  );

  if (aPriority !== bPriority) {
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    return aPriority - bPriority;
  }

  return normalizeMeetingTitle(a.title, a.durationMin).localeCompare(
    normalizeMeetingTitle(b.title, b.durationMin)
  );
}

function isLikelyInternalMeetingType(
  item: Pick<MeetingType, "key" | "title" | "subtitle">
) {
  const candidates = [item.key, item.title, item.subtitle ?? ""].map(
    normalizeMeetingTypeToken
  );

  return candidates.some((candidate) =>
    INTERNAL_MEETING_KEY_HINTS.some((hint) => candidate.includes(hint))
  );
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeStaffUserId(value?: string | null): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  return UUID_REGEX.test(cleaned) ? cleaned : null;
}

function asErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

function isPhoneValid(value: string): boolean {
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed) return false;
  const digits = parsed.nationalNumber ?? "";
  const len = digits.length;
  if (len < 8 || len > 15) return false;
  return parsed.isValid() && parsed.isPossible();
}

function validateMeetingNotes(
  value: string,
  copy: SchedulingCopy
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return copy.errors.notesRequired;
  if (trimmed.length < 8 || trimmed.length > 1000) {
    return copy.errors.notesLength;
  }
  return null;
}

function resolveBrowserTz() {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function formatPrice(
  priceCents: number | null,
  currency: string | null,
  locale: string
): string | null {
  if (!priceCents || !currency) return null;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(priceCents / 100);
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${currency}`;
  }
}

function normalizeMeetingTitle(title: string, fallbackDuration: number): string {
  const clean = title.replace(/\s*\(\s*\d+\s*min\s*\)\s*$/i, "").trim();
  if (clean) return clean;
  return `${title.trim()} (${fallbackDuration} min)`.trim();
}

function formatIcsUtc(dtIso: string) {
  return DateTime.fromISO(dtIso).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
}

function buildIcsContent(args: {
  title: string;
  description: string;
  startUtc: string;
  endUtc: string;
}) {
  const uid = `${crypto.randomUUID()}@luxai`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lux AI//Scheduling//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(new Date().toISOString())}`,
    `DTSTART:${formatIcsUtc(args.startUtc)}`,
    `DTEND:${formatIcsUtc(args.endUtc)}`,
    `SUMMARY:${args.title}`,
    `DESCRIPTION:${args.description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function buildGoogleCalendarUrl(args: {
  title: string;
  details: string;
  startUtc: string;
  endUtc: string;
}) {
  const start = formatIcsUtc(args.startUtc);
  const end = formatIcsUtc(args.endUtc);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: args.title,
    details: args.details,
    dates: `${start}/${end}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatMeetingMode(mode: MeetingMode | "", copy: SchedulingCopy) {
  if (!mode) return copy.meetingModes.select;
  switch (mode) {
    case "google_meet":
      return copy.meetingModes.googleMeet;
    case "zoom":
      return copy.meetingModes.zoom;
    case "phone":
      return copy.meetingModes.phone;
    case "in_person":
      return copy.meetingModes.inPerson;
    default:
      return mode;
  }
}

function MeetingTypeCard({
  item,
  selected,
  locale,
  copy,
  footer,
  onSelect,
}: {
  item: MeetingType;
  selected?: boolean;
  locale: string;
  copy: SchedulingCopy;
  footer?: ReactNode;
  onSelect?: () => void;
}) {
  const priceLabel = formatPrice(item.priceCents, item.currency, locale);
  const title = normalizeMeetingTitle(item.title, item.durationMin);
  const modeLabels = (item.modes ?? []).map((mode) => {
    const label = mode.details?.label?.trim();
    return (label || formatMeetingMode(mode.mode, copy)).toUpperCase();
  });
  const isPaid = (item.paymentPolicy ?? "FREE") !== "FREE";

  const classes = [
    "w-full rounded-3xl border px-4 py-4 text-left transition backdrop-blur",
    selected
      ? "border-primary-600 bg-gradient-to-br from-primary-600 to-indigo-600 text-white shadow-[0_18px_45px_-30px_rgba(14,66,126,0.6)] dark:border-primary-400"
      : "border-white/70 bg-white/80 text-gray-900 hover:border-primary-200 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-white",
  ].join(" ");

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] opacity-70">
            {item.key}
          </p>
          <h3 className="mt-2 text-lg font-semibold">{title}</h3>
          {item.subtitle && (
            <p className="mt-1 text-sm font-medium opacity-80">
              {item.subtitle}
            </p>
          )}
        </div>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold",
            selected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700",
          ].join(" ")}
        >
          {item.durationMin} min
        </span>
      </div>
      {item.description && (
        <p className="mt-2 text-sm opacity-80">{item.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
        {modeLabels.length > 0 ? modeLabels.join(" · ") : copy.step1.modeTbd}
      </div>
      {isPaid && priceLabel && (
        <div className="mt-3 text-sm font-semibold">
          {priceLabel} {copy.step1.required}
        </div>
      )}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </>
  );

  if (!onSelect) {
    return <div className={classes}>{content}</div>;
  }

  return (
    <button type="button" onClick={onSelect} className={classes}>
      {content}
    </button>
  );
}

function PublicMeetingTypeCard({
  item,
  selected,
  locale,
  copy,
  entryCopy,
  href,
  onSelect,
}: {
  item: MeetingType;
  selected?: boolean;
  locale: string;
  copy: SchedulingCopy;
  entryCopy: SchedulingEntryCopy;
  href: string;
  onSelect?: () => void;
}) {
  const title = normalizeMeetingTitle(item.title, item.durationMin);
  const priceLabel = formatPrice(item.priceCents, item.currency, locale);
  const isFree = (item.paymentPolicy ?? "FREE") === "FREE";
  const bestForText = cleanString(item.subtitle) || cleanString(item.description);
  const modeLabels = (item.modes ?? []).map((mode) => {
    const label = mode.details?.label?.trim();
    return label || formatMeetingMode(mode.mode, copy);
  });

  const metadata = [
    `${item.durationMin} min`,
    modeLabels.length > 0 ? modeLabels.join(" / ") : copy.step1.modeTbd,
    isFree ? entryCopy.freePriceLabel : priceLabel || copy.step1.required,
  ];

  return (
    <div
      className={[
        "rounded-3xl border p-4 shadow-sm transition backdrop-blur",
        selected
          ? "border-primary-300 bg-primary-50/80 shadow-[0_18px_45px_-34px_rgba(14,66,126,0.35)] dark:border-primary-400/40 dark:bg-primary-500/10"
          : "border-white/70 bg-white/80 dark:border-slate-700/60 dark:bg-slate-900/68",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {selected ? (
          <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            {entryCopy.selectedLabel}
          </span>
        ) : null}
      </div>

      {bestForText ? (
        <p className="mt-3 text-sm leading-6 text-gray-700 dark:text-gray-200">
          {bestForText}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {metadata.map((value) => (
          <span
            key={value}
            className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50/85 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-gray-200"
          >
            {value}
          </span>
        ))}
      </div>

      <div className="mt-4">
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className={[
              "inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition-colors",
              selected
                ? "border border-primary-300 bg-white text-primary-700 hover:bg-primary-50 dark:border-primary-400/40 dark:bg-slate-950/40 dark:text-white"
                : "bg-primary-600 text-white hover:bg-primary-700",
            ].join(" ")}
          >
            {selected ? entryCopy.selectedLabel : entryCopy.previewAction}
          </button>
        ) : (
          <Link
            href={href}
            className={[
              "inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition-colors",
              selected
                ? "border border-primary-300 bg-white text-primary-700 hover:bg-primary-50 dark:border-primary-400/40 dark:bg-slate-950/40 dark:text-white"
                : "bg-primary-600 text-white hover:bg-primary-700",
            ].join(" ")}
          >
            {selected ? entryCopy.selectedLabel : entryCopy.previewAction}
          </Link>
        )}
      </div>
    </div>
  );
}

function TimezonePicker({
  value,
  onChange,
  options,
  searchPlaceholder,
  emptyLabel,
  buttonClassName,
  menuClassName,
}: {
  value: string;
  onChange: (next: string) => void;
  options: string[];
  searchPlaceholder: string;
  emptyLabel: string;
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((zone) => zone.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const idx = filtered.indexOf(value);
    setHighlight(idx >= 0 ? idx : 0);
  }, [open, filtered, value]);

  useEffect(() => {
    if (!open || filtered.length === 0) return;
    const el = listRef.current?.querySelector(`[data-tz-index="${highlight}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlight, filtered.length]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((prev) =>
        filtered.length === 0 ? 0 : (prev + 1) % filtered.length
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((prev) =>
        filtered.length === 0 ? 0 : (prev - 1 + filtered.length) % filtered.length
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const zone = filtered[highlight];
      if (zone) {
        onChange(zone);
        setQuery("");
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={[
          "flex h-10 items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/80 px-3 text-sm leading-6 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          buttonClassName ?? "",
        ].join(" ")}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{value}</span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div
          className={[
            "absolute z-20 mt-2 rounded-xl border border-white/70 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90",
            menuClassName ?? "w-full",
          ].join(" ")}
        >
          <input
            className="h-9 w-full rounded-lg border border-white/70 bg-white/90 px-3 text-sm text-gray-900 leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-gray-100"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            autoFocus
            onKeyDown={handleKeyDown}
          />
          <div
            ref={listRef}
            className="mt-2 max-h-60 overflow-auto rounded-lg border border-gray-100/80 dark:border-slate-700/60"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {emptyLabel}
              </div>
            ) : (
              filtered.map((zone, index) => (
                <button
                  key={zone}
                  type="button"
                  data-tz-index={index}
                  className={[
                    "w-full px-3 py-2 text-left text-sm hover:bg-gray-100/80 dark:hover:bg-slate-800/60",
                    zone === value ? "font-semibold" : "",
                    index === highlight ? "bg-gray-100/80 dark:bg-slate-800/60" : "",
                  ].join(" ")}
                  onClick={() => {
                    onChange(zone);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  {zone}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchedulingClient(props: Props) {
  const { lang } = useLanguage();
  const copy = localizedSchedulingCopy[lang] ?? localizedSchedulingCopy.en;
  const entryCopy = schedulingEntryCopy[lang] ?? schedulingEntryCopy.en;
  const locale = localeByLanguage[lang] ?? localeByLanguage.en;
  // Ensure props are plain strings (protect against accidental undefined / whitespace)
  const orgId = cleanString(props.orgId);
  const initialMeetingTypeId = cleanString(props.meetingTypeId);
  const initialMeetingTypeKey = cleanString(props.meetingTypeKey);
  const staffUserId = cleanString(props.staffUserId);
  const initialTz = cleanString(props.tz) || "Africa/Addis_Ababa";
  const availabilityError = cleanString(props.availabilityError);
  const myBookingsHref = "/scheduling/my";

  const { status } = useSession();
  const isSessionLoading = status === "loading";
  const isAuthed = status === "authenticated";

  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);

  const [defaultCurrency, setDefaultCurrency] = useState<string | null>(null);
  const [allowedCurrencies, setAllowedCurrencies] = useState<string[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(
    {}
  );
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [meetingTypesLoading, setMeetingTypesLoading] = useState(false);
  const [meetingTypesError, setMeetingTypesError] = useState<string | null>(
    null
  );
  const [selectedMeetingTypeId, setSelectedMeetingTypeId] = useState(
    initialMeetingTypeId
  );
  const [selectedMode, setSelectedMode] = useState<MeetingMode | "">("");

  const [profile, setProfile] = useState<BookingProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayTz, setDisplayTz] = useState(
    cleanString(props.tz) || resolveBrowserTz()
  );
  const [displayTzLocked, setDisplayTzLocked] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<BookedSlot | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [orgPaymentPolicy, setOrgPaymentPolicy] =
    useState<PaymentPolicy>("FREE");

  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    company: "",
    companyRole: "",
    timezone: initialTz,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({});
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingNotesTouched, setMeetingNotesTouched] = useState(false);
  const freeAuditHref = useMemo(
    () =>
      buildSchedulingHref({
        meetingTypeKey: "free-audit",
        tz: displayTz || initialTz,
      }),
    [displayTz, initialTz]
  );

  const meetingNotesError = useMemo(
    () =>
      meetingNotesTouched ? validateMeetingNotes(meetingNotes, copy) : null,
    [meetingNotes, meetingNotesTouched, copy]
  );
  const meetingNotesValid = useMemo(
    () => !validateMeetingNotes(meetingNotes, copy),
    [meetingNotes, copy]
  );

  const isProfileIncomplete = Boolean(
    !cleanString(form.fullName) ||
      !isPhoneValid(cleanString(form.phone)) ||
      !cleanString(form.timezone) ||
      (cleanString(form.company) && !cleanString(form.companyRole))
  );
  const canProceedToMode = Boolean(selectedMeetingTypeId);
  const canProceedToProfile = Boolean(selectedMeetingTypeId && selectedMode);
  const canProceedToTime =
    Boolean(selectedMeetingTypeId && selectedMode && profile) &&
    !showForm &&
    confirmed;
  const selectedMeetingType = useMemo(
    () => meetingTypes.find((item) => item.id === selectedMeetingTypeId) ?? null,
    [meetingTypes, selectedMeetingTypeId]
  );
  const directMeetingTypes = useMemo(
    () => meetingTypes.filter((item) => !isFreeAuditMeetingType(item)),
    [meetingTypes]
  );
  const publicDirectMeetingTypes = useMemo(() => {
    const filtered = directMeetingTypes.filter(
      (item) => !isLikelyInternalMeetingType(item)
    );
    const prioritized = filtered.filter((item) =>
      DIRECT_MEETING_PRIORITY.includes(normalizeMeetingTypeToken(item.key))
    );
    const remainder = filtered.filter(
      (item) =>
        !DIRECT_MEETING_PRIORITY.includes(normalizeMeetingTypeToken(item.key))
    );

    return [...prioritized, ...remainder].slice(0, MAX_PUBLIC_DIRECT_MEETING_TYPES);
  }, [directMeetingTypes]);
  const signInMeetingTypeKey = useMemo(() => {
    const selectedItem =
      meetingTypes.find((item) => item.id === selectedMeetingTypeId) ?? null;

    if (selectedItem) {
      if (isFreeAuditMeetingType(selectedItem)) return selectedItem.key;
      if (publicDirectMeetingTypes.some((item) => item.id === selectedItem.id)) {
        return selectedItem.key;
      }
    }

    if (normalizeMeetingTypeToken(initialMeetingTypeKey) === "free-audit") {
      return "free-audit";
    }

    return publicDirectMeetingTypes[0]?.key || "free-audit";
  }, [
    meetingTypes,
    selectedMeetingTypeId,
    initialMeetingTypeKey,
    publicDirectMeetingTypes,
  ]);
  const signInCallbackUrl = useMemo(
    () =>
      buildSchedulingHref({
        meetingTypeKey: signInMeetingTypeKey,
        tz: displayTz || initialTz,
      }),
    [displayTz, signInMeetingTypeKey, initialTz]
  );
  const selectedPublicDirectMeetingType = useMemo(
    () =>
      publicDirectMeetingTypes.find((item) => item.id === selectedMeetingTypeId) ??
      null,
    [publicDirectMeetingTypes, selectedMeetingTypeId]
  );
  const freeAuditSelected = useMemo(
    () =>
      normalizeMeetingTypeToken(signInMeetingTypeKey) === "free-audit" ||
      Boolean(selectedMeetingType && isFreeAuditMeetingType(selectedMeetingType)),
    [selectedMeetingType, signInMeetingTypeKey]
  );
  const requestedMeetingTypeId = useMemo(
    () =>
      findRequestedMeetingTypeId(meetingTypes, {
        meetingTypeId: initialMeetingTypeId,
        meetingTypeKey: initialMeetingTypeKey,
      }),
    [meetingTypes, initialMeetingTypeId, initialMeetingTypeKey]
  );
  const requestedMeetingTypeMissing = useMemo(
    () =>
      Boolean(
        meetingTypes.length > 0 &&
          (initialMeetingTypeId || initialMeetingTypeKey) &&
          !requestedMeetingTypeId
      ),
    [
      meetingTypes.length,
      initialMeetingTypeId,
      initialMeetingTypeKey,
      requestedMeetingTypeId,
    ]
  );
  const selectedModeDetails = useMemo(
    () =>
      selectedMeetingType?.modes.find((mode) => mode.mode === selectedMode) ??
      null,
    [selectedMeetingType, selectedMode]
  );
  const selectedModeLabel =
    selectedModeDetails?.details?.label?.trim() ||
    formatMeetingMode(selectedMode as MeetingMode, copy);
  const effectivePaymentPolicy =
    (selectedMeetingType?.paymentPolicy ?? orgPaymentPolicy) as PaymentPolicy;
  const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_URL;
  const paymentPriceLabel = formatPrice(
    selectedMeetingType?.priceCents ?? null,
    selectedMeetingType?.currency ?? null,
    locale
  );
  const convertedPriceLabel = useMemo(() => {
    if (!selectedMeetingType?.priceCents || !selectedMeetingType?.currency) {
      return null;
    }
    if (!displayCurrency || displayCurrency === selectedMeetingType.currency) {
      return null;
    }
    const rate = exchangeRates[displayCurrency];
    if (!rate || !Number.isFinite(rate)) return null;
    const converted = Math.round(selectedMeetingType.priceCents * rate);
    return formatPrice(converted, displayCurrency, locale);
  }, [
    selectedMeetingType?.priceCents,
    selectedMeetingType?.currency,
    displayCurrency,
    exchangeRates,
    locale,
  ]);
  const paymentRequiredByPolicy = effectivePaymentPolicy !== "FREE";
  const meetingHasPaymentConfig =
    Boolean(selectedMeetingType?.priceCents) &&
    Boolean(selectedMeetingType?.currency);
  const missingPaymentConfig =
    paymentRequiredByPolicy && !meetingHasPaymentConfig;
  const requiresCheckout = paymentRequiredByPolicy;
  const selectedSlotLabel = useMemo(() => {
    if (!selectedSlot) return null;
    const start = DateTime.fromISO(selectedSlot.startUtc)
      .setZone(displayTz)
      .setLocale(locale);
    const end = DateTime.fromISO(selectedSlot.endUtc)
      .setZone(displayTz)
      .setLocale(locale);
    if (!start.isValid || !end.isValid) return null;
    return `${start.toFormat("ccc, LLL dd · HH:mm")} - ${end.toFormat("HH:mm")}`;
  }, [selectedSlot, displayTz, locale]);
  const hasSelectedSlot = Boolean(selectedSlot);
  const [activeStep, setActiveStep] = useState(1);
  const canAdvanceStep = useMemo(
    () => ({
      1: isAuthed && Boolean(selectedMeetingTypeId),
      2: Boolean(selectedMeetingTypeId && selectedMode),
      3: Boolean(profile) && !showForm && confirmed,
      4: Boolean(selectedSlot) || Boolean(bookingSummary),
    }),
    [
      isAuthed,
      selectedMeetingTypeId,
      selectedMode,
      profile,
      showForm,
      confirmed,
      selectedSlot,
      bookingSummary,
    ]
  );

  useEffect(() => {
    setActiveStep((prev) => {
      if (!isAuthed) return 1;
      if (prev > 1 && !selectedMeetingTypeId) return 1;
      if (prev > 2 && !selectedMode) return 2;
      if (prev > 3 && (!profile || showForm || !confirmed)) return 3;
      if (prev > 4 && !selectedSlot && !bookingSummary) return 4;
      return prev;
    });
  }, [
    isAuthed,
    selectedMeetingTypeId,
    selectedMode,
    profile,
    showForm,
    confirmed,
    selectedSlot,
    bookingSummary,
  ]);
  useEffect(() => {
    setBookingSummary(null);
    setSelectedSlot(null);
    setBookingError(null);
  }, [selectedMeetingTypeId, selectedMode, showForm, confirmed]);

  useEffect(() => {
    setMeetingNotes("");
    setMeetingNotesTouched(false);
  }, [selectedMeetingTypeId, selectedMode]);

  useEffect(() => {
    if (!selectedMeetingType) {
      setSelectedMode("");
      return;
    }
    if (!selectedMeetingType.modes?.length) {
      setSelectedMode("");
      return;
    }
    const modeKeys = selectedMeetingType.modes.map((mode) => mode.mode);
    if (!selectedMode || !modeKeys.includes(selectedMode)) {
      setSelectedMode(modeKeys[0] ?? "");
    }
  }, [selectedMeetingType, selectedMode]);

  const timezones = useMemo<string[]>(() => {
    const fallback: string[] = [
      "UTC",
      "Africa/Addis_Ababa",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Zurich",
      "Europe/Luxembourg",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Asia/Singapore",
      "Asia/Tokyo",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
    ];

    const anyIntl = Intl as unknown as {
      supportedValuesOf?: (k: string) => string[];
    };

    if (typeof anyIntl?.supportedValuesOf === "function") {
      try {
        const list = anyIntl.supportedValuesOf("timeZone");
        return list.length ? list : fallback;
      } catch {
        return fallback;
      }
    }

    return fallback;
  }, []);

  useEffect(() => {
    if (!orgId) {
      setMeetingTypes([]);
      setMeetingTypesLoading(false);
      setMeetingTypesError(null);
      return;
    }

    let cancelled = false;
    setMeetingTypesLoading(true);
    setMeetingTypesError(null);

    const locale =
      typeof navigator !== "undefined"
        ? navigator.language.split("-")[0]
        : "en";

    const url = new URL("/api/scheduling/meeting-types", window.location.origin);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("locale", locale);

    fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setMeetingTypesError(data?.error ?? copy.errors.loadMeetingTypes);
          setMeetingTypes([]);
          return;
        }

        const items = Array.isArray(data?.items)
          ? (data.items as MeetingType[])
          : [];
        const sortedItems = [...items].sort(compareMeetingTypes);
        const allowed = Array.isArray(data?.allowedCurrencies)
          ? data.allowedCurrencies
          : [];
        const defaultCur = cleanString(data?.defaultCurrency) || null;
        if (data?.paymentPolicy) {
          setOrgPaymentPolicy(data.paymentPolicy as PaymentPolicy);
        }
        setMeetingTypes(sortedItems);
        setAllowedCurrencies(allowed);
        setDefaultCurrency(defaultCur);

        setSelectedMeetingTypeId(
          resolveMeetingTypeId(sortedItems, {
            meetingTypeId: initialMeetingTypeId,
            meetingTypeKey: initialMeetingTypeKey,
          })
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setMeetingTypesError(asErrorMessage(err, copy.errors.loadMeetingTypes));
        setMeetingTypes([]);
      })
      .finally(() => {
        if (!cancelled) setMeetingTypesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    orgId,
    initialMeetingTypeId,
    initialMeetingTypeKey,
    locale,
    copy.errors.loadMeetingTypes,
  ]);

  useEffect(() => {
    if (!selectedMeetingType) return;
    const next =
      displayCurrency ??
      selectedMeetingType.currency ??
      defaultCurrency ??
      allowedCurrencies[0] ??
      null;
    if (next && next !== displayCurrency) {
      setDisplayCurrency(next);
    }
  }, [
    selectedMeetingType,
    displayCurrency,
    defaultCurrency,
    allowedCurrencies,
  ]);

  useEffect(() => {
    if (!orgId || !selectedMeetingType?.currency) return;
    const symbols = allowedCurrencies.filter(
      (code) => code && code !== selectedMeetingType.currency
    );
    if (symbols.length === 0) {
      setExchangeRates({});
      setRatesUpdatedAt(null);
      return;
    }
    const url = new URL("/api/scheduling/exchange-rates", window.location.origin);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("base", selectedMeetingType.currency);
    url.searchParams.set("symbols", symbols.join(","));
    fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (!ok) return;
        setExchangeRates((data?.rates ?? {}) as Record<string, number>);
        setRatesUpdatedAt(data?.fetchedAt ?? null);
      })
      .catch(() => {});
  }, [orgId, selectedMeetingType?.currency, allowedCurrencies]);

  useEffect(() => {
    if (!isAuthed) {
      setProfile(null);
      setProfileError(null);
      setShowForm(true);
      setConfirmed(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);

    fetch("/api/scheduling/profile", { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;

        if (!ok) {
          setProfileError(data?.error ?? copy.errors.loadProfile);
          setProfile(null);
          setShowForm(true);
          setConfirmed(false);
          return;
        }

        const nextProfile = (data?.profile ?? null) as BookingProfile | null;
        setProfile(nextProfile);

        if (nextProfile) {
          setForm({
            fullName: nextProfile.fullName,
            phone: nextProfile.phone,
            company: nextProfile.company ?? "",
            companyRole: nextProfile.companyRole ?? "",
            timezone: nextProfile.timezone,
          });
          if (!displayTzLocked) {
            setDisplayTz(nextProfile.timezone || resolveBrowserTz());
          }
          setShowForm(false);
          setConfirmed(false);
        } else {
          setShowForm(true);
          setConfirmed(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setProfileError(asErrorMessage(err, copy.errors.loadProfile));
        setProfile(null);
        setShowForm(true);
        setConfirmed(false);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthed, displayTzLocked, copy.errors.loadProfile]);

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setFieldErrors({});

    const fullName = cleanString(form.fullName);
    const phone = cleanString(form.phone);
    const company = cleanString(form.company);
    const companyRole = cleanString(form.companyRole);
    const timezone = cleanString(form.timezone);

    const errors: Partial<FormState> = {};

    if (!fullName || fullName.length < 2 || fullName.length > 120) {
      errors.fullName = copy.errors.fullName;
    }

    if (!phone || !isPhoneValid(phone)) {
      errors.phone = copy.errors.phone;
    }

    if (!timezone) {
      errors.timezone = copy.errors.timezone;
    }

    if (company && !companyRole) {
      errors.companyRole = copy.errors.roleRequired;
    }

    if (company && company.length > 120) {
      errors.company = copy.errors.companyTooLong;
    }

    if (companyRole && companyRole.length > 120) {
      errors.companyRole = copy.errors.roleTooLong;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/scheduling/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // server stores this as "last used org" (nullable)
          orgId,
          fullName,
          phone,
          company: company || undefined,
          companyRole: companyRole || undefined,
          timezone,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileError(json?.error ?? copy.errors.saveProfile);
        return;
      }

      setProfile(json.profile as BookingProfile);
      setShowForm(false);
      setFieldErrors({});
      if (!displayTzLocked) {
        setDisplayTz(json.profile?.timezone || resolveBrowserTz());
      }
      setConfirmed(false);
    } catch (err: unknown) {
      setProfileError(asErrorMessage(err, copy.errors.saveProfile));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmBooking() {
    if (!selectedSlot || !selectedMeetingTypeId || !profile || !selectedMode)
      return;
    if (bookingSubmitting) return;
    const notesError = validateMeetingNotes(meetingNotes, copy);
    if (notesError) {
      setMeetingNotesTouched(true);
      setBookingError(notesError);
      toast.error(notesError);
      return;
    }
    if (!isAuthed) {
      const message = copy.errors.signInToBook;
      setBookingError(message);
      toast.error(message);
      if (typeof window !== "undefined") {
        signIn(undefined, { callbackUrl: window.location.href });
      }
      return;
    }
    if (missingPaymentConfig) {
      const message = copy.errors.missingPaidConfig;
      setBookingError(message);
      toast.error(message);
      return;
    }
    setBookingSubmitting(true);
    setBookingError(null);

    try {
      const resolvedStaffUserId =
        normalizeStaffUserId(selectedSlot.staffUserId) ??
        normalizeStaffUserId(staffUserId);
      const staffPayload = resolvedStaffUserId
        ? { staffUserId: resolvedStaffUserId }
        : {};
      const notes = meetingNotes.trim();
      const resolvedTz =
        cleanString(selectedSlot.timezone) ||
        cleanString(profile.timezone) ||
        resolveBrowserTz();

      if (requiresCheckout) {
        const payload = {
          orgId,
          meetingTypeId: selectedMeetingTypeId,
          mode: selectedMode,
          startLocal: selectedSlot.startLocal,
          tz: resolvedTz,
          notes,
          meetingTitle: normalizeMeetingTitle(
            selectedMeetingType?.title ??
              selectedMeetingType?.key ??
              copy.calendarText.meetingWithLuxAi,
            selectedMeetingType?.durationMin ?? 60
          ),
          durationMin: selectedMeetingType?.durationMin ?? 60,
          displayTz,
          ...staffPayload,
        };
        const res = await fetch("/api/scheduling/payment/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = json?.error ?? copy.errors.paymentSetup;
          setBookingError(message);
          toast.error(message);
          return;
        }
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "pendingBooking",
            JSON.stringify({
              ...payload,
              paymentSessionId: json.sessionId,
            })
          );
        }
        if (json?.url) {
          window.location.href = json.url as string;
          return;
        }
        throw new Error("Missing payment session URL");
      }

      const res = await fetch("/api/scheduling/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgId,
          meetingTypeId: selectedMeetingTypeId,
          mode: selectedMode,
          startLocal: selectedSlot.startLocal,
          tz: resolvedTz,
          notes,
          ...staffPayload,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = json?.details
          ? `${json?.error ?? copy.errors.bookingFailed} ${json.details}`
          : json?.error ?? copy.errors.bookingFailed;
        setBookingError(message);
        toast.error(message);
        return;
      }

      if (json?.timezoneNotice) {
        toast.message(json.timezoneNotice);
      }

      const bookingStatus = String(json?.appointment?.status ?? "pending");

      setBookingSummary({
        slot: selectedSlot,
        meetingTypeId: selectedMeetingTypeId,
        displayTz,
        mode: (json?.appointment?.mode as MeetingMode) ?? selectedMode,
        status: bookingStatus,
        meetingLink: json?.meetingLink ?? null,
        payment: json?.payment
          ? {
              status: json.payment.status,
              priceCents: json.payment.priceCents ?? null,
              currency: json.payment.currency ?? null,
              policy: json?.policies?.paymentPolicy ?? effectivePaymentPolicy,
            }
          : null,
      });
      setSelectedSlot(null);
      toast.success(
        bookingStatus === "pending"
          ? copy.errors.bookingPending
          : copy.errors.bookingConfirmed
      );
    } catch {
      setBookingError(copy.errors.bookingFailed);
      toast.error(copy.errors.bookingFailed);
    } finally {
      setBookingSubmitting(false);
    }
  }

  const hero = (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {copy.heroEyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-gray-900 dark:text-white sm:text-4xl">
          {entryCopy.heroTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300 sm:text-base">
          {entryCopy.heroBody}
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            onClick={() => {
              void signIn(undefined, { callbackUrl: freeAuditHref });
            }}
          >
            {entryCopy.freeAuditCta}
          </Button>
        </div>
        <p className="mt-5 text-sm leading-7 text-gray-500 dark:text-gray-400">
          {entryCopy.heroSupport}
        </p>
      </div>
    </div>
  );

  const schedulingUnavailable = Boolean(availabilityError || !orgId);
  const schedulingUnavailableMessage = copy.unavailableFallback;

  if (isSessionLoading) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/85 p-6 text-sm text-gray-600 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-300">
        {copy.status.loading}
      </div>
    );
  }

  if (schedulingUnavailable) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-slate-200/80 bg-white/88 p-8 text-center shadow-[0_18px_50px_-40px_rgba(15,23,42,0.28)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/72 sm:p-10">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-accent-400">
            <i className="ri-information-line text-2xl" />
          </span>
          <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
            {copy.unavailableEyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-gray-900 dark:text-white">
            {copy.unavailableTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300 sm:text-base">
            {schedulingUnavailableMessage}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" asChild>
              <Link href="/contact#free-audit-form">{copy.unavailablePrimary}</Link>
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/contact">{copy.unavailableSecondary}</Link>
            </Button>
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-xs leading-6 text-slate-500 dark:text-slate-400">
            {copy.unavailableNote}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="space-y-8">
        {hero}

        <div
          id="booking-paths"
          className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]"
        >
          <div className="rounded-3xl border border-primary-200/80 bg-primary-50/80 p-5 shadow-[0_18px_50px_-40px_rgba(14,66,126,0.35)] backdrop-blur dark:border-primary-400/30 dark:bg-primary-500/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-accent-400">
                {entryCopy.freeAuditEyebrow}
              </p>
              <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                {entryCopy.recommendedBadge}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-gray-900 dark:text-white">
              {entryCopy.freeAuditTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {entryCopy.freeAuditBody}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm leading-6 text-gray-700 dark:text-gray-200">
              {entryCopy.freeAuditCardBullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <i className="ri-check-line mt-1 text-primary-600 dark:text-accent-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button
                type="button"
                onClick={() => {
                  void signIn(undefined, { callbackUrl: freeAuditHref });
                }}
              >
                {entryCopy.freeAuditCta}
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-slate-50/65 p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/55">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-accent-400">
              {entryCopy.optionsEyebrow}
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-gray-900 dark:text-white">
              {entryCopy.optionsTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {entryCopy.optionsBody}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm leading-6 text-gray-700 dark:text-gray-200">
              {entryCopy.directSessionBullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <i className="ri-check-line mt-1 text-primary-600 dark:text-accent-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button type="button" variant="outline" asChild>
                <a href="#meeting-options">{entryCopy.optionsCta}</a>
              </Button>
            </div>
          </div>
        </div>

        <div
          id="meeting-options"
          className="rounded-3xl border border-slate-200/80 bg-slate-50/55 p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/55 sm:p-6"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {entryCopy.directSectionLead}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-gray-900 dark:text-white">
              {entryCopy.optionsSectionTitle}
            </h2>
          </div>

          {requestedMeetingTypeMissing && (
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-4 text-left text-amber-900 backdrop-blur">
              <p className="text-sm font-semibold">
                {entryCopy.requestedMissingTitle}
              </p>
              <p className="mt-2 text-sm leading-7">
                {entryCopy.requestedMissingBody}
              </p>
            </div>
          )}

          {meetingTypesLoading && (
            <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-300">
              {copy.status.meetingTypes}
            </div>
          )}

          {meetingTypesError && (
            <div className="mx-auto mt-8 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {meetingTypesError}
            </div>
          )}

          {!meetingTypesLoading &&
            !meetingTypesError &&
            publicDirectMeetingTypes.length === 0 && (
            <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-300">
              {entryCopy.noDirectOptions}
            </div>
          )}

          {!meetingTypesLoading &&
            !meetingTypesError &&
            publicDirectMeetingTypes.length > 0 && (
            <div className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {publicDirectMeetingTypes.map((item) => {
                  const optionHref = buildSchedulingHref({
                    meetingTypeKey: item.key,
                    tz: displayTz || initialTz,
                  });
                  const selected = item.id === selectedMeetingTypeId;

                  return (
                    <PublicMeetingTypeCard
                      key={item.id}
                      item={item}
                      selected={selected}
                      locale={locale}
                      copy={copy}
                      entryCopy={entryCopy}
                      href={optionHref}
                      onSelect={() => {
                        void signIn(undefined, { callbackUrl: optionHref });
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          id="continue-booking"
          className="rounded-3xl border border-primary-200/80 bg-primary-50/75 p-5 shadow-[0_18px_50px_-40px_rgba(14,66,126,0.28)] backdrop-blur dark:border-primary-400/25 dark:bg-primary-500/10 sm:p-6"
        >
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="rounded-2xl border border-primary-200/80 bg-white/80 p-4 dark:border-primary-400/20 dark:bg-slate-950/30">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-accent-400">
                {entryCopy.selectedLabel}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-gray-900 dark:text-white">
                {freeAuditSelected
                  ? entryCopy.freeAuditTitle
                  : selectedPublicDirectMeetingType
                    ? normalizeMeetingTitle(
                        selectedPublicDirectMeetingType.title,
                        selectedPublicDirectMeetingType.durationMin
                      )
                    : entryCopy.freeAuditTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {entryCopy.continueBody}
              </p>
            </div>

            <div className="rounded-2xl border border-primary-300/80 bg-primary-600 p-4 text-white shadow-sm dark:border-primary-400/30 dark:bg-primary-500/20">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() =>
                  signIn(undefined, { callbackUrl: signInCallbackUrl })
                }
              >
                {copy.guest.primaryCta}
              </Button>
              <div className="mt-4 text-center text-sm">
                <Link
                  href="/contact#free-audit-form"
                  className="font-medium text-white/90 underline-offset-4 hover:underline"
                >
                  {copy.guest.secondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <Stepper
          steps={[
            {
              id: "1",
              label: copy.stepLabels.type,
              isActive: activeStep === 1,
            },
            {
              id: "2",
              label: copy.stepLabels.mode,
              isActive: activeStep === 2,
            },
            {
              id: "3",
              label: copy.stepLabels.profile,
              isActive: activeStep === 3,
            },
            {
              id: "4",
              label: copy.stepLabels.time,
              isActive: activeStep === 4,
            },
            {
              id: "5",
              label: copy.stepLabels.confirm,
              isActive: activeStep === 5,
            },
          ]}
        />
      </div>

      {activeStep === 1 && (
        <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {copy.step1.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {copy.step1.body}
              </p>
            </div>
          </div>

          {!isAuthed ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              <div className="space-y-1">
                <span className="block">
                  {copy.step1.signIn}
                </span>
                <span className="block text-xs text-amber-800">
                  {copy.bridge.guestNote}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    signIn(undefined, { callbackUrl: "/scheduling" })
                  }
                >
                  {copy.buttons.signIn}
                </Button>
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href="/contact#free-audit-form">{copy.buttons.freeAudit}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {meetingTypesLoading && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  {copy.status.meetingTypes}
                </div>
              )}

              {meetingTypesError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {meetingTypesError}
                </div>
              )}

              {!meetingTypesLoading &&
                !meetingTypesError &&
                meetingTypes.length === 0 && (
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    {copy.status.noMeetingTypes}
                  </div>
                )}

                {requestedMeetingTypeMissing && (
                  <div className="mt-4 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 backdrop-blur">
                    <p className="font-semibold">{entryCopy.requestedMissingTitle}</p>
                    <p className="mt-1 leading-7">
                      {entryCopy.requestedMissingBody}
                    </p>
                  </div>
                )}

                {meetingTypes.length > 0 && (
                  <>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {meetingTypes.map((item) => {
                        const selected = item.id === selectedMeetingTypeId;

                        return (
                          <MeetingTypeCard
                            key={item.id}
                            item={item}
                            selected={selected}
                            locale={locale}
                            copy={copy}
                            onSelect={() => setSelectedMeetingTypeId(item.id)}
                            footer={
                              selected ? (
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                                  {entryCopy.selectedLabel}
                                </span>
                              ) : null
                            }
                          />
                        );
                      })}
                    </div>

                  </>
                )}
            </>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" disabled>
              {copy.buttons.back}
            </Button>
            <Button
              type="button"
              onClick={() => setActiveStep(2)}
              disabled={!canAdvanceStep[1]}
            >
              {copy.buttons.next}
            </Button>
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <div id="step-2" className="mb-6" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {copy.step2.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {copy.step2.body}
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {selectedModeLabel}
            </span>
          </div>

          {!isAuthed ? (
            <div className="mt-4 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 backdrop-blur">
              {copy.step2.signIn}
            </div>
          ) : (
            <>
              {!canProceedToMode && (
                <div className="mt-4 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 backdrop-blur">
                  {copy.step2.unlock}
                </div>
              )}
              {canProceedToMode && selectedMeetingType && (
                <div className="mt-4 rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                        {copy.step2.availableModes}
                      </p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {copy.step2.basedOn} "
                        {normalizeMeetingTitle(
                          selectedMeetingType.title,
                          selectedMeetingType.durationMin ?? 60
                        )}
                        ".
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedMeetingType.modes ?? []).length === 0 && (
                      <span className="text-sm text-gray-500">
                        {copy.step2.noModes}
                      </span>
                    )}
                    {(selectedMeetingType.modes ?? []).map((mode) => {
                      const value = mode.mode;
                      const active = value === selectedMode;
                      const label =
                        mode.details?.label?.trim() ||
                        formatMeetingMode(value, copy);
                        const description = mode.details?.description?.trim();
                        const safeDescription = description
                          ? description.replace(/https?:\/\/\S+/g, "").trim()
                          : "";
                        return (
                        <button
                          key={mode.mode}
                          type="button"
                          onClick={() => setSelectedMode(value)}
                          className={[
                            "rounded-full border px-4 py-2 text-sm font-semibold transition backdrop-blur",
                            active
                              ? "border-primary-500 bg-gradient-to-r from-primary-600 to-indigo-600 text-white"
                              : "border-white/70 bg-white/80 text-gray-700 hover:border-primary-200 hover:bg-white",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {(selectedMeetingType.modes ?? []).some(
                    (mode) => mode.details?.description?.trim()
                  ) && (
                    <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                      {(selectedMeetingType.modes ?? []).map((mode) => {
                        const label =
                          mode.details?.label?.trim() ||
                          formatMeetingMode(mode.mode, copy);
                          const description = mode.details?.description?.trim();
                          const safeDescription = description
                            ? description.replace(/https?:\/\/\S+/g, "").trim()
                            : "";
                          if (!safeDescription) return null;
                          return (
                            <div key={`${mode.mode}-details`}>
                              <p className="font-semibold text-gray-700 dark:text-gray-200">
                                {label}
                              </p>
                              {safeDescription && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {safeDescription}
                                </p>
                              )}
                            </div>
                          );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setActiveStep(1)}>
              {copy.buttons.back}
            </Button>
            <Button
              type="button"
              onClick={() => setActiveStep(3)}
              disabled={!canAdvanceStep[2]}
            >
              {copy.buttons.next}
            </Button>
          </div>
        </div>
      )}

      {activeStep === 3 && (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {copy.step3.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {copy.step3.body}
                  </p>
                </div>
                {profile && !showForm && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(true)}
                  >
                    {copy.buttons.editDetails}
                  </Button>
                )}
              </div>

              {!canProceedToProfile && (
                <div className="mt-4 rounded-lg border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 backdrop-blur">
                  {copy.step3.unlock}
                </div>
              )}

              {canProceedToProfile && profileLoading && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  {copy.status.profile}
                </div>
              )}

              {canProceedToProfile && profileError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {profileError}
                </div>
              )}

              {canProceedToProfile && showForm && (
                <form
                  className="mt-6 grid w-full gap-4 sm:grid-cols-2"
                  onSubmit={handleSaveProfile}
                >
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {copy.step3.fullName}
                    </label>
                    <Input
                      value={form.fullName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          fullName: value,
                        }));
                        setFieldErrors((prev) =>
                          prev.fullName ? { ...prev, fullName: undefined } : prev
                        );
                      }}
                      required
                    />
                    {fieldErrors.fullName && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {copy.step3.phone}
                    </label>
                    <SearchablePhoneInput
                      value={form.phone}
                      onChange={(phone) => {
                        setForm((prev) => ({ ...prev, phone }));
                        setFieldErrors((prev) =>
                          prev.phone ? { ...prev, phone: undefined } : prev
                        );
                      }}
                      defaultCountry="lu"
                      placeholder={copy.step3.phonePlaceholder}
                      required
                      invalid={!form.phone || !isPhoneValid(form.phone)}
                      inputContainerClassName="shadow-none focus-within:ring-0"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {copy.step3.phoneHint}
                    </p>
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {copy.step3.timezone}
                    </label>
                    <div className="mt-1">
                      <TimezonePicker
                        value={form.timezone}
                        onChange={(next) => {
                          setForm((prev) => ({
                            ...prev,
                            timezone: next,
                          }));
                          setFieldErrors((prev) =>
                            prev.timezone ? { ...prev, timezone: undefined } : prev
                          );
                        }}
                        options={timezones}
                        searchPlaceholder={copy.timezonePicker.search}
                        emptyLabel={copy.timezonePicker.empty}
                        buttonClassName="w-full"
                      />
                    </div>
                    {fieldErrors.timezone && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.timezone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {copy.step3.company}
                    </label>
                    <Input
                      value={form.company}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          company: value,
                        }));
                        setFieldErrors((prev) =>
                          prev.company ? { ...prev, company: undefined } : prev
                        );
                      }}
                    />
                    {fieldErrors.company && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.company}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {copy.step3.role}
                    </label>
                    <Input
                      value={form.companyRole}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          companyRole: value,
                        }));
                        setFieldErrors((prev) =>
                          prev.companyRole
                            ? { ...prev, companyRole: undefined }
                            : prev
                        );
                      }}
                      placeholder={copy.step3.rolePlaceholder}
                    />
                    {fieldErrors.companyRole && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.companyRole}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2 grid items-center gap-3 sm:grid-cols-[1fr_auto]">
                    {isProfileIncomplete ? (
                      <p className="text-sm text-gray-500">
                        {copy.step3.incomplete}
                      </p>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        type="submit"
                        disabled={saving || isProfileIncomplete}
                        className="h-11 min-w-[160px] rounded-full bg-primary-500 px-6 font-semibold text-white shadow-md shadow-primary-200/60 transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none dark:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
                      >
                        {saving ? copy.buttons.saving : copy.buttons.saveProfile}
                      </Button>
                      {profile && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowForm(false)}
                        >
                          {copy.buttons.cancel}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {canProceedToProfile && !showForm && profile && (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-3 text-sm text-gray-700 dark:text-gray-200 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/70 bg-white/80 p-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                        {copy.step3.contact}
                      </p>
                      <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                        {profile.fullName}
                      </p>
                      <p>{profile.phone}</p>
                      {profile.company && (
                        <p className="mt-1 text-gray-600 dark:text-gray-300">
                          {profile.company}
                          {profile.companyRole
                            ? ` · ${profile.companyRole}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-white/70 bg-white/80 p-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                        {copy.step3.timezoneCard}
                      </p>
                      <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                        {profile.timezone}
                      </p>
                      <p className="mt-1 text-gray-600 dark:text-gray-300">
                        {copy.step3.timezoneHint}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 backdrop-blur">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      {copy.step3.confirm}
                    </span>
                  </label>
                </div>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => setActiveStep(2)}>
                  {copy.buttons.back}
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  disabled={!canAdvanceStep[3]}
                >
                  {copy.buttons.next}
                </Button>
              </div>
            </div>
          </div>
        )}

      {activeStep === 5 && (
        <div className="space-y-4">
          {selectedSlot || bookingSummary ? (
            <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/80 px-5 py-4 text-emerald-900 shadow-[0_18px_45px_-40px_rgba(16,185,129,0.45)] backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {copy.step5.title}
                  </h3>
                  <p className="text-sm text-emerald-800">
                    {copy.step5.body}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedSlot(null);
                    setBookingSummary(null);
                    setActiveStep(1);
                  }}
                >
                  {copy.buttons.changeMeetingType}
                </Button>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200/70 bg-white/80 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                    {copy.step5.meeting}
                  </p>
                  <p className="mt-2 font-semibold text-emerald-900">
                    {normalizeMeetingTitle(
                      selectedMeetingType?.title ?? copy.step5.sessionFallback,
                      selectedMeetingType?.durationMin ?? 60
                    )}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {selectedMeetingType?.durationMin ?? 60} min
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    {selectedModeLabel}
                  </p>
                  {selectedMode === "phone" && profile?.phone && (
                    <p className="mt-2 text-xs text-emerald-700">
                      {copy.step5.phoneCallTo}: {profile.phone}
                    </p>
                  )}
                  {selectedMode !== "phone" &&
                    selectedMode !== "in_person" &&
                    bookingSummary?.meetingLink &&
                    bookingSummary.status === "confirmed" && (
                      <a
                        className="mt-2 inline-block text-xs text-emerald-700 underline"
                        href={bookingSummary.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.calendarText.meetingLinkPrefix}
                      </a>
                    )}
                  {selectedMode !== "phone" &&
                    selectedMode !== "in_person" &&
                    (bookingSummary?.status ?? "pending") !== "confirmed" && (
                      <p className="mt-2 text-xs text-emerald-700">
                        {copy.step5.meetingLinkLater}
                      </p>
                    )}
                </div>
                <div className="rounded-xl border border-emerald-200/70 bg-white/80 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                    {copy.step5.time}
                  </p>
                  <p className="mt-2 font-semibold text-emerald-900">
                    {DateTime.fromISO(
                      (bookingSummary?.slot ?? selectedSlot)?.startUtc ?? ""
                    )
                      .setZone(displayTz)
                      .setLocale(locale)
                      .toFormat("ccc, LLL dd · HH:mm")}
                    {" - "}
                    {DateTime.fromISO(
                      (bookingSummary?.slot ?? selectedSlot)?.endUtc ?? ""
                    )
                      .setZone(displayTz)
                      .setLocale(locale)
                      .toFormat("HH:mm")}
                  </p>
                  <p className="text-xs text-emerald-700">{displayTz}</p>
                </div>
                <div className="rounded-xl border border-emerald-200/70 bg-white/80 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                    {copy.step5.booker}
                  </p>
                  <p className="mt-2 font-semibold text-emerald-900">
                    {profile?.fullName ?? "—"}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {profile?.phone ?? "—"}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {profile?.company
                      ? `${profile.company} · ${profile.companyRole || ""}`
                      : copy.step5.personalBooking}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200/70 bg-white/80 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                    {copy.step5.notes}
                  </p>
                  <p className="mt-2 text-sm text-emerald-900">
                    {meetingNotes.trim() || "—"}
                  </p>
                  <p className="mt-2 text-xs text-emerald-700">
                    {copy.step5.preferredTimezone}: {profile?.timezone ?? "—"}
                  </p>
                </div>
              </div>

              {paymentRequiredByPolicy && (
                <div className="mt-4 rounded-xl border border-emerald-200/70 bg-white/80 px-4 py-4 text-sm text-emerald-900 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                    {copy.step5.payment}
                  </p>
                  {missingPaymentConfig ? (
                    <div className="mt-2 rounded-lg border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-amber-900 backdrop-blur">
                      {copy.errors.missingPaidConfig}
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-sm">
                        {paymentPriceLabel
                          ? `${paymentPriceLabel} ${copy.step1.required}`
                          : copy.step5.paymentRequired}
                      </p>
                      {convertedPriceLabel && (
                        <p className="mt-1 text-xs text-emerald-700">
                          ≈ {convertedPriceLabel}
                        </p>
                      )}
                      <p className="text-xs text-emerald-700">{copy.step5.paid}</p>

                      {!bookingSummary && requiresCheckout && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-emerald-700">
                            {copy.step5.checkoutHint}
                          </p>
                          <p className="text-xs text-emerald-700">
                            {copy.step5.approvalHint}
                          </p>
                          {paymentUrl && (
                            <p className="text-xs text-emerald-700">
                              {copy.step5.paymentLinkHint}
                            </p>
                          )}
                        </div>
                      )}
                      {bookingSummary?.payment && (
                        <p className="mt-3 text-xs text-emerald-700">
                          {copy.step5.paymentStatus}: {bookingSummary.payment.status}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {bookingError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {bookingError}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {bookingSummary ? (
                  <Button type="button" variant="outline" asChild>
                    <Link href={myBookingsHref}>{copy.buttons.viewBookings}</Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={
                      !selectedSlot ||
                      bookingSubmitting ||
                      missingPaymentConfig ||
                      !isAuthed ||
                      !meetingNotesValid
                    }
                  >
                    {bookingSubmitting
                      ? copy.buttons.booking
                      : !isAuthed
                      ? copy.buttons.signInToBook
                      : requiresCheckout
                      ? copy.buttons.proceedToPayment
                      : copy.buttons.confirmBooking}
                  </Button>
                )}
                {bookingSummary && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const title = normalizeMeetingTitle(
                          selectedMeetingType?.title ??
                            copy.calendarText.meetingWithLuxAi,
                          selectedMeetingType?.durationMin ?? 60
                        );
                        const details = `${copy.calendarText.meetingWithLuxAi}${
                          meetingNotes.trim()
                            ? `\n\n${copy.calendarText.notesPrefix}: ${meetingNotes.trim()}`
                            : ""
                        }`;
                        const ics = buildIcsContent({
                          title,
                          description: details,
                          startUtc: bookingSummary.slot.startUtc,
                          endUtc: bookingSummary.slot.endUtc,
                        });
                        const blob = new Blob([ics], {
                          type: "text/calendar;charset=utf-8",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = copy.calendarText.fileName;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      {copy.buttons.downloadIcs}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link
                        href={buildGoogleCalendarUrl({
                          title: `${normalizeMeetingTitle(
                            selectedMeetingType?.title ??
                              copy.calendarText.meetingWithLuxAi,
                            selectedMeetingType?.durationMin ?? 60
                          )} · ${selectedModeLabel}`,
                          details: [
                            `${copy.calendarText.modePrefix}: ${selectedModeLabel}`,
                            bookingSummary?.meetingLink &&
                            bookingSummary.status === "confirmed"
                              ? `${copy.calendarText.meetingLinkPrefix}: ${bookingSummary.meetingLink}`
                              : selectedMode === "phone"
                              ? `${copy.calendarText.phonePrefix}: ${profile?.phone ?? copy.calendarText.phoneFallback}`
                              : "",
                            meetingNotes.trim()
                              ? `${copy.calendarText.notesPrefix}: ${meetingNotes.trim()}`
                              : copy.calendarText.meetingWithLuxAi,
                          ]
                            .filter(Boolean)
                            .join("\n"),
                          startUtc: bookingSummary.slot.startUtc,
                          endUtc: bookingSummary.slot.endUtc,
                        })}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.buttons.addToGoogleCalendar}
                      </Link>
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBookingSummary(null);
                    setSelectedSlot(null);
                    setSelectedMeetingTypeId("");
                    setSelectedMode("");
                    setMeetingNotes("");
                    setMeetingNotesTouched(false);
                    setBookingError(null);
                    setActiveStep(1);
                  }}
                >
                  {copy.buttons.bookAnotherTime}
                </Button>
                <span className="text-xs text-emerald-800">
                  {copy.step5.notifications}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 backdrop-blur">
              {copy.step5.selectTimeNotice}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setActiveStep(4)}>
              {copy.buttons.back}
            </Button>
          </div>
        </div>
      )}



      {activeStep === 4 && (
        <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/70 bg-white/85 px-4 py-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {copy.step4.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {copy.step4.body}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-gray-600 dark:text-gray-300">
                    {copy.step4.displayTimezone}
                  </label>
                  <TimezonePicker
                    value={displayTz}
                    onChange={(next) => {
                      setDisplayTz(next);
                      setDisplayTzLocked(true);
                    }}
                    options={timezones}
                    searchPlaceholder={copy.timezonePicker.search}
                    emptyLabel={copy.timezonePicker.empty}
                    buttonClassName="w-full min-w-0 sm:w-auto sm:min-w-[220px]"
                    menuClassName="w-[calc(100vw-2rem)] max-w-[280px] sm:w-[280px]"
                  />
                </div>
              </div>

              {allowedCurrencies.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-gray-700 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
                  <span className="font-medium">{copy.step4.displayCurrency}</span>
                  <select
                    className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60 dark:bg-slate-900/70"
                    value={displayCurrency ?? ""}
                    onChange={(e) => setDisplayCurrency(e.target.value)}
                  >
                    {allowedCurrencies.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  {ratesUpdatedAt && (
                    <span className="text-xs text-gray-500">
                      {copy.step4.ratesUpdated}:{" "}
                      {DateTime.fromISO(ratesUpdatedAt)
                        .setLocale(locale)
                        .toFormat("LLL dd · HH:mm")}
                    </span>
                  )}
                </div>
              )}

              {!selectedMeetingTypeId && (
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 backdrop-blur">
                  {copy.step4.selectType}
                </div>
              )}
              {selectedMeetingTypeId && !selectedMode && (
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 backdrop-blur">
                  {copy.step4.selectMode}
                </div>
              )}
              {selectedMeetingTypeId && selectedMode && (!profile || showForm) && (
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 backdrop-blur">
                  {copy.step4.completeProfile}
                </div>
              )}
              {selectedMeetingTypeId &&
                selectedMode &&
                profile &&
                !showForm &&
                !confirmed && (
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 backdrop-blur">
                  {copy.step4.confirmProfile}
                </div>
              )}

              {canProceedToTime && (
                <AvailabilityCalendar
                  orgId={orgId}
                  meetingTypeId={selectedMeetingTypeId}
                  staffUserId={staffUserId || undefined}
                  tz={profile?.timezone}
                  displayTz={displayTz}
                  canBook={confirmed}
                  selectedSlot={selectedSlot}
                  onSelectSlot={(slot) => {
                    const next = {
                      startUtc: slot.startUtc,
                      endUtc: slot.endUtc,
                      startLocal: slot.startLocal,
                      endLocal: slot.endLocal,
                      timezone: slot.timezone,
                      staffUserId: slot.staffUserId ?? null,
                    };
                    setSelectedSlot((prev) => {
                      if (
                        prev &&
                        prev.startUtc === next.startUtc &&
                        prev.endUtc === next.endUtc &&
                        (prev.staffUserId ?? null) === (next.staffUserId ?? null) &&
                        prev.timezone === next.timezone
                      ) {
                        return null;
                      }
                      return next;
                    });
                  }}
                />
              )}

              {canProceedToTime && (
                <div className="mt-4 grid gap-4">
                  <button
                    type="button"
                    disabled={!hasSelectedSlot}
                    onClick={() => {
                      if (!hasSelectedSlot) return;
                      setSelectedSlot(null);
                    }}
                    className={[
                      "rounded-2xl border px-4 py-3 text-left text-sm shadow-sm backdrop-blur transition",
                      hasSelectedSlot
                        ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/80 cursor-pointer"
                        : "border-slate-200/80 bg-slate-50/70 text-slate-600 cursor-default",
                    ].join(" ")}
                    aria-disabled={!hasSelectedSlot}
                  >
                    <p
                      className={[
                        "text-xs font-semibold uppercase tracking-[0.25em]",
                        hasSelectedSlot ? "text-emerald-600" : "text-slate-500",
                      ].join(" ")}
                    >
                      {copy.step4.selectedTime}
                    </p>
                    <p
                      className={[
                        "mt-2 text-base font-semibold",
                        hasSelectedSlot ? "text-emerald-900" : "text-slate-600",
                      ].join(" ")}
                    >
                      {hasSelectedSlot
                        ? selectedSlotLabel ?? copy.step4.timeSelected
                        : copy.step4.noTimeSelected}
                    </p>
                    <p
                      className={[
                        "text-xs",
                        hasSelectedSlot ? "text-emerald-700" : "text-slate-500",
                      ].join(" ")}
                    >
                      {hasSelectedSlot
                        ? displayTz
                        : `${copy.step4.pickSlotPrefix} ${displayTz}.`}
                    </p>
                    {hasSelectedSlot && (
                      <p className="mt-1 text-xs text-emerald-700">
                        {copy.step4.clearSelection}
                      </p>
                    )}
                  </button>

                  <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-sm text-gray-700 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {copy.step4.notes}
                    </label>
                    <Textarea
                      value={meetingNotes}
                      onChange={(e) => {
                        setMeetingNotes(e.target.value);
                        if (!meetingNotesTouched) {
                          setMeetingNotesTouched(true);
                        }
                      }}
                      onBlur={() => setMeetingNotesTouched(true)}
                      className="mt-2 min-h-[140px]"
                      placeholder={copy.step4.notesPlaceholder}
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{copy.step4.notesUsage}</span>
                      <span>{meetingNotes.trim().length}/1000</span>
                    </div>
                    {meetingNotesError && (
                      <p className="mt-2 text-xs text-red-600">{meetingNotesError}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => setActiveStep(3)}>
                  {copy.buttons.back}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setMeetingNotesTouched(true);
                    if (!meetingNotesValid) return;
                    setActiveStep(5);
                  }}
                  disabled={!canAdvanceStep[4]}
                >
                  {copy.buttons.next}
                </Button>
              </div>
        </div>

      )}
      </div>
  );
}
