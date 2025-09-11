import { create } from 'zustand'

interface Bet {
  number: number
  amount: number
}

interface GameState {
  mode: 'fun' | 'usdt'
  selectedNumbers: number[]
  betAmounts: Map<number, number>
  defaultBetAmount: number
  lastResult: number | null
  lastWinAmount: number | null
  isPlaying: boolean
  setMode: (mode: 'fun' | 'usdt') => void
  toggleNumber: (number: number) => void
  setBetAmount: (number: number, amount: number) => void
  setDefaultBetAmount: (amount: number) => void
  clearBets: () => void
  setLastResult: (result: number, winAmount: number) => void
  setIsPlaying: (playing: boolean) => void
  getBets: () => Bet[]
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'fun',
  selectedNumbers: [],
  betAmounts: new Map(),
  defaultBetAmount: 10,
  lastResult: null,
  lastWinAmount: null,
  isPlaying: false,

  setMode: (mode) => set({ mode }),

  toggleNumber: (number) => set((state) => {
    const isSelected = state.selectedNumbers.includes(number)
    if (isSelected) {
      const newNumbers = state.selectedNumbers.filter(n => n !== number)
      const newBetAmounts = new Map(state.betAmounts)
      newBetAmounts.delete(number)
      return { selectedNumbers: newNumbers, betAmounts: newBetAmounts }
    } else {
      const newNumbers = [...state.selectedNumbers, number]
      const newBetAmounts = new Map(state.betAmounts)
      newBetAmounts.set(number, state.defaultBetAmount)
      return { selectedNumbers: newNumbers, betAmounts: newBetAmounts }
    }
  }),

  setBetAmount: (number, amount) => set((state) => {
    const newBetAmounts = new Map(state.betAmounts)
    newBetAmounts.set(number, amount)
    return { betAmounts: newBetAmounts }
  }),

  setDefaultBetAmount: (amount) => set({ defaultBetAmount: amount }),

  clearBets: () => set({ 
    selectedNumbers: [], 
    betAmounts: new Map(),
    lastResult: null,
    lastWinAmount: null
  }),

  setLastResult: (result, winAmount) => set({ 
    lastResult: result, 
    lastWinAmount: winAmount 
  }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  getBets: () => {
    const state = get()
    return state.selectedNumbers.map(num => ({
      number: num,
      amount: state.betAmounts.get(num) || state.defaultBetAmount
    }))
  }
}))
