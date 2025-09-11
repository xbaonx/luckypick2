import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, loginAsGuest } = useAuthStore()

  const handlePlayAsGuest = async () => {
    if (!user) {
      try {
        await loginAsGuest()
        toast.success('Welcome! You have 1000 FunCoins to play with!')
      } catch (error) {
        toast.error('Failed to start guest session')
        return
      }
    }
    navigate('/game/fun')
  }

  const handlePlayWithUSDT = () => {
    if (!user || user.type === 'guest') {
      navigate('/register')
    } else {
      navigate('/game/usdt')
    }
  }

  return (
    <div className="text-white">
      <div className="text-center py-16">
        <h1 className="text-6xl font-bold mb-4">
          <span className="text-yellow-400">Lucky</span>Pick2
        </h1>
        <p className="text-2xl mb-8">Pick your lucky numbers and win big!</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
          {/* Fun Mode */}
          <div className="glass-effect rounded-2xl p-8">
            <div className="text-4xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">Play for Fun</h2>
            <ul className="text-left space-y-2 mb-6">
              <li>✅ No registration required</li>
              <li>✅ Start with 1000 FunCoins</li>
              <li>✅ Win rate: 5% (1/20)</li>
              <li>✅ Payout: 10x your bet</li>
              <li>✅ Practice your strategy</li>
            </ul>
            <button
              onClick={handlePlayAsGuest}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
            >
              Play Now with FunCoins
            </button>
          </div>

          {/* USDT Mode */}
          <div className="glass-effect rounded-2xl p-8">
            <div className="text-4xl mb-4">💰</div>
            <h2 className="text-2xl font-bold mb-4 text-green-400">Play with USDT</h2>
            <ul className="text-left space-y-2 mb-6">
              <li>✅ Real money gaming</li>
              <li>✅ Deposit via MoonPay</li>
              <li>✅ Win rate: 1% (1/100)</li>
              <li>✅ Payout: 70x your bet</li>
              <li>✅ Instant withdrawals</li>
            </ul>
            <button
              onClick={handlePlayWithUSDT}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
            >
              {!user || user.type === 'guest' ? 'Register to Play' : 'Play with USDT'}
            </button>
          </div>
        </div>

        {/* How to Play */}
        <div className="glass-effect rounded-2xl p-8 mt-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">How to Play</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-4xl mb-2">1️⃣</div>
              <h3 className="font-bold mb-2">Choose Numbers</h3>
              <p>Select any numbers from 00 to 99</p>
            </div>
            <div>
              <div className="text-4xl mb-2">2️⃣</div>
              <h3 className="font-bold mb-2">Place Your Bet</h3>
              <p>Set your bet amount for each number</p>
            </div>
            <div>
              <div className="text-4xl mb-2">3️⃣</div>
              <h3 className="font-bold mb-2">Win Big!</h3>
              <p>Match the winning number to multiply your bet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
