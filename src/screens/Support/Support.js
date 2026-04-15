import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageSquare,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import AppDialog from '../../components/AppDialog';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import BackButtonHeader from '../../components/BackButtonHeader';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';

const FAQS = [
  {
    q: 'How do I reset my password?',
    a: 'Go to Forgot Password and enter your account email. We will send a secure reset link. If you do not see the email, check spam and try again.',
  },
  {
    q: 'Where can I update billing details or download invoices?',
    a: 'Navigate to your account billing area on web to update your payment method, manage plans, and access invoice history.',
  },
  {
    q: 'Why does market data look delayed or out of sync?',
    a: 'Most quotes are live, but some venues can be delayed. Verify your timezone and refresh the page or screen if values look stale.',
  },
  {
    q: 'How do I create price or planetary alerts?',
    a: 'Open the alert center and choose the trigger type you want, such as price above, price below, percent move, or a planetary timing window.',
  },
  {
    q: 'How can I contact support?',
    a: 'Use the support form on this screen or email pr@rajeevprakash.com. Typical support coverage is Monday to Friday during business hours.',
  },
];

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const extractSessionUser = (payload) => payload?.user || payload?.data?.user || payload?.session?.user || payload?.data || null;

const Support = ({ navigation }) => {
  const { authFetch, themeColors, user } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sessionUser, setSessionUser] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [deleteTicketId, setDeleteTicketId] = useState('');
  const authFetchRef = useRef(authFetch);

  useEffect(() => {
    authFetchRef.current = authFetch;
  }, [authFetch]);

  const loadSessionUser = useCallback(async () => {
    try {
      const res = await authFetchRef.current('/api/auth/session');
      const json = await safeJson(res);
      if (!res.ok) return null;
      const nextUser = extractSessionUser(json);
      setSessionUser(nextUser);
      return nextUser;
    } catch {
      return null;
    }
  }, []);

  const loadTickets = useCallback(
    async (existingSessionUser) => {
      setLoadingTickets(true);
      setError('');

      try {
        const resolvedUser = existingSessionUser || (await loadSessionUser());
        const userId = resolvedUser?.id || resolvedUser?._id;
        if (!userId) {
          setTickets([]);
          return;
        }

        const res = await authFetchRef.current(`/api/help/queries?user_id=${encodeURIComponent(userId)}`);
        if (res.status === 404) {
          setTickets([]);
          return;
        }

        const json = await safeJson(res);
        if (!res.ok) {
          throw new Error(json?.message || `Failed to load support messages (${res.status})`);
        }

        const payload = json?.data || json;
        setTickets(Array.isArray(payload) ? payload : []);
      } catch (nextError) {
        setError(nextError?.message || 'Failed to load support messages.');
      } finally {
        setLoadingTickets(false);
      }
    },
    [loadSessionUser],
  );

  useEffect(() => {
    let active = true;

    (async () => {
      const nextUser = await loadSessionUser();
      if (!active) return;
      await loadTickets(nextUser);
    })();

    return () => {
      active = false;
    };
  }, [loadSessionUser, loadTickets]);

  const submitSupport = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError('Please describe your issue before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const resolvedUser = sessionUser || (await loadSessionUser());
      const userId = resolvedUser?.id || resolvedUser?._id;
      const name = resolvedUser?.name || user?.displayName || user?.name || '';
      const email = resolvedUser?.email || user?.email || '';

      if (!userId || !name || !email) {
        throw new Error('Your account details are incomplete. Please sign in again.');
      }

      const res = await authFetch('/api/help/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name,
          email: String(email).toLowerCase(),
          message: trimmedMessage,
        }),
      });

      const json = await safeJson(res);
      if (!res.ok) {
        throw new Error(json?.message || `Failed to submit support request (${res.status})`);
      }

      setNotice('Your support message was submitted successfully.');
      setMessage('');
      await loadTickets(resolvedUser);
    } catch (nextError) {
      setError(nextError?.message || 'Failed to submit support request.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTicket = async (ticketId) => {
    if (!ticketId) return;

    setDeletingId(ticketId);
    setError('');
    setNotice('');

    try {
      let res = await authFetch(`/api/help/queries?id=${encodeURIComponent(ticketId)}`, {
        method: 'DELETE',
      });

      if (res.status === 404 || res.status === 405) {
        res = await authFetch(`/api/help/queries/${encodeURIComponent(ticketId)}`, {
          method: 'DELETE',
        });
      }

      const json = await safeJson(res);
      if (!res.ok) {
        throw new Error(json?.message || `Delete failed (${res.status})`);
      }

      setTickets((current) => current.filter((item) => item?._id !== ticketId));
      setNotice('Support message deleted successfully.');
    } catch (nextError) {
      setError(nextError?.message || 'Failed to delete support message.');
    } finally {
      setDeletingId('');
    }
  };

  const confirmDeleteTicket = (ticketId) => {
    setDeleteTicketId(ticketId || '');
  };

  return (
    <View style={styles.screen}>
      <GradientBackground>
        <BackButtonHeader colors={themeColors} onPress={() => navigation.goBack()} containerStyle={styles.header} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorBanner}>
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          ) : null}

          {notice ? (
            <View style={styles.okBanner}>
              <AppText style={styles.okText}>{notice}</AppText>
            </View>
          ) : null}

          <View style={styles.heroCard}>
            <View style={styles.heroGlowTop} />
            <View style={styles.heroGlowBottom} />
            <View style={styles.heroIcon}>
              <LifeBuoy size={20} color={themeColors.accent} />
            </View>
            <View style={styles.heroTextWrap}>
              <View style={styles.heroBadge}>
                <AppText style={styles.heroBadgeText}>Support & Help</AppText>
              </View>
              <AppText style={styles.heroTitle}>Fast help for account, billing, alerts, and market workflow issues.</AppText>
              <AppText style={styles.heroBody}>
                Get quick answers for login, billing, market data, alerts, and account issues, or send a message to support directly from the app.
              </AppText>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <AppText style={styles.summaryLabel}>Response Time</AppText>
              <AppText style={styles.summaryValue}>Usually within 1 business day</AppText>
            </View>
            <View style={styles.summaryPill}>
              <AppText style={styles.summaryLabel}>Coverage</AppText>
              <AppText style={styles.summaryValue}>Account, data, alerts, billing</AppText>
            </View>
            <View style={styles.summaryPill}>
              <AppText style={styles.summaryLabel}>Support Style</AppText>
              <AppText style={styles.summaryValue}>Profile-linked and privacy-aware</AppText>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Mail size={16} color={themeColors.accent} />
              </View>
              <View style={styles.cardHeaderTextWrap}>
                <AppText style={styles.cardEyebrow}>Contact Options</AppText>
                <AppText style={styles.cardTitle}>Reach us</AppText>
              </View>
            </View>
            <AppText style={styles.cardDescription}>
              Use the channel that fits your issue. For account-specific help, submit the form below so support can match it to your profile.
            </AppText>
            <View style={styles.contactRow}>
              <View style={styles.contactItem}>
                <Mail size={16} color={themeColors.accent} />
                <AppText style={styles.contactText}>pr@rajeevprakash.com</AppText>
              </View>
              <View style={styles.contactItem}>
                <MessageSquare size={16} color={themeColors.accent} />
                <AppText style={styles.contactText}>Reply target: 1 business day</AppText>
              </View>
              <View style={styles.contactItem}>
                <ShieldCheck size={16} color={themeColors.accent} />
                <AppText style={styles.contactText}>Privacy-first support workflow</AppText>
              </View>
              <View style={styles.contactItem}>
                <Globe size={16} color={themeColors.accent} />
                <AppText style={styles.contactText}>Timezone-aware market support</AppText>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <HelpCircle size={16} color={themeColors.accent} />
              </View>
              <View style={styles.cardHeaderTextWrap}>
                <AppText style={styles.cardEyebrow}>Quick Answers</AppText>
                <AppText style={styles.cardTitle}>Frequently asked questions</AppText>
              </View>
            </View>

            {FAQS.map((item, index) => {
              const expanded = expandedFaq === index;
              return (
                <View key={item.q} style={[styles.faqRow, index === FAQS.length - 1 && styles.faqRowLast]}>
                  <Pressable style={styles.faqHeader} onPress={() => setExpandedFaq(expanded ? -1 : index)}>
                    <View style={styles.faqTitleWrap}>
                      <HelpCircle size={16} color={themeColors.accent} />
                      <AppText style={styles.faqQuestion}>{item.q}</AppText>
                    </View>
                    {expanded ? (
                      <ChevronUp size={16} color={themeColors.textMuted} />
                    ) : (
                      <ChevronDown size={16} color={themeColors.textMuted} />
                    )}
                  </Pressable>

                  {expanded ? <AppText style={styles.faqAnswer}>{item.a}</AppText> : null}
                </View>
              );
            })}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <MessageSquare size={16} color={themeColors.accent} />
              </View>
              <View style={styles.cardHeaderTextWrap}>
                <AppText style={styles.cardEyebrow}>Send a Request</AppText>
                <AppText style={styles.cardTitle}>Contact support</AppText>
              </View>
            </View>
            <AppText style={styles.cardDescription}>
              Your account name and email are used automatically. Describe the issue, the screen involved, and how to reproduce it.
            </AppText>

            <View style={styles.readOnlyField}>
              <AppText style={styles.readOnlyLabel}>Name</AppText>
              <AppText style={styles.readOnlyValue}>{sessionUser?.name || user?.displayName || user?.name || '—'}</AppText>
            </View>

            <View style={styles.readOnlyField}>
              <AppText style={styles.readOnlyLabel}>Email</AppText>
              <AppText style={styles.readOnlyValue}>{sessionUser?.email || user?.email || '—'}</AppText>
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>Message</AppText>
              <AppTextInput
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                style={styles.textArea}
                placeholder="Describe the issue, what you expected, and how to reproduce it."
                placeholderTextColor={themeColors.textMuted}
              />
            </View>

            <Pressable style={styles.primaryButton} onPress={submitSupport} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <LifeBuoy size={14} color="#FFFFFF" />}
              <AppText style={styles.primaryButtonText}>{submitting ? 'Submitting...' : 'Submit to support'}</AppText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <ShieldCheck size={16} color={themeColors.accent} />
              </View>
              <View style={styles.cardHeaderTextWrap}>
                <AppText style={styles.cardEyebrow}>History</AppText>
                <AppText style={styles.cardTitle}>Your support messages</AppText>
              </View>
            </View>

            {loadingTickets ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={themeColors.textPrimary} />
                <AppText style={styles.stateText}>Loading support history...</AppText>
              </View>
            ) : null}

            {!loadingTickets && !tickets.length ? (
              <View style={styles.centerState}>
                <AppText style={styles.stateText}>You have not submitted any support messages yet.</AppText>
              </View>
            ) : null}

            {!loadingTickets
              ? tickets.map((ticket) => {
                  const resolved = Boolean(ticket?.answer && String(ticket.answer).trim().length);
                  const isDeleting = deletingId === ticket?._id;

                  return (
                    <View key={ticket?._id || ticket?.createdAt} style={styles.ticketCard}>
                      <View style={styles.ticketHead}>
                        <View style={styles.ticketMeta}>
                          <AppText style={styles.ticketTime}>
                            {ticket?.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Unknown time'}
                          </AppText>
                          <View style={[styles.badge, resolved ? styles.badgeResolved : styles.badgePending]}>
                            <AppText style={[styles.badgeText, resolved ? styles.badgeTextResolved : styles.badgeTextPending]}>
                              {resolved ? 'Resolved' : 'Pending'}
                            </AppText>
                          </View>
                        </View>

                        <Pressable
                          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                          onPress={() => confirmDeleteTicket(ticket?._id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color={themeColors.negative} />
                          ) : (
                            <Trash2 size={15} color={themeColors.negative} />
                          )}
                        </Pressable>
                      </View>

                      <View style={styles.ticketBody}>
                        <View style={styles.ticketSection}>
                          <AppText style={styles.ticketSectionLabel}>Question</AppText>
                          <AppText style={styles.ticketSectionText}>{ticket?.message || '—'}</AppText>
                        </View>
                        <View style={styles.ticketSection}>
                          <AppText style={styles.ticketSectionLabel}>Answer</AppText>
                          <AppText style={styles.ticketSectionText}>
                            {resolved ? String(ticket.answer) : '-------'}
                          </AppText>
                        </View>
                      </View>
                    </View>
                  );
                })
              : null}
          </View>

          <View style={styles.footerCard}>
            <AppText style={styles.footerTitle}>Need privacy details too?</AppText>
            <AppText style={styles.footerBody}>
              Open the privacy page for a simple explanation of what data is collected, how it is used, and what controls you have.
            </AppText>
            <Pressable style={styles.footerButton} onPress={() => navigation.navigate('PrivacyPolicy')}>
              <AppText style={styles.footerButtonText}>Open privacy policy</AppText>
            </Pressable>
          </View>
        </ScrollView>

        <AppDialog
          visible={Boolean(deleteTicketId)}
          tone="danger"
          title="Delete Support Message"
          message="Do you want to delete this support message?"
          onRequestClose={() => setDeleteTicketId('')}
          actions={[
            {
              label: 'Cancel',
              variant: 'ghost',
              onPress: () => setDeleteTicketId(''),
            },
            {
              label: 'Delete',
              variant: 'danger',
              onPress: async () => {
                const targetId = deleteTicketId;
                setDeleteTicketId('');
                await deleteTicket(targetId);
              },
            },
          ]}
        />

        <BottomTabs navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      gap: 16,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 120,
      flexGrow: 1,
      gap: 16,
    },
    errorBanner: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(207, 63, 88, 0.35)',
      backgroundColor: 'rgba(207, 63, 88, 0.12)',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    errorText: {
      color: colors.negative,
      fontSize: 12,
    },
    okBanner: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(25, 158, 99, 0.35)',
      backgroundColor: 'rgba(25, 158, 99, 0.12)',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    okText: {
      color: colors.positive,
      fontSize: 12,
    },
    heroCard: {
      position: 'relative',
      overflow: 'hidden',
      marginTop: 8,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 22,
      gap: 14,
    },
    heroGlowTop: {
      position: 'absolute',
      top: -34,
      right: -20,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: colors.accent,
      opacity: 0.13,
    },
    heroGlowBottom: {
      position: 'absolute',
      bottom: -44,
      left: -18,
      width: 128,
      height: 128,
      borderRadius: 64,
      backgroundColor: colors.positive,
      opacity: 0.1,
    },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroTextWrap: {
      gap: 8,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    heroBadgeText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontFamily: 'NotoSans-SemiBold',
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 31,
      fontFamily: 'NotoSans-ExtraBold',
    },
    heroBody: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    summaryPill: {
      minWidth: '30%',
      flexGrow: 1,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      paddingHorizontal: 15,
      paddingVertical: 14,
      gap: 6,
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: 'NotoSans-Medium',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'NotoSans-SemiBold',
    },
    card: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 18,
      gap: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    cardHeaderIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardHeaderTextWrap: {
      flex: 1,
      gap: 3,
    },
    cardEyebrow: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: 'NotoSans-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      lineHeight: 23,
      fontFamily: 'NotoSans-ExtraBold',
    },
    cardDescription: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    contactRow: {
      gap: 10,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    contactText: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'NotoSans-Medium',
    },
    faqRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
      marginTop: 2,
      gap: 10,
    },
    faqRowLast: {
      paddingBottom: 2,
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    faqTitleWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    faqQuestion: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'NotoSans-SemiBold',
    },
    faqAnswer: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      paddingLeft: 26,
    },
    readOnlyField: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 11,
      gap: 4,
    },
    readOnlyLabel: {
      color: colors.textMuted,
      fontSize: 11,
    },
    readOnlyValue: {
      color: colors.textPrimary,
      fontSize: 13,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      color: colors.textPrimary,
      fontSize: 12,
      fontFamily: 'NotoSans-SemiBold',
    },
    textArea: {
      minHeight: 128,
      textAlignVertical: 'top',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      color: colors.textPrimary,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
    centerState: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
    },
    stateText: {
      color: colors.textMuted,
      fontSize: 12,
      textAlign: 'center',
    },
    ticketCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
    },
    ticketHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    ticketMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      flex: 1,
    },
    ticketTime: {
      color: colors.textMuted,
      fontSize: 11,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
    },
    badgeResolved: {
      borderColor: 'rgba(25, 158, 99, 0.35)',
      backgroundColor: 'rgba(25, 158, 99, 0.12)',
    },
    badgePending: {
      borderColor: 'rgba(194, 124, 26, 0.35)',
      backgroundColor: 'rgba(194, 124, 26, 0.12)',
    },
    badgeText: {
      fontSize: 10,
    },
    badgeTextResolved: {
      color: colors.positive,
    },
    badgeTextPending: {
      color: '#C27C1A',
    },
    deleteButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(207, 63, 88, 0.25)',
      backgroundColor: 'rgba(207, 63, 88, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonDisabled: {
      opacity: 0.65,
    },
    ticketBody: {
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    ticketSection: {
      gap: 4,
    },
    ticketSectionLabel: {
      color: colors.textMuted,
      fontSize: 11,
    },
    ticketSectionText: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 19,
    },
    footerCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 20,
      gap: 12,
      marginBottom: 12,
    },
    footerTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      lineHeight: 26,
      fontFamily: 'NotoSans-ExtraBold',
    },
    footerBody: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
    footerButton: {
      marginTop: 4,
      alignSelf: 'flex-start',
      minHeight: 46,
      borderRadius: 16,
      paddingHorizontal: 18,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
  });

export default Support;
