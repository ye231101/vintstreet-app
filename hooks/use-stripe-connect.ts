import { stripeService } from '@/api/services';
import { logger } from '@/utils/logger';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useAuth } from './use-auth';

export interface StripeBalance {
  available: number;
  pending: number;
  totalEarnings: number;
  currency: string;
  accountStatus: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    onboarding_complete: boolean;
  };
}

export function useStripeConnect() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState<StripeBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const checkConnection = async () => {
    if (!user?.id) return;

    try {
      const acct = await stripeService.getConnectedAccount(user.id);
      if (acct) {
        setConnected(Boolean(acct.onboarding_complete && acct.charges_enabled));
      } else {
        setConnected(false);
      }
    } catch (err) {
      logger.error('Error checking Stripe connection:', err);
      setConnected(false);
    }
  };

  const connectAccount = async () => {
    if (!user) {
      throw new Error('Please log in to connect your Stripe account');
    }

    setLoading(true);
    try {
      const data = await stripeService.createConnectAccount();
      if (data?.url) {
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
        } else {
          throw new Error('Unable to open Stripe onboarding URL');
        }
      }
    } catch (err: unknown) {
      logger.error('Error connecting Stripe account:', err);
      throw new Error(err?.message || 'Failed to connect Stripe account');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!user) return;

    setBalanceLoading(true);
    try {
      const data = await stripeService.getSellerBalance();
      setBalance(data as StripeBalance);
      if ((data as unknown)?.accountStatus) {
        setConnected(
          Boolean((data as unknown).accountStatus.onboarding_complete && (data as unknown).accountStatus.charges_enabled)
        );
      }
    } catch (err: unknown) {
      logger.error('Error fetching balance:', err);
      if (!String(err?.message || '').includes('No Stripe account found')) {
        // Surface other errors to caller
        throw new Error(err?.message || 'Failed to fetch balance');
      }
    } finally {
      setBalanceLoading(false);
    }
  };

  const requestPayout = async (amount: number) => {
    if (!user) {
      throw new Error('Please log in to request a payout');
    }

    if (!balance?.accountStatus.payouts_enabled) {
      throw new Error('Payouts are not enabled. Please complete Stripe onboarding.');
    }

    if (amount <= 0 || amount > (balance?.available || 0)) {
      throw new Error('Insufficient balance for this payout');
    }

    await stripeService.createPayout({ amount, currency: balance?.currency || 'gbp' });

    await fetchBalance();
    return true;
  };

  return {
    loading,
    connected,
    balance,
    balanceLoading,
    connectAccount,
    fetchBalance,
    requestPayout,
    checkConnection,
  };
}
