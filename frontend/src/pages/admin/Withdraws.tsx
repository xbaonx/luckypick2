import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminWithdraws() {
  const queryClient = useQueryClient()

  const { data: withdrawRequests, isLoading } = useQuery({
    queryKey: ['adminWithdraws'],
    queryFn: async () => {
      const response = await api.get('/withdraw/pending')
      return response.data
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/withdraw/${id}/approve`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Withdrawal approved successfully')
      queryClient.invalidateQueries({ queryKey: ['adminWithdraws'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve withdrawal')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/withdraw/${id}/reject`, { reason })
      return response.data
    },
    onSuccess: () => {
      toast.success('Withdrawal rejected')
      queryClient.invalidateQueries({ queryKey: ['adminWithdraws'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject withdrawal')
    },
  })

  const handleApprove = (id: string) => {
    if (confirm('Are you sure you want to approve this withdrawal?')) {
      approveMutation.mutate(id)
    }
  }

  const handleReject = (id: string) => {
    const reason = prompt('Enter rejection reason:')
    if (reason) {
      rejectMutation.mutate({ id, reason })
    }
  }

  if (isLoading) {
    return <div className="text-white text-center">Loading withdrawals...</div>
  }

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">Withdrawal Management</h1>

      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Pending Withdrawals</h2>
        
        {withdrawRequests && withdrawRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">To Address</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawRequests.map((request: any) => (
                  <tr key={request.id} className="border-b border-white/10">
                    <td className="py-2">
                      {new Date(request.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2">
                      {request.user?.email || `User ${request.userId.substring(0, 8)}`}
                    </td>
                    <td className="py-2 font-bold">
                      {request.amount} USDT
                    </td>
                    <td className="py-2">
                      <span className="font-mono text-xs">
                        {request.toAddress.substring(0, 10)}...{request.toAddress.substring(32)}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                        {request.status}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={approveMutation.isPending}
                          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-3 py-1 rounded text-sm transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={rejectMutation.isPending}
                          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1 rounded text-sm transition"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-300">No pending withdrawals</p>
        )}
      </div>

      <div className="glass-effect rounded-xl p-6 mt-6">
        <h3 className="text-lg font-bold mb-4">⚠️ Important Notes</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• Always verify the withdrawal address before approving</li>
          <li>• Check user's balance and transaction history</li>
          <li>• Approved withdrawals will be processed immediately</li>
          <li>• Rejected withdrawals will refund the amount to user's balance</li>
          <li>• Make sure the admin wallet has sufficient USDT and gas</li>
        </ul>
      </div>
    </div>
  )
}
