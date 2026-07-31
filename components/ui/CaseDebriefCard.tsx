import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type {
  CaseDebrief,
  CaseReviewSnapshot,
  ProtocolInsight,
  TreatmentReviewItem,
} from '@/types/models';

interface CaseDebriefCardProps {
  debrief: CaseDebrief;
  caseReview: CaseReviewSnapshot;
  insight?: ProtocolInsight;
}

export function CaseDebriefCard({ debrief, caseReview, insight }: CaseDebriefCardProps) {
  const hits = caseReview.treatmentReview.filter((t) => t.status === 'done');
  const misses = caseReview.treatmentReview.filter((t) => t.status === 'missed');
  const harms = caseReview.treatmentReview.filter((t) => t.status === 'harmful');

  return (
    <View style={styles.container}>
      <View style={styles.diagnosisBanner}>
        <Text style={styles.bannerLabel}>Actual Diagnosis</Text>
        <Text style={styles.bannerTitle}>{debrief.primaryCondition}</Text>
      </View>

      <View style={styles.protocolBanner}>
        <Text style={styles.protocolLabel}>Protocol</Text>
        <Text style={styles.protocolCode}>{caseReview.protocolCode}</Text>
        <Text style={styles.protocolName}>{caseReview.protocolName}</Text>
      </View>

      <ReviewSection title="Why this patient">
        <Text style={styles.sectionLead}>
          Clues from your assessment that point to {debrief.primaryCondition}:
        </Text>
        {caseReview.whyThisPatient.map((item) => (
          <ReviewLine key={item} icon="✓" tone="success" text={item} />
        ))}
        <Text style={[styles.sectionLead, styles.sectionLeadSpaced]}>
          {caseReview.protocolCode} recognition criteria:
        </Text>
        {caseReview.protocolCriteria.map((item) => (
          <ReviewLine key={item} icon="•" tone="muted" text={item} />
        ))}
      </ReviewSection>

      <ReviewSection title="Protocol playbook">
        <Text style={styles.sectionLead}>
          When this protocol applies, treat with:
        </Text>
        {caseReview.protocolInterventions.map((item) => (
          <ReviewLine key={item} icon="→" tone="accent" text={item} />
        ))}
      </ReviewSection>

      <ReviewSection title="Your call">
        <View style={styles.diagnosisRow}>
          <Text style={styles.diagnosisLabel}>Diagnosis</Text>
          <ReviewLine
            icon={caseReview.diagnosisReview.wasCorrect ? '✓' : '✗'}
            tone={caseReview.diagnosisReview.wasCorrect ? 'success' : 'error'}
            text={
              caseReview.diagnosisReview.wasCorrect
                ? `Nailed it — ${caseReview.diagnosisReview.correctAnswer}`
                : `You chose ${caseReview.diagnosisReview.youChose} → correct: ${caseReview.diagnosisReview.correctAnswer}`
            }
          />
        </View>

        {hits.length > 0 && (
          <>
            <Text style={styles.subsection}>On target</Text>
            {hits.map((item) => (
              <TreatmentReviewLine key={item.label} item={item} />
            ))}
          </>
        )}

        {misses.length > 0 && (
          <>
            <Text style={styles.subsection}>Missed</Text>
            {misses.map((item) => (
              <TreatmentReviewLine key={item.label} item={item} />
            ))}
          </>
        )}

        {harms.length > 0 && (
          <>
            <Text style={styles.subsection}>Avoid next time</Text>
            {harms.map((item) => (
              <TreatmentReviewLine key={item.label} item={item} />
            ))}
          </>
        )}

        {hits.length === 0 && misses.length === 0 && harms.length === 0 && (
          <Text style={styles.emptyReview}>No treatments logged on this call.</Text>
        )}
      </ReviewSection>

      {insight ? (
        <View style={styles.pearlBox}>
          <Text style={styles.pearlLabel}>Clinical pearl</Text>
          <Text style={styles.pearlTitle}>{insight.title}</Text>
          <Text style={styles.pearlBody}>{insight.body}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ReviewLine({
  icon,
  text,
  tone,
}: {
  icon: string;
  text: string;
  tone: 'success' | 'error' | 'accent' | 'muted';
}) {
  const iconColor =
    tone === 'success'
      ? theme.colors.success
      : tone === 'error'
        ? theme.colors.error
        : tone === 'accent'
          ? theme.colors.accentLight
          : theme.colors.textMuted;

  return (
    <View style={styles.lineRow}>
      <Text style={[styles.lineIcon, { color: iconColor }]}>{icon}</Text>
      <Text style={styles.lineText}>{text}</Text>
    </View>
  );
}

function TreatmentReviewLine({ item }: { item: TreatmentReviewItem }) {
  const config = {
    done: { icon: '✓', tone: 'success' as const, prefix: '' },
    missed: { icon: '○', tone: 'muted' as const, prefix: 'Missed — ' },
    harmful: { icon: '✗', tone: 'error' as const, prefix: '' },
    unnecessary: { icon: '−', tone: 'muted' as const, prefix: 'Unnecessary — ' },
  }[item.status];

  return (
    <ReviewLine
      icon={config.icon}
      tone={config.tone}
      text={`${config.prefix}${item.label}`}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  diagnosisBanner: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.emsBlue,
    padding: theme.spacing.md,
  },
  bannerLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bannerTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  protocolBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.emsBlue,
    padding: theme.spacing.md,
  },
  protocolLabel: {
    color: theme.colors.emsBlue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  protocolCode: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'SpaceMono',
    lineHeight: 24,
  },
  protocolName: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionBlock: {
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.emsBlue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  sectionLead: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: theme.spacing.xs,
  },
  sectionLeadSpaced: {
    marginTop: theme.spacing.sm,
  },
  subsection: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: theme.spacing.sm,
    marginBottom: 2,
  },
  diagnosisRow: {
    gap: 2,
  },
  diagnosisLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  lineIcon: {
    width: 18,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  lineText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },
  emptyReview: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  pearlBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.emsBlue,
    padding: theme.spacing.md,
  },
  pearlLabel: {
    color: theme.colors.emsBlue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pearlTitle: {
    color: theme.colors.accentLight,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  pearlBody: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
});
