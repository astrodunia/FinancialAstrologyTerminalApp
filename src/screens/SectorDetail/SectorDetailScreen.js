import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import AppText from '../../components/AppText';
import GradientBackground from '../../components/GradientBackground';
import { SLUG_TO_SECTOR } from '../../data/sectors/sectorConfig';

const API_HOST = 'http://10.0.2.2:4500';
const PAGE_SIZE = 25;
const sectorPageCache = new Map();

const buildSectorUrl = (sectorName, page = 1, pageSize = PAGE_SIZE) => {
  return `${API_HOST}/api/tagx/s/sectors/${encodeURIComponent(
    sectorName
  )}?page=${page}&pageSize=${pageSize}`;
};

const getCacheKey = (sectorName, page) => `${sectorName}::${page}`;

const formatCurrency = (n) => {
  if (typeof n !== 'number' || Number.isNaN(n)) return '-';

  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
};

const formatChangeText = (item) => {
  if (typeof item.changePct === 'number') {
    const sign = item.changePct > 0 ? '+' : '';
    return `${sign}${item.changePct.toFixed(2)}%`;
  }

  if (typeof item.change === 'number') {
    const sign = item.change > 0 ? '+' : '';
    return `${sign}${item.change.toFixed(2)}`;
  }

  return '-';
};

const goBackOrFallback = (navigation, fallbackScreen) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  navigation.navigate(fallbackScreen);
};

const SectorDetailScreen = ({ navigation, route }) => {
  const slug = route?.params?.slug || 'technology';

  const sector =
    SLUG_TO_SECTOR[slug] ||
    SLUG_TO_SECTOR.technology || {
      name: 'Tech',
      apiSectorName: 'Information Technology',
    };

  const sectorTitle = sector.name;
  const apiSectorName = sector.apiSectorName;

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState('');
  const rowsRef = useRef([]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    const controller = new AbortController();
    const cacheKey = getCacheKey(apiSectorName, page);
    const cachedPage = sectorPageCache.get(cacheKey);

    if (cachedPage) {
      setRows(cachedPage.rows);
      setTotalPages(cachedPage.totalPages);
      setTotal(cachedPage.total);
      setLoading(false);
      setPageLoading(false);
      setError('');
    } else if (rowsRef.current.length > 0) {
      setPageLoading(true);
    } else {
      setLoading(true);
    }

    const fetchData = async ({ prefetch = false, targetPage = page } = {}) => {
      try {
        const targetCacheKey = getCacheKey(apiSectorName, targetPage);
        if (sectorPageCache.has(targetCacheKey)) return;

        const url = buildSectorUrl(apiSectorName, targetPage, PAGE_SIZE);
        const res = await fetch(url, { signal: controller.signal });
        const json = await res.json();

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.message || 'Failed to load sector data');
        }

        const nextRows = Array.isArray(json?.data) ? json.data : [];
        const nextTotalPages = Number(json?.totalPages || 1);
        const nextTotal = Number(json?.total || 0);

        sectorPageCache.set(targetCacheKey, {
          rows: nextRows,
          totalPages: nextTotalPages,
          total: nextTotal,
        });

        if (prefetch) return;

        setRows(nextRows);
        setTotalPages(nextTotalPages);
        setTotal(nextTotal);
        setError('');

        const nextPage = targetPage + 1;
        if (nextPage <= nextTotalPages && !sectorPageCache.has(getCacheKey(apiSectorName, nextPage))) {
          fetchData({ prefetch: true, targetPage: nextPage }).catch(() => {});
        }
      } catch (e) {
        if (e?.name === 'AbortError') return;
        if (!prefetch) setError(e?.message || 'Failed to load sector data');
      } finally {
        if (!prefetch) {
          setLoading(false);
          setPageLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [apiSectorName, page]);

  const openTicker = (item) => {
    navigation.navigate('StockDetail', {
      ticker: item.symbol,
      companyName: item.name || item.symbol,
    });
  };

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              style={styles.backBtn}
              hitSlop={10}
              onPress={() => goBackOrFallback(navigation, 'Sectors')}
            >
              <ArrowLeft size={18} color="#344054" />
            </Pressable>

            <View style={styles.headerContent}>
              <AppText style={styles.headerTitle} weight="extraBold">
                {sectorTitle}
              </AppText>
              <AppText style={styles.headerSub}>Snapshot - Total tickers: {total}</AppText>
            </View>
          </View>

          {loading && rows.length === 0 ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="small" color="#2F7DFF" />
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {pageLoading ? (
                <View style={styles.inlineLoader}>
                  <ActivityIndicator size="small" color="#2F7DFF" />
                  <AppText style={styles.inlineLoaderText}>Loading page...</AppText>
                </View>
              ) : null}

              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <AppText style={[styles.headerCell, styles.symbolCol]}>Symbol</AppText>
                  <AppText style={[styles.headerCell, styles.priceCol, styles.numericHeaderCell]}>
                    Price
                  </AppText>
                  <AppText style={[styles.headerCell, styles.changeCol, styles.numericHeaderCell]}>
                    Change
                  </AppText>
                </View>

                {rows.map((item, index) => {
                  const isUp = typeof item.change === 'number' && item.change > 0;
                  const isDown = typeof item.change === 'number' && item.change < 0;

                  return (
                    <Pressable
                      key={item.symbol}
                      style={[styles.row, index !== rows.length - 1 && styles.rowBorder]}
                      onPress={() => openTicker(item)}
                    >
                      <View style={styles.symbolCol}>
                        <AppText style={styles.symbolText} weight="semiBold">
                          {item.symbol}
                        </AppText>
                        <AppText style={styles.companyText} numberOfLines={1}>
                          {item.name || item.symbol}
                        </AppText>
                      </View>

                      <View style={styles.priceCol}>
                        <AppText style={styles.priceText} weight="medium">
                          {formatCurrency(item.price)}
                        </AppText>
                      </View>

                      <View style={styles.changeCol}>
                        <View
                          style={[
                            styles.changePill,
                            isUp && styles.changePillUp,
                            isDown && styles.changePillDown,
                            !isUp && !isDown && styles.changePillFlat,
                          ]}
                        >
                          <AppText
                            style={[
                              styles.changePillText,
                              isUp && styles.changeTextUp,
                              isDown && styles.changeTextDown,
                              !isUp && !isDown && styles.changeTextFlat,
                            ]}
                            weight="semiBold"
                          >
                            {formatChangeText(item)}
                          </AppText>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.pagination}>
                <Pressable
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  disabled={page <= 1 || pageLoading}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <AppText style={styles.pageBtnText} weight="semiBold">
                    Prev
                  </AppText>
                </Pressable>

                <AppText style={styles.pageText}>
                  Page {page} / {totalPages}
                </AppText>

                <Pressable
                  style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                  disabled={page >= totalPages || pageLoading}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <AppText style={styles.pageBtnText} weight="semiBold">
                    Next
                  </AppText>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </GradientBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  screen: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
  },

  headerContent: {
    flex: 1,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  headerTitle: {
    fontSize: 20,
    color: '#101828',
  },

  headerSub: {
    fontSize: 13,
    color: '#667085',
    marginTop: 4,
  },

  content: {
    padding: 14,
    paddingBottom: 40,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },

  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },

  inlineLoaderText: {
    fontSize: 12,
    color: '#667085',
  },

  tableCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3EA',
    borderRadius: 18,
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EBF1',
  },

  headerCell: {
    fontSize: 12,
    color: '#8A94A6',
    letterSpacing: 0.2,
  },

  numericHeaderCell: {
    textAlign: 'right',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },

  symbolCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  priceCol: {
    width: 96,
    alignItems: 'flex-end',
    marginRight: 12,
    flexShrink: 0,
  },

  changeCol: {
    width: 92,
    alignItems: 'flex-end',
    flexShrink: 0,
  },

  symbolText: {
    fontSize: 16,
    color: '#2B313B',
    marginBottom: 4,
  },

  companyText: {
    fontSize: 12,
    color: '#8A94A6',
  },

  priceText: {
    width: '100%',
    fontSize: 14,
    color: '#374151',
    textAlign: 'right',
  },

  changePill: {
    width: '100%',
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  changePillUp: {
    backgroundColor: '#ECFDF3',
    borderColor: '#B7E6C7',
  },

  changePillDown: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F5C2C7',
  },

  changePillFlat: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },

  changePillText: {
    fontSize: 12,
  },

  changeTextUp: {
    color: '#16A34A',
  },

  changeTextDown: {
    color: '#DC2626',
  },

  changeTextFlat: {
    color: '#6B7280',
  },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  pageBtn: {
    backgroundColor: '#101828',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  pageBtnDisabled: {
    backgroundColor: '#D0D5DD',
  },

  pageBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
  },

  pageText: {
    fontSize: 12,
    color: '#667085',
  },
});

export default SectorDetailScreen;
