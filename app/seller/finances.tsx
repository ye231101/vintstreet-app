import { ordersService, stripeService } from '@/api/services';
import { useAuth } from '@/hooks/use-auth';
import { useStripeConnect } from '@/hooks/use-stripe-connect';
import { styles } from '@/styles';
import { logger } from '@/utils/logger';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Transaction = {
  id: string;
  seller_id: string;
  created_at: string;
  status: string;
  seller_net: number | string;
};

type Payout = {
  id: string;
  seller_id: string;
  requested_at: string;
  status: string;
  amount: number | string;
};

export default function FinancesScreen() {
  const { user } = useAuth();
  const { loading, connected, balance, balanceLoading, connectAccount, fetchBalance, requestPayout, checkConnection } =
    useStripeConnect();

  const [sellerOrders, setSellerOrders] = useState<unknown[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (connected && user?.id) {
      fetchBalance().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, user?.id]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const [ordersRes, txList, payoutList] = await Promise.all([
          ordersService.getOrders(user.id, 'seller'),
          stripeService.getTransactions(user.id),
          stripeService.getPayouts(user.id),
        ]);

        setSellerOrders(ordersRes);
        setTransactions((txList as unknown as Transaction[]) || []);
        setPayouts((payoutList as unknown as Payout[]) || []);
      } catch (err) {
        logger.error('Error loading finance data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const availableFromOrders = useMemo(() => {
    return (
      sellerOrders?.reduce((sum: number, order: unknown) => {
        if (order.payout_status === 'available' && order.funds_released) {
          return sum + Number(order.order_amount || 0);
        }
        return sum;
      }, 0) || 0
    );
  }, [sellerOrders]);

  const clearingBalance = useMemo(() => {
    return (
      sellerOrders?.reduce((sum: number, order: unknown) => {
        if (order.payout_status === 'clearing') {
          return sum + Number(order.order_amount || 0);
        }
        return sum;
      }, 0) || 0
    );
  }, [sellerOrders]);

  const monthlyEarnings = useMemo(() => {
    const currentMonth = new Date().getMonth();
    return (
      transactions
        ?.filter((t) => new Date(t.created_at).getMonth() === currentMonth && t.status === 'succeeded')
        .reduce((sum, t) => sum + Number(t.seller_net || 0), 0) || 0
    );
  }, [transactions]);

  const onRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }
    if (amount > availableFromOrders) {
      Alert.alert('Amount Too High', `Maximum available: £${availableFromOrders.toFixed(2)}`);
      return;
    }
    try {
      setRequesting(true);
      await requestPayout(amount);
      setPayoutAmount('');
      Alert.alert('Success', 'Payout requested successfully.');
    } catch (err: unknown) {
      Alert.alert('Payout Failed', err?.message || 'Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  if (!connected) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-inter-bold text-black">Connect Stripe</Text>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-4 p-4">
            <View className="p-4 rounded-lg bg-white shadow-lg">
              <Text className="text-gray-900 text-lg font-inter-bold mb-2">How it works</Text>
              <Text className="text-gray-700 text-sm font-inter mb-1">• Tap Connect Stripe Account below</Text>
              <Text className="text-gray-700 text-sm font-inter mb-1">• Complete onboarding (~5 minutes)</Text>
              <Text className="text-gray-700 text-sm font-inter mb-1">• Start receiving payments once verified</Text>
              <Text className="text-gray-700 text-sm font-inter">• Platform fee 10% per transaction</Text>
            </View>

            <TouchableOpacity
              disabled={loading}
              onPress={() => {
                connectAccount().catch((err) => Alert.alert('Failed', err?.message || 'Could not start onboarding'));
              }}
              className={`rounded-lg p-4 items-center ${loading ? 'bg-gray-400' : 'bg-black'}`}
            >
              <View className="flex-row items-center">
                <Feather name="credit-card" color="#fff" size={18} />
                <Text className="text-white text-base font-inter-bold ml-2">
                  {loading ? 'Connecting…' : 'Connect Stripe Account'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.container}
      >
        <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-inter-bold text-black">Finances</Text>
          <TouchableOpacity onPress={() => fetchBalance().catch(() => {})}>
            <Feather name="refresh-cw" color="#000" size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 p-4 bg-white">
            {!balance?.accountStatus.payouts_enabled ? (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                <Text className="text-yellow-900 text-sm font-inter">
                  Payouts are not enabled yet. Complete Stripe onboarding to enable withdrawals.
                </Text>
                <TouchableOpacity
                  onPress={() => connectAccount().catch((err) => Alert.alert('Failed', err?.message || 'Try again'))}
                  className="mt-2"
                >
                  <Text className="text-blue-600 text-sm font-inter-bold">Complete Onboarding</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <Text className="text-green-900 text-sm font-inter">
                  Your Stripe account is fully set up and ready to receive payments!
                </Text>
              </View>
            )}

            <View className="gap-3 mb-4">
              <View className="flex-row gap-3">
                <View className="bg-white rounded-xl p-4 flex-1 shadow-sm">
                  <Text className="text-gray-600 text-sm font-inter-semibold mb-2">Available Balance</Text>
                  <Text className="text-gray-900 text-2xl font-inter-bold">£{availableFromOrders.toFixed(2)}</Text>
                </View>
                <View className="bg-white rounded-xl p-4 flex-1 shadow-sm">
                  <Text className="text-gray-600 text-sm font-inter-semibold mb-2">Clearing Balance</Text>
                  <Text className="text-gray-900 text-2xl font-inter-bold">£{clearingBalance.toFixed(2)}</Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="bg-white rounded-xl p-4 flex-1 shadow-sm">
                  <Text className="text-gray-600 text-sm font-inter-semibold mb-2">Lifetime Earnings</Text>
                  <Text className="text-gray-900 text-2xl font-inter-bold">
                    {balanceLoading ? 'Loading…' : `£${(balance?.totalEarnings || 0).toFixed(2)}`}
                  </Text>
                </View>
                <View className="bg-white rounded-xl p-4 flex-1 shadow-sm">
                  <Text className="text-gray-600 text-sm font-inter-semibold mb-2">This Month</Text>
                  <Text className="text-gray-900 text-2xl font-inter-bold">£{monthlyEarnings.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <Text className="text-gray-900 text-lg font-inter-bold mb-3">Request Payout</Text>
              <View className="flex-row items-center gap-3">
                <View className="flex-1 bg-gray-100 rounded-lg px-3">
                  <TextInput
                    value={payoutAmount}
                    onChangeText={setPayoutAmount}
                    keyboardType="decimal-pad"
                    placeholder="Amount (£)"
                    placeholderTextColor="#888"
                    className="py-3 text-gray-900 text-base font-inter"
                  />
                </View>
                <TouchableOpacity
                  disabled={!balance?.accountStatus.payouts_enabled || availableFromOrders <= 0 || requesting}
                  onPress={onRequestPayout}
                  className="bg-black rounded-lg px-4 py-3 items-center justify-center"
                >
                  {requesting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-base font-inter-bold">Request</Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600 text-xs font-inter mt-2">
                Available: £{availableFromOrders.toFixed(2)}
              </Text>
            </View>

            <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <Text className="text-gray-900 text-lg font-inter-bold mb-3">Recent Transactions</Text>
              {isLoading ? (
                <ActivityIndicator />
              ) : transactions && transactions.length > 0 ? (
                transactions.slice(0, 5).map((t) => (
                  <View
                    key={t.id}
                    className="flex-row items-center justify-between py-3 border-b border-gray-200 last:border-0"
                  >
                    <View>
                      <Text className="text-gray-900 text-sm font-inter-semibold">Transaction #{t.id.slice(0, 8)}</Text>
                      <Text className="text-gray-600 text-xs font-inter">
                        {new Date(t.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-gray-900 text-sm font-inter-bold">£{Number(t.seller_net).toFixed(2)}</Text>
                      <Text className="text-gray-600 text-xs font-inter capitalize">{t.status}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-gray-600 text-sm font-inter text-center py-2">No transactions yet</Text>
              )}
            </View>

            <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <Text className="text-gray-900 text-lg font-inter-bold mb-3">Payout History</Text>
              {isLoading ? (
                <ActivityIndicator />
              ) : payouts && payouts.length > 0 ? (
                payouts.map((p) => (
                  <View
                    key={p.id}
                    className="flex-row items-center justify-between py-3 border-b border-gray-200 last:border-0"
                  >
                    <View>
                      <Text className="text-gray-900 text-sm font-inter-semibold">Payout #{p.id.slice(0, 8)}</Text>
                      <Text className="text-gray-600 text-xs font-inter">
                        {new Date(p.requested_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-gray-900 text-sm font-inter-bold">£{Number(p.amount).toFixed(2)}</Text>
                      <Text className="text-gray-600 text-xs font-inter capitalize">{p.status}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-gray-600 text-sm font-inter text-center py-2">No payouts requested yet</Text>
              )}
            </View>

            {balance && (
              <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
                <Text className="text-gray-900 text-lg font-inter-bold mb-3">Earnings Breakdown</Text>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-600 text-sm font-inter">Total Earnings</Text>
                  <Text className="text-gray-900 text-sm font-inter-bold">£{balance.totalEarnings.toFixed(2)}</Text>
                </View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-600 text-sm font-inter">Platform Fee (10%)</Text>
                  <Text className="text-red-600 text-sm font-inter-bold">
                    -£{(balance.totalEarnings * 0.1).toFixed(2)}
                  </Text>
                </View>
                <View className="h-px bg-gray-200 my-2" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 text-sm font-inter-bold">Net Earnings (After Fees)</Text>
                  <Text className="text-blue-600 text-sm font-inter-bold">
                    £{(balance.totalEarnings * 0.9).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
