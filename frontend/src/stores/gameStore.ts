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
  // Bulk helpers
  selectNumbers: (numbers: number[], amount?: number, replace?: boolean) => void
  unselectNumbers: (numbers: number[]) => void
  setAmountForSelected: (amount: number) => void
  selectRandom: (count: number, amount?: number, replace?: boolean) => void
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
  },

  // Bulk helpers
  selectNumbers: (numbers, amount, replace = false) => set((state) => {
    const newSet = new Set<number>(replace ? [] : state.selectedNumbers)
    numbers.forEach(n => {
      if (n >= 0 && n <= 99) newSet.add(n)
    })
    const newNumbers = Array.from(newSet).sort((a, b) => a - b)
    const newBetAmounts = new Map(state.betAmounts)
    const amt = amount ?? state.defaultBetAmount
    numbers.forEach(n => {
      if (n >= 0 && n <= 99) newBetAmounts.set(n, amt)
    })
    return { selectedNumbers: newNumbers, betAmounts: newBetAmounts }
  }),

  unselectNumbers: (numbers) => set((state) => {
    const remove = new Set(numbers)
    const newNumbers = state.selectedNumbers.filter(n => !remove.has(n))
    const newBetAmounts = new Map(state.betAmounts)
    numbers.forEach(n => newBetAmounts.delete(n))
    return { selectedNumbers: newNumbers, betAmounts: newBetAmounts }
  }),

  setAmountForSelected: (amount) => set((state) => {
    const newBetAmounts = new Map(state.betAmounts)
    state.selectedNumbers.forEach(n => newBetAmounts.set(n, amount))
    return { betAmounts: newBetAmounts }
  }),

  selectRandom: (count, amount, replace = false) => set((state) => {
    const pool: number[] = Array.from({ length: 100 }, (_, i) => i)
    const picked: number[] = []
    const current = new Set(replace ? [] : state.selectedNumbers)
    while (picked.length < count && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length)
      const [n] = pool.splice(idx, 1)
      current.add(n)
      picked.push(n)
    }
    const newNumbers = Array.from(current).sort((a, b) => a - b)
    const newBetAmounts = new Map(state.betAmounts)
    const amt = amount ?? state.defaultBetAmount
    picked.forEach(n => newBetAmounts.set(n, amt))
    return { selectedNumbers: newNumbers, betAmounts: newBetAmounts }
  })
}))
