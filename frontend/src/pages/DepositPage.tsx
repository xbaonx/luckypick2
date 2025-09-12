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

    // Use MoonPay consumer site (no apiKey). Prefill USDT on BSC and amount in USD.
    // User will paste their wallet address manually during checkout.
    const params = new URLSearchParams({
      currencyCode: 'usdt',
      baseCurrencyCode: 'usd',
      baseCurrencyAmount: amount,
      network: 'bsc', // BEP-20 (BSC)
    })
    const moonPayUrl = `https://www.moonpay.com/buy/usdt?${params.toString()}`
    
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
        <h2 className="text-xl font-bold mb-4">Buy USDT with MoonPay (No API Key)</h2>
        <p className="mb-4 text-gray-300">
          We will open MoonPay's website with USDT (BEP-20) and your USD amount prefilled. Paste your wallet address when MoonPay asks for a destination address.
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
          Buy USDT with MoonPay
        </button>
      </div>

      <div className="glass-effect rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">How it Works</h2>
        <ol className="space-y-3">
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">1.</span>
            <span>Click "Buy USDT with MoonPay" (we'll open their website in a new tab)</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">2.</span>
            <span>Paste your wallet address when asked (we copied it to your clipboard)</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">3.</span>
            <span>Complete KYC if required (first time only) and pay by card</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">4.</span>
            <span>USDT (BEP-20) will be sent to your address</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2">5.</span>
            <span>Your balance updates automatically within 1–2 minutes</span>
          </li>
        </ol>
      </div>

      {/* US Users Guidance */}
      <div className="glass-effect rounded-2xl p-6 mt-6 border border-yellow-400/40">
        <h2 className="text-xl font-bold mb-3 text-yellow-300">For US Users 🇺🇸</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-200">
          <li>
            Some card providers or regions may limit purchases on <span className="font-semibold">BNB Smart Chain (BEP‑20)</span>.
          </li>
          <li>
            If MoonPay does not allow BSC in your region, you can:
            <ul className="list-[circle] list-inside mt-1 space-y-1">
              <li>
                Buy USDT on a US‑compliant exchange or wallet that supports <span className="font-semibold">BSC withdrawals</span>, then withdraw to the deposit address above (make sure to choose the <span className="font-semibold">BEP‑20 / BSC</span> network).
              </li>
              <li>
                Or buy USDT on another network (e.g. Ethereum) and <span className="font-semibold">bridge to BSC</span> using a trusted cross‑chain bridge, then send to your deposit address.
              </li>
            </ul>
          </li>
          <li>
            Always send on <span className="font-semibold">BSC (BEP‑20)</span>. Sending from other networks (Ethereum, Polygon, etc.) to this address will not be credited.
          </li>
        </ul>
      </div>
    </div>
  )
}
