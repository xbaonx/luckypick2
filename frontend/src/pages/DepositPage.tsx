import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function DepositPage() {
  const { user } = useAuthStore()
  const [amount, setAmount] = useState('100')
  const [loading, setLoading] = useState(false)

  const handleMoonPayDeposit = () => {
    if (!user?.walletAddress) {
      toast.error('Wallet address not found')
      return
    }

    const moonPayUrl = `https://buy.moonpay.com/?apiKey=YOUR_API_KEY&currencyCode=usdt&walletAddress=${user.walletAddress}&defaultCurrencyCode=usd&baseCurrencyAmount=${amount}`
    
    // Open MoonPay in new window
    window.open(moonPayUrl, '_blank', 'width=600,height=800')
    
    toast.success('MoonPay window opened. Complete your purchase there.')
  }

  if (!user || user.type !== 'registered') return null

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">Deposit USDT</h1>

      <div className="glass-effect rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Your Deposit Address</h2>
        <div className="bg-black/30 p-4 rounded-lg">
          <div className="font-mono text-sm break-all mb-2">{user.walletAddress}</div>
          <p className="text-xs text-gray-300">
            Send USDT (BEP-20) to this address. Funds will be credited automatically.
          </p>
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Buy USDT with MoonPay</h2>
        <p className="mb-4 text-gray-300">
          Purchase USDT directly with your credit/debit card through MoonPay.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Amount (USD)</label>
          <div className="flex space-x-2">
            {['50', '100', '250', '500'].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`px-4 py-2 rounded-lg transition ${
                  amount === val 
                    ? 'bg-primary text-white' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400"
            placeholder="Enter custom amount"
            min="30"
            max="10000"
          />
        </div>

        <button
          onClick={handleMoonPayDeposit}
          disabled={loading || !amount || Number(amount) < 30}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 py-3 rounded-lg font-bold transition"
        >
          Buy USDT with MoonPay
        </button>
      </div>

      <div className="glass-effect rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">How it Works</h2>
        <ol className="space-y-3">
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">1.</span>
            <span>Click "Buy USDT with MoonPay" to open the payment window</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">2.</span>
            <span>Complete KYC verification if required (first time only)</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">3.</span>
            <span>Pay with your credit/debit card</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">4.</span>
            <span>USDT will be sent to your wallet address</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">5.</span>
            <span>Your balance will update automatically within 1-2 minutes</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
