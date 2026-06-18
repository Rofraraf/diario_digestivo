import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { Download, Upload, FileText, Table2 } from 'lucide-react'
import { db, exportAllData, importAllData } from '../../db'
import { Card, BigButton, TextInput, SelectRow, Toast } from '../../components/UI'
import { MEAL_TYPE_LABELS, BRISTOL_DESCRIPTIONS } from '../../constants/catalogs'

export default function ExportPage() {
  const [alias, setAlias] = useState('')
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ─── PDF export ─────────────────────────────────────────────────────────────
  async function exportPDF() {
    setLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const [meals, symptoms, bathroom, medications, _factors] = await Promise.all([
        db.meals.where('date').between(startDate, endDate, true, true).toArray(),
        db.symptoms.where('date').between(startDate, endDate, true, true).toArray(),
        db.bathroom.where('date').between(startDate, endDate, true, true).toArray(),
        db.medications.where('date').between(startDate, endDate, true, true).toArray(),
        db.dailyFactors.where('date').between(startDate, endDate, true, true).toArray(),
      ])

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      let y = 20

      // Header
      doc.setFontSize(20)
      doc.setTextColor(45, 106, 79)
      doc.text('Diario Digestivo', 20, y)
      y += 8
      doc.setFontSize(11)
      doc.setTextColor(107, 114, 128)
      doc.text(`Paciente: ${alias || 'No especificado'}`, 20, y)
      y += 6
      doc.text(`Período: ${startDate} a ${endDate}`, 20, y)
      y += 6
      doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, y)
      y += 10

      // Disclaimer
      doc.setFillColor(254, 243, 199)
      doc.roundedRect(20, y, 170, 10, 2, 2, 'F')
      doc.setFontSize(9)
      doc.setTextColor(146, 64, 14)
      doc.text('Informe generado a partir de registros personales. No constituye diagnóstico médico.\nAntes de modificar dieta o medicación, consultar siempre con el médico.', 25, y + 6)
      y += 16

      // Resumen
      doc.setFontSize(14)
      doc.setTextColor(26, 26, 46)
      doc.text('Resumen del período', 20, y)
      y += 8
      doc.setFontSize(11)
      doc.setTextColor(107, 114, 128)
      const maxIntensity = symptoms.length > 0 ? Math.max(...symptoms.map(s => s.intensity)) : 0
      const avgIntensity = symptoms.length > 0 ? (symptoms.reduce((s, e) => s + e.intensity, 0) / symptoms.length).toFixed(1) : '0'
      doc.text(`Total comidas registradas: ${meals.length}`, 20, y); y += 5
      doc.text(`Total síntomas registrados: ${symptoms.length}`, 20, y); y += 5
      doc.text(`Intensidad máxima: ${maxIntensity}/5  |  Media: ${avgIntensity}/5`, 20, y); y += 5
      doc.text(`Visitas al baño registradas: ${bathroom.length}`, 20, y); y += 5
      doc.text(`Medicaciones registradas: ${medications.length}`, 20, y); y += 10

      // Top symptoms
      if (symptoms.length > 0) {
        const symCounts: Record<string, number> = {}
        symptoms.forEach(s => s.symptomNames.forEach(n => { symCounts[n] = (symCounts[n] || 0) + 1 }))
        const topSyms = Object.entries(symCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
        doc.setFontSize(13)
        doc.setTextColor(26, 26, 46)
        doc.text('Síntomas más frecuentes', 20, y); y += 6
        autoTable(doc, {
          startY: y,
          head: [['Síntoma', 'Veces']],
          body: topSyms.map(([name, count]) => [name, String(count)]),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [45, 106, 79] },
          margin: { left: 20, right: 20 },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      }

      // Days with most pain
      if (symptoms.length > 0) {
        const byDate: Record<string, number> = {}
        symptoms.forEach(s => { byDate[s.date] = Math.max(byDate[s.date] || 0, s.intensity) })
        const worstDays = Object.entries(byDate).sort((a, b) => b[1] - a[1]).slice(0, 5)
        doc.setFontSize(13)
        doc.setTextColor(26, 26, 46)
        doc.text('Días con más molestias', 20, y); y += 6
        autoTable(doc, {
          startY: y,
          head: [['Fecha', 'Intensidad máx.']],
          body: worstDays.map(([date, intensity]) => [date, `${intensity}/5`]),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [231, 111, 81] },
          margin: { left: 20, right: 20 },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      }

      // Bathroom summary
      if (bathroom.length > 0) {
        if (y > 230) { doc.addPage(); y = 20 }
        doc.setFontSize(13)
        doc.setTextColor(26, 26, 46)
        doc.text('Resumen deposiciones', 20, y); y += 6
        const bristolCounts: Record<string, number> = {}
        bathroom.forEach(b => {
          if (b.went && b.bristolType) {
            const key = `Tipo ${b.bristolType}`
            bristolCounts[key] = (bristolCounts[key] || 0) + 1
          }
        })
        autoTable(doc, {
          startY: y,
          head: [['Tipo Bristol', 'Veces']],
          body: Object.entries(bristolCounts),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 20, right: 20 },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      }

      // Medication
      if (medications.length > 0) {
        if (y > 230) { doc.addPage(); y = 20 }
        doc.setFontSize(13)
        doc.setTextColor(26, 26, 46)
        doc.text('Medicación tomada', 20, y); y += 6
        const medCounts: Record<string, number> = {}
        medications.forEach(m => { medCounts[m.medicationName] = (medCounts[m.medicationName] || 0) + 1 })
        autoTable(doc, {
          startY: y,
          head: [['Medicamento', 'Veces tomado']],
          body: Object.entries(medCounts),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [139, 92, 246] },
          margin: { left: 20, right: 20 },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(156, 163, 175)
        doc.text('Diario Digestivo — Uso personal. No constituye diagnóstico médico.', 20, 287)
        doc.text(`Pág. ${i}/${pageCount}`, 185, 287)
      }

      doc.save(`diario-digestivo-${startDate}-${endDate}.pdf`)
      showToast('PDF exportado correctamente')
    } catch (e) {
      showToast('Error al generar el PDF')
    }
    setLoading(false)
  }

  // ─── CSV export ─────────────────────────────────────────────────────────────
  async function exportCSV() {
    setLoading(true)
    const [meals, symptoms, bathroom, medications] = await Promise.all([
      db.meals.where('date').between(startDate, endDate, true, true).toArray(),
      db.symptoms.where('date').between(startDate, endDate, true, true).toArray(),
      db.bathroom.where('date').between(startDate, endDate, true, true).toArray(),
      db.medications.where('date').between(startDate, endDate, true, true).toArray(),
    ])

    const rows: string[] = [
      'tipo,fecha,hora,detalle,intensidad,notas',
      ...meals.flatMap(m => m.items.map(item =>
        `comida,${m.date},${format(new Date(m.createdAt), 'HH:mm')},${MEAL_TYPE_LABELS[m.type]}: ${item.foodName} (${item.quantity} - ${item.preparation}),,"${m.notes || ''}"`
      )),
      ...symptoms.map(s =>
        `sintoma,${s.date},${format(new Date(s.datetime), 'HH:mm')},"${s.symptomNames.join('; ')}",${s.intensity},"${s.notes || ''}"`
      ),
      ...bathroom.map(b =>
        `bano,${b.date},${format(new Date(b.datetime), 'HH:mm')},${b.went ? (b.bristolType ? BRISTOL_DESCRIPTIONS[b.bristolType] : 'Fue al bano') : 'No fue al bano'},,"${b.notes || ''}"`
      ),
      ...medications.map(m =>
        `medicacion,${m.date},${format(new Date(m.datetime), 'HH:mm')},${m.medicationName}: ${m.dose || 'sin dosis'},,${m.improvement || ''}`
      ),
    ]

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `diario-digestivo-${startDate}-${endDate}.csv`)
    showToast('CSV exportado correctamente')
    setLoading(false)
  }

  // ─── JSON export ─────────────────────────────────────────────────────────────
  async function exportJSON() {
    setLoading(true)
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `diario-digestivo-backup-${format(new Date(), 'yyyyMMdd')}.json`)
    showToast('Copia de seguridad exportada')
    setLoading(false)
  }

  // ─── JSON import ─────────────────────────────────────────────────────────────
  async function importJSON(file: File) {
    setLoading(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      showToast('Datos importados correctamente')
    } catch {
      showToast('Error al importar. Fichero no válido.')
    }
    setLoading(false)
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-content px-4 pt-4">
      <h2 className="text-[22px] font-bold text-[#1A1A2E] mb-1">Exportar datos</h2>
      <p className="text-[14px] text-[#6B7280] mb-5">Comparte el informe con tu médico</p>

      {/* Patient alias */}
      <Card className="mb-4">
        <TextInput
          label="Nombre o alias del paciente"
          value={alias}
          onChange={setAlias}
          placeholder="Ej: Juan García"
        />
      </Card>

      {/* Date range */}
      <Card className="mb-5">
        <span className="block text-[15px] font-semibold text-[#374151] mb-3">Período de fechas</span>
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <span className="block text-[13px] text-[#6B7280] mb-1">Desde</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[15px] focus:outline-none focus:border-[#2D6A4F]"
            />
          </div>
          <div className="flex-1">
            <span className="block text-[13px] text-[#6B7280] mb-1">Hasta</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[15px] focus:outline-none focus:border-[#2D6A4F]"
            />
          </div>
        </div>
        <SelectRow
          label="Acceso rápido"
          options={[
            { value: '7', label: '7 días' },
            { value: '30', label: '30 días' },
            { value: '90', label: '3 meses' },
          ]}
          value=""
          onChange={v => {
            setStartDate(format(subDays(new Date(), parseInt(v)), 'yyyy-MM-dd'))
            setEndDate(format(new Date(), 'yyyy-MM-dd'))
          }}
        />
      </Card>

      {/* Export buttons */}
      <div className="space-y-3 mb-6">
        <BigButton
          icon={<FileText size={20} />}
          onClick={exportPDF}
          disabled={loading}
          variant="primary"
        >
          Exportar informe PDF
        </BigButton>
        <BigButton
          icon={<Table2 size={20} />}
          onClick={exportCSV}
          disabled={loading}
          variant="secondary"
        >
          Exportar datos CSV
        </BigButton>
      </div>

      {/* Backup section */}
      <Card className="mb-4">
        <h3 className="text-[16px] font-bold text-[#1A1A2E] mb-3">Copia de seguridad</h3>
        <p className="text-[14px] text-[#6B7280] mb-4">
          Exporta todos tus datos como archivo JSON para guardarlos o transferirlos a otro dispositivo.
        </p>
        <div className="space-y-3">
          <BigButton
            icon={<Download size={18} />}
            onClick={exportJSON}
            disabled={loading}
            variant="ghost"
          >
            Exportar copia de seguridad (.json)
          </BigButton>
          <label className="block">
            <div className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-[#2D6A4F] bg-[#F0FDF4] text-[#2D6A4F] py-4 font-semibold text-[17px] cursor-pointer active:scale-95 transition-all">
              <Upload size={20} />
              Importar copia de seguridad
            </div>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) importJSON(file)
              }}
            />
          </label>
        </div>
      </Card>

      <p className="text-[12px] text-[#9CA3AF] text-center px-4">
        Los datos se guardan solo en este dispositivo y no se envían a ningún servidor.
      </p>

      {toast && <Toast message={toast} />}
    </div>
  )
}
