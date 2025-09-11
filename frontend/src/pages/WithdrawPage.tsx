import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function WithdrawPage() {
  const { user, updateBalance } = useAuthStore()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')

  const { data: withdrawRequests, isLoading } = useQuery({
    queryKey: ['withdrawRequests'],
    queryFn: async () => {
      const response = await api.get('/withdraw/my-requests')
      return response.data
    },
    enabled: !!user,
  })

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; toAddress: string }) => {
      const response = await api.post('/withdraw/request', data)
      return response.data
    },
    onSuccess: (data) => {
      toast.success('Withdrawal request submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['withdrawRequests'] })
      // Update balance immediately
      updateBalance(undefined, user!.balanceUsdt - Number(amount))
      setAmount('')
      setAddress('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Withdrawal request failed')
    },
  })

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    
    const withdrawAmount = Number(amount)
    if (withdrawAmount < 10) {
      toast.error('Minimum withdrawal amount is 10 USDT')
      return
    }
    if (withdrawAmount > user!.balanceUsdt) {
      toast.error('Insufficient balance')
      return
    }

    withdrawMutation.mutate({
      amount: withdrawAmount,
      toAddress: address,
    })
  }

  if (!user || user.type !== 'registered') return null

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">Withdraw USDT</h1>

      <div className="glass-effect rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Request Withdrawal</h2>
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount (USDT)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Enter amount to withdraw"
              min="10"
              max={user.balanceUsdt.toString()}
              step="0.01"
              required
            />
            <p className="text-xs text-gray-300 mt-1">
              Available: {user.balanceUsdt.toFixed(2)} USDT | Min: 10 USDT
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Wallet Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Enter your wallet address (BEP-20)"
              required
              pattern="^0x[a-fA-F0-9]{40}$"
            />
            <p className="text-xs text-gray-300 mt-1">
              Enter your BEP-20 (BSC) wallet address
            </p>
          </div>

          <button
            type="submit"
            disabled={withdrawMutation.isPending}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 py-3 rounded-lg font-bold transition"
          >
            {withdrawMutation.isPending ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </form>
      </div>

      <div className="glass-effect rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Withdrawal History</h2>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : withdrawRequests && withdrawRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">TX Hash</th>
                </tr>
              </thead>
              <tbody>
                {withdrawRequests.map((request: any) => (
                  <tr key={request.id} className="border-b border-white/10">
                    <td className="py-2">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">{request.amount} USDT</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        request.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {request.txHash ? (
                        <a
                          href={`https://bscscan.com/tx/${request.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs"
                        >
                          View
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-300">No withdrawal requests yet</p>
        )}
      </div>
    </div>
  )
}
