import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminSeedSetup() {
  const [seedPhrase, setSeedPhrase] = useState('')
  const [confirmSeed, setConfirmSeed] = useState('')
  const [showSeed, setShowSeed] = useState(false)

  const setupMutation = useMutation({
    mutationFn: async (seedPhrase: string) => {
      const response = await api.post('/wallet/setup-seed', { seedPhrase })
      return response.data
    },
    onSuccess: () => {
      toast.success('Seed phrase saved successfully!')
      setSeedPhrase('')
      setConfirmSeed('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save seed phrase')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (seedPhrase !== confirmSeed) {
      toast.error('Seed phrases do not match')
      return
    }

    const words = seedPhrase.trim().split(/\s+/)
    if (words.length !== 12 && words.length !== 24) {
      toast.error('Seed phrase must be 12 or 24 words')
      return
    }

    if (confirm('Are you sure you want to set this seed phrase? This action cannot be undone!')) {
      setupMutation.mutate(seedPhrase)
    }
  }

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">Wallet Seed Setup</h1>

      <div className="glass-effect rounded-xl p-6 mb-6">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-2">⚠️ CRITICAL SECURITY WARNING</h3>
          <ul className="text-sm space-y-1">
            <li>• This seed phrase controls ALL wallet operations</li>
            <li>• Never share this seed phrase with anyone</li>
            <li>• Store it securely offline</li>
            <li>• Loss of seed phrase = loss of all funds</li>
            <li>• This action is irreversible</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter Seed Phrase (12 or 24 words)
            </label>
            <div className="relative">
              <textarea
                value={seedPhrase}
                onChange={(e) => setSeedPhrase(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400 font-mono"
                rows={3}
                placeholder="Enter your seed phrase..."
                required
                style={{ 
                  WebkitTextSecurity: showSeed ? 'none' : 'disc',
                  fontFamily: showSeed ? 'monospace' : 'inherit'
                }}
              />
              <button
                type="button"
                onClick={() => setShowSeed(!showSeed)}
                className="absolute right-2 top-2 text-sm bg-white/20 px-2 py-1 rounded"
              >
                {showSeed ? '🙈 Hide' : '👁️ Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm Seed Phrase
            </label>
            <textarea
              value={confirmSeed}
              onChange={(e) => setConfirmSeed(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400 font-mono"
              rows={3}
              placeholder="Re-enter your seed phrase..."
              required
              style={{ 
                WebkitTextSecurity: showSeed ? 'none' : 'disc',
                fontFamily: showSeed ? 'monospace' : 'inherit'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={setupMutation.isPending}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 py-3 rounded-lg font-bold transition"
          >
            {setupMutation.isPending ? 'Saving...' : 'Save Seed Phrase'}
          </button>
        </form>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">📋 Setup Instructions</h3>
        <ol className="space-y-2 text-sm text-gray-300">
          <li>1. Generate a new seed phrase using a secure wallet (e.g., MetaMask)</li>
          <li>2. Enter the seed phrase in the field above</li>
          <li>3. Confirm the seed phrase by entering it again</li>
          <li>4. Click "Save Seed Phrase"</li>
          <li>5. The seed will be encrypted with AES-256 and stored in /data/seed.enc</li>
          <li>6. Make sure the SECRET_KEY environment variable is set and secure</li>
        </ol>
      </div>
    </div>
  )
}
