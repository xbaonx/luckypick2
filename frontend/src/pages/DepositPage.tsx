import { useState } from 'react'
import type React from 'react'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function DepositPage() {
  const { user } = useAuthStore()
  const [amount, setAmount] = useState('100')
  const [loading] = useState(false)

  const handleMoonPayDeposit = () => {
    if (!user?.walletAddress) {
      toast.error('Wallet address not found')
      return
    }
    // Copy wallet address so user can paste it in MoonPay
    try {
      navigator.clipboard?.writeText(user.walletAddress)
      toast.success('Copied your wallet address. Paste it in MoonPay when asked.')
    } catch {}

    // Use MoonPay consumer link in the requested format (no apiKey):
    // https://buy.moonpay.com/?currencyCode=usdt_bsc&baseCurrencyCode=usd&baseCurrencyAmount=...
    // User will paste their wallet address manually during checkout.
    const params = new URLSearchParams({
      currencyCode: 'usdt_bsc', // USDT on BSC (BEP-20)
      baseCurrencyCode: 'usd',
      baseCurrencyAmount: amount,
    })
    const moonPayUrl = `https://buy.moonpay.com/?${params.toString()}`
    
    // Open MoonPay in new window
    window.open(moonPayUrl, '_blank', 'width=600,height=800')
    
    toast.success('MoonPay window opened. Complete your purchase there.')
  }

  const handleCopyAddress = async () => {
    if (!user?.walletAddress) return
    try {
      await navigator.clipboard.writeText(user.walletAddress)
      toast.success('Deposit address copied')
    } catch (e) {
      toast.error('Failed to copy address')
    }
  }

  if (!user || user.type !== 'registered') return null

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">Deposit USDT</h1>

      <div className="glass-effect rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Your Deposit Address</h2>
        <div className="bg-black/30 p-4 rounded-lg">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="font-mono text-sm break-all">{user.walletAddress}</div>
            <button
              onClick={handleCopyAddress}
              className="shrink-0 bg-white/10 hover:bg-white/20 text-xs px-3 py-1.5 rounded-md transition"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-300">
            Send USDT (BEP-20) to this address. Funds will be credited automatically within 1–2 minutes after on-chain confirmation.
          </p>
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Deposit USDT with MoonPay</h2>
        <p className="mb-4 text-gray-300">
          We will open MoonPay with USDT (BEP-20) and your USD amount prefilled. Paste your deposit address when asked.
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
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
          Deposit USDT with MoonPay
        </button>
      </div>

      <div className="glass-effect rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">How it works</h2>
        <ol className="space-y-3">
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">1.</span>
            <span>Click “Deposit USDT with MoonPay”. We’ll open MoonPay in a new tab with USDT (BEP‑20) and your USD amount prefilled.</span>
          </li>
        </ol>
        <ol className="space-y-3 mt-2">
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">2.</span>
            <span>Paste your deposit address when asked (you can also use the Copy button above).</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">3.</span>
            <span>Complete payment. USDT (BEP‑20) will arrive shortly; your balance updates automatically within 1–2 minutes.</span>
          </li>
        </ol>
      </div>

      {/* US Users Guidance */}
      <div className="glass-effect rounded-2xl p-6 mt-6 border border-yellow-400/40">
        <h2 className="text-xl font-bold mb-3 text-yellow-300">For US Users 🇺🇸</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-200">
          <li>Some providers may not support BNB Smart Chain (BEP‑20) in certain regions.</li>
          <li>
            If BSC isn’t available for you:
            <ul className="list-[circle] list-inside mt-1 space-y-1">
              <li>Buy USDT on an exchange/wallet that supports BSC withdrawals, then withdraw to the address above.</li>
              <li>Or buy on another network (e.g., Ethereum) and bridge to BSC before sending to your deposit address.</li>
            </ul>
          </li>
          <li>Always send on BSC (BEP‑20). Transfers from other networks won’t be credited.</li>
        </ul>
      </div>
    </div>
  )
}
