import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { markAttendanceByQr } from '../../services/attendanceService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { CheckCircle2, Camera } from 'lucide-react'

export default function StudentScanQrPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const scannerRef = useRef(null)

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}) }, [])

  const start = async () => {
    setScanning(true); setResult(null)
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    try {
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, async (decodedText) => {
        await scanner.stop()
        setScanning(false)
        try {
          const res = await markAttendanceByQr({ qrToken: decodedText, studentId: profile.student_id })
          setResult({ success: true, session: res.session })
          toast.success('Absensi berhasil dicatat.')
        } catch (err) { toast.error(err.message) }
      })
    } catch (err) { toast.error('Tidak bisa mengakses kamera: ' + err.message); setScanning(false) }
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <div className="card text-center space-y-3">
        <h1 className="font-bold text-lg">Absen via QR Code</h1>
        {!scanning && !result && <button className="btn btn-primary w-full" onClick={start}><Camera size={16} />Mulai Scan</button>}
        <div id="qr-reader" className="w-full" />
        {result && (
          <div className="text-green-600 flex flex-col items-center gap-2 py-4">
            <CheckCircle2 size={40} />
            <p className="font-medium">Absensi berhasil!</p>
          </div>
        )}
      </div>
    </div>
  )
}
