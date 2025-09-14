import { useEffect, useMemo, useState } from 'react'

function isInAppBrowser(ua: string) {
  const s = ua.toLowerCase()
  // Facebook/Instagram in-app browsers
  return s.includes('fban') || s.includes('fbav') || s.includes('instagram')
}

function isAndroid(ua: string) {
  return /android/i.test(ua)
}

function isIOS(ua: string) {
  return /iphone|ipad|ipod/i.test(ua)
}

export default function OpenInBrowserBanner() {
  const [show, setShow] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const ua = useMemo(() => navigator.userAgent || '', [])
  const android = useMemo(() => isAndroid(ua), [ua])
  const ios = useMemo(() => isIOS(ua), [ua])

  useEffect(() => {
    setShow(isInAppBrowser(ua))
  }, [ua])

  if (!show) return null

  const currentUrl = `${location.protocol}//${location.host}${location.pathname}${location.search}${location.hash}`

  const handleOpenInBrowser = () => {
    try {
      if (android) {
        // Best-effort: Android intent to open default browser
        const intentUrl = `intent://${location.host}${location.pathname}${location.search}${location.hash}#Intent;scheme=${location.protocol.replace(':','')};end`
        window.location.href = intentUrl
        return
      }
      if (ios) {
        // Try Chrome if installed (will no-op if not). FB may block; show help too.
        const chromeUrl = `googlechrome://navigate?url=${encodeURIComponent(currentUrl)}`
        window.location.href = chromeUrl
        // Also show help in case it's blocked
        setTimeout(() => setShowHelp(true), 400)
        return
      }
    } catch {}
    setShowHelp(true)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      alert('Đã copy liên kết. Hãy dán vào trình duyệt mặc định của bạn.')
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = currentUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      alert('Đã copy liên kết. Hãy dán vào trình duyệt mặc định của bạn.')
    }
  }

  return (
    <div className="mb-4">
      <div className="glass-effect border border-yellow-400/30 bg-yellow-500/10 text-yellow-100 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm">
            <div className="font-semibold">Bạn đang mở trong trình duyệt của Facebook</div>
            <div className="opacity-90">Để dùng đầy đủ tính năng (đăng nhập, cài ra màn hình, thông báo…), hãy mở bằng trình duyệt mặc định.</div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleOpenInBrowser} className="bg-yellow-400 text-black hover:bg-yellow-300 px-3 py-1.5 rounded-lg text-sm font-semibold">
              Mở trong trình duyệt
            </button>
            <button onClick={handleCopy} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm">
              Copy link
            </button>
            <button onClick={() => setShowHelp((v) => !v)} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm">
              Hướng dẫn
            </button>
          </div>
        </div>
        {showHelp && (
          <div className="mt-3 text-xs opacity-90 space-y-1">
            {android && (
              <>
                <div>Android:</div>
                <div>• Nhấn nút “Mở trong trình duyệt”. Nếu không được: nhấn ⋮ ở góc trên &gt; “Mở bằng trình duyệt”.</div>
                <div>• Hoặc mở Chrome, gõ/dán link: <span className="font-mono break-all">{currentUrl}</span></div>
              </>
            )}
            {ios && (
              <>
                <div>iPhone/iOS:</div>
                <div>• Trong Facebook, chạm biểu tượng ⋯ hoặc Share &gt; “Open in Browser” (mở Safari).</div>
                <div>• Hoặc chạm “Mở trong trình duyệt”, nếu có Chrome/Firefox cài sẵn sẽ bật ứng dụng.</div>
                <div>• Bạn cũng có thể mở Safari và nhập link: <span className="font-mono break-all">{currentUrl}</span></div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
