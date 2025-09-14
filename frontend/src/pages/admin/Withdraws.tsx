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

  // Load all withdrawals for history section
  const { data: allWithdraws, isLoading: isLoadingAll } = useQuery({
    queryKey: ['adminWithdrawsAll'],
    queryFn: async () => {
      const response = await api.get('/withdraw/all')
      return response.data
    },
  })

  // Approve temporarily disabled (manual processing). Keep only Reject.

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/withdraw/${id}/reject`, { reason })
      return response.data
    },
    onSuccess: () => {
      toast.success('Withdrawal rejected')
      queryClient.invalidateQueries({ queryKey: ['adminWithdraws'] })
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawsAll'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject withdrawal')
    },
  })

  // Approve handler removed

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, txRef }: { id: string; txRef?: string }) => {
      try {
        // Simplified endpoint that uses rejectWithdraw with special reason
        const response = await api.post(`/withdraw/mark-paid`, { id, txRef })
        return response.data
      } catch (err: any) {
        throw err
      }
    },
    onSuccess: () => {
      toast.success('Marked as paid')
      queryClient.invalidateQueries({ queryKey: ['adminWithdraws'] })
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawsAll'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark as paid')
    },
  })

  const handleReject = (id: string) => {
    const reason = prompt('Enter rejection reason:')
    if (reason) {
      rejectMutation.mutate({ id, reason })
    }
  }

  const handleMarkPaid = (id: string) => {
    const txRef = prompt('Optional: enter external TX reference or note')
    markPaidMutation.mutate({ id, txRef: txRef || undefined })
  }

  if (isLoading) {
    return <div className="text-white text-center">Loading withdrawals...</div>
  }

  return (
    <div className="text-white">
      <div className="flex items-end justify-between mb-2">
        <h1 className="text-3xl font-bold">Withdrawal Management</h1>
        <span className="text-xs text-gray-300">UI v-20250914-3</span>
      </div>
      <div className="h-4" />

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
                        {/* Approve button removed (manual processing) */}
                        <button
                          onClick={() => handleMarkPaid(request.id)}
                          disabled={markPaidMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1 rounded text-sm transition"
                        >
                          Đánh dấu đã trả (Thủ công)
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

      {/* Withdrawal history (completed/rejected) */}
      <div className="glass-effect rounded-xl p-6 mt-6">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-bold">Withdrawal History</h2>
          {!isLoadingAll && (
            <span className="text-xs text-gray-300">{(allWithdraws?.length || 0)} records</span>
          )}
        </div>

        {isLoadingAll ? (
          <div className="text-white text-center">Loading history...</div>
        ) : allWithdraws && allWithdraws.filter((r: any) => r.status !== 'pending').length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">To Address</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Tx Ref / Reason</th>
                </tr>
              </thead>
              <tbody>
                {allWithdraws
                  .filter((request: any) => request.status !== 'pending')
                  .map((request: any) => (
                    <tr key={request.id} className="border-b border-white/10">
                      <td className="py-2">{new Date(request.createdAt).toLocaleString()}</td>
                      <td className="py-2">{request.user?.email || `User ${request.userId.substring(0, 8)}`}</td>
                      <td className="py-2 font-bold">{request.amount} USDT</td>
                      <td className="py-2">
                        <span className="font-mono text-xs">
                          {request.toAddress.substring(0, 10)}...{request.toAddress.substring(32)}
                        </span>
                      </td>
                      <td className="py-2">
                        {request.status === 'completed' && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">completed</span>
                        )}
                        {request.status === 'rejected' && (
                          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">rejected</span>
                        )}
                        {request.status === 'approved' && (
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">approved</span>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-col text-xs">
                          {request.txHash && (
                            <span className="font-mono">{request.txHash}</span>
                          )}
                          {request.rejectReason && (
                            <span className="text-red-300/80">Reason: {request.rejectReason}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-300">No withdrawal history yet</p>
        )}
      </div>

      <div className="glass-effect rounded-xl p-6 mt-6">
        <h3 className="text-lg font-bold mb-4">⚠️ Important Notes</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• Approve is temporarily disabled — process withdrawals manually using the admin wallet.</li>
          <li>• Use "Mark as Paid" after you have sent funds externally to mark the request completed.</li>
          <li>• Always verify the withdrawal address before sending funds.</li>
          <li>• Check user's balance and transaction history.</li>
          <li>• Use Reject to cancel a request and refund the amount to the user's balance.</li>
          <li>• Ensure the admin wallet has sufficient USDT and gas.</li>
        </ul>
      </div>
    </div>
  )
}
