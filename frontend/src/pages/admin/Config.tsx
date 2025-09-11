import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminConfig() {
  const queryClient = useQueryClient()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data: configs, isLoading } = useQuery({
    queryKey: ['adminConfig'],
    queryFn: async () => {
      const response = await api.get('/admin/config')
      return response.data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await api.put(`/admin/config/${key}`, { value })
      return response.data
    },
    onSuccess: () => {
      toast.success('Configuration updated successfully')
      queryClient.invalidateQueries({ queryKey: ['adminConfig'] })
      setEditingKey(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update configuration')
    },
  })

  const handleEdit = (key: string, currentValue: string) => {
    setEditingKey(key)
    setEditValue(currentValue)
  }

  const handleSave = (key: string) => {
    updateMutation.mutate({ key, value: editValue })
  }

  const handleCancel = () => {
    setEditingKey(null)
    setEditValue('')
  }

  if (isLoading) {
    return <div className="text-white text-center">Loading configuration...</div>
  }

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">System Configuration</h1>

      <div className="glass-effect rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Game Settings</h2>
        <div className="space-y-4">
          {configs?.map((config: any) => (
            <div key={config.key} className="border-b border-white/10 pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold">{config.key}</h3>
                  <p className="text-sm text-gray-300 mt-1">{config.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {editingKey === config.key ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded"
                      />
                      <button
                        onClick={() => handleSave(config.key)}
                        disabled={updateMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-3 py-1 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="bg-white/10 px-3 py-1 rounded">
                        {config.value}
                      </span>
                      <button
                        onClick={() => handleEdit(config.key, config.value)}
                        className="bg-primary hover:bg-primary/80 px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">⚙️ Configuration Guide</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div>
            <strong>Win Rates:</strong> Set as percentage (e.g., 5 = 5%)
          </div>
          <div>
            <strong>Payout Multipliers:</strong> Set the multiplication factor for wins
          </div>
          <div>
            <strong>Withdrawal Limits:</strong> Set min/max amounts in USDT
          </div>
          <div>
            <strong>Maintenance Mode:</strong> Set to 'true' to disable gameplay
          </div>
        </div>
      </div>
    </div>
  )
}
