/**
 * Utility functions for admin dashboard user management
 */

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  active: boolean;
  status?: string;
  subscription_status?: string;
  createdAt: string;
  lastLogin?: string;
  _count?: { letters: number; followUps: number };
}

/**
 * Filter users based on subscription status
 * @param users Array of users to filter
 * @param subscriptionFilter The filter value ('all', 'active', 'canceled')
 * @returns Filtered array of users
 */
export function filterUsersBySubscription(users: User[], subscriptionFilter: string): User[] {
  if (subscriptionFilter === 'all') return users;
  if (subscriptionFilter === 'active') {
    return users.filter(user => user.subscription_status === 'ACTIVE');
  }
  if (subscriptionFilter === 'canceled') {
    return users.filter(user => user.subscription_status === 'UNSUBSCRIBED');
  }
  return users;
}

/**
 * Get display text for subscription status
 * @param subscriptionStatus The subscription status value
 * @returns Human-readable status text
 */
export function getSubscriptionStatusDisplay(subscriptionStatus?: string): string {
  if (subscriptionStatus === 'ACTIVE') return 'Active Subscriber';
  if (subscriptionStatus === 'UNSUBSCRIBED') return 'Unsubscribed';
  return 'Unknown';
}

/**
 * Get CSS class for subscription status badge
 * @param subscriptionStatus The subscription status value
 * @returns CSS class string
 */
export function getSubscriptionStatusClass(subscriptionStatus?: string): string {
  if (subscriptionStatus === 'ACTIVE') return 'bg-green-100 text-green-800';
  if (subscriptionStatus === 'UNSUBSCRIBED') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}